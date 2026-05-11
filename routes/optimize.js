// routes/optimize.js
const express = require('express');
const router = express.Router();
const routeCache = require('../services/cache');
const { otimizarRotaAvancada } = require('../otimizador/index');
const multer = require('multer');
const XLSX = require('xlsx');
const upload = multer({ storage: multer.memoryStorage() });

router.use((req, res, next) => { req.startTime = Date.now(); next(); });

function detectarTipo(e) {
  if (!e) return 'casa';
  var x = e.toLowerCase();
  if (/condominio|condomínio|residencial|bloco|torre|conjunto|parque/i.test(x)) return 'condominio';
  if (/apto|apartamento|sala|loja/i.test(x)) return 'apto';
  return 'casa';
}

function toRad(d) { return d * Math.PI / 180; }
function haversine(a, b) {
  var R = 6371;
  var dLat = toRad(b.lat - a.lat);
  var dLng = toRad(b.lng - a.lng);
  var h = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)*Math.sin(dLng/2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function twoOpt(points) {
  var r = points.slice(), imp = true;
  while (imp) {
    imp = false;
    for (var i = 1; i < r.length - 2; i++) {
      for (var j = i + 1; j < r.length - 1; j++) {
        if (haversine(r[i-1],r[i]) + haversine(r[j],r[j+1]) > haversine(r[i-1],r[j]) + haversine(r[i],r[j+1])) {
          var t = r.slice(i, j+1).reverse();
          r = r.slice(0, i).concat(t, r.slice(j+1));
          imp = true;
        }
      }
    }
  }
  return r;
}

function processarPlanilha(txt, fn) {
  var linhas = txt.split(/\r?\n/).filter(function(l) { return l.trim(); });
  if (linhas.length < 2) return [];
  var cab = linhas[0].split(',').map(function(h) { return h.trim().replace(/"/g, '').toLowerCase(); });
  var pf = fn.toLowerCase().includes('amazon') ? 'amazon' : fn.toLowerCase().includes('shopee') ? 'shopee' : fn.toLowerCase().includes('meli')||fn.toLowerCase().includes('mercado') ? 'meli' : 'outro';
  var cEnd = cab.findIndex(function(h) { return h.includes('destination') || h.includes('address') || h.includes('endereco') || h.includes('destino') || h.includes('rua') || h.includes('logradouro'); });
  var cLat = cab.findIndex(function(h) { return h.includes('latitude') || h.includes('lat') || h === 'y'; });
  var cLng = cab.findIndex(function(h) { return h.includes('longitude') || h.includes('lng') || h.includes('lon') || h === 'x'; });
  var cBai = cab.findIndex(function(h) { return h.includes('bairro') || h.includes('district'); });
  var pts = [];
  for (var i = 1; i < linhas.length; i++) {
    var cols = linhas[i].split(',').map(function(c) { return c.trim().replace(/"/g, ''); });
    if (cols.length < 3) continue;
    var lat = cLat >= 0 ? parseFloat(String(cols[cLat]).replace(',', '.')) : NaN;
    var lng = cLng >= 0 ? parseFloat(String(cols[cLng]).replace(',', '.')) : NaN;
    if (isNaN(lat) || isNaN(lng)) continue;
    var end = cEnd >= 0 ? cols[cEnd] : '';
    pts.push({ nome: end, lat: lat, lng: lng, bairro: cBai >= 0 ? cols[cBai] : '', tipo: detectarTipo(end), fonte: pf });
  }
  return pts;
}

// POST /api/optimize
router.post('/', async function(req, res) {
  try {
    var paradas = req.body.paradas;
    if (!paradas || !Array.isArray(paradas) || paradas.length < 2) {
      return res.status(400).json({ error: 'Mínimo 2 paradas' });
    }
    if (paradas.length > 150) {
      return res.status(400).json({ error: 'Máximo 150 paradas' });
    }
    for (var i = 0; i < paradas.length; i++) {
      var p = paradas[i];
      if (!p.lat || !p.lng || isNaN(p.lat) || isNaN(p.lng)) {
        return res.status(400).json({ error: 'Coordenadas inválidas na parada ' + (i+1) });
      }
      p.lat = parseFloat(p.lat);
      p.lng = parseFloat(p.lng);
    }
    var cached = routeCache.get(paradas);
    if (cached) return res.json({ success: true, cached: true, ...cached });
    var resultado = await otimizarRotaAvancada(paradas);
    routeCache.set(paradas, resultado, 600000);
    res.json({ success: true, cached: false, ...resultado });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/upload
router.post('/upload', upload.single('file'), async function(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo' });
    var fn = req.file.originalname || '', txt = '';
    if (fn.endsWith('.xlsx') || fn.endsWith('.xls')) {
      var wb = XLSX.read(req.file.buffer, { type: 'buffer' });
      txt = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
    } else { txt = req.file.buffer.toString('utf8'); }
    var pts = processarPlanilha(txt, fn);
    if (pts.length < 2) return res.status(400).json({ error: 'Poucos endereços. Encontrados: ' + pts.length });
    var opt = twoOpt(pts), km = 0;
    for (var i = 0; i < opt.length - 1; i++) km += haversine(opt[i], opt[i+1]);
    res.json({
      success: true,
      plataforma: pts[0]?.fonte || 'outro',
      totalParadas: opt.length,
      totalKm: +km.toFixed(2),
      totalMin: Math.round(km / 0.35),
      economia: Math.max(5, Math.min(35, Math.round(opt.length * 2.3))),
      lucroEstimado: +(opt.length * 12.75).toFixed(2),
      paradas: opt.map(function(p, i) { return { ordem: i+1, nome: p.nome, lat: p.lat, lng: p.lng, bairro: p.bairro||'', tipo: p.tipo, fonte: p.fonte }; })
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/optimize/limits
router.get('/limits', function(req, res) {
  res.json({
    maximoParadas: 150,
    faixas: {
      normal: { min: 2, max: 60, qualidade: 'máxima' },
      alto: { min: 61, max: 100, qualidade: 'equilibrada' },
      pesado: { min: 101, max: 150, qualidade: 'rápida' },
    },
    cache: routeCache.getStats(),
  });
});

module.exports = router;
