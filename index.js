var express = require('express');
var cors = require('cors');
var multer = require('multer');
var XLSX = require('xlsx');
var path = require('path');
var upload = multer({ storage: multer.memoryStorage() });
var app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ============================================================
// UTILITÁRIOS
// ============================================================
function toRad(d){ return d * Math.PI / 180; }

function haversine(a, b) {
  var R = 6371;
  var dLat = toRad(b.lat - a.lat);
  var dLng = toRad(b.lng - a.lng);
  var h = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)*Math.sin(dLng/2);
  return R * 2 * Math.asin(Math.sqrt(h));
}

function twoOpt(p) {
  var r = p.slice(), imp = true, iter = 0;
  while (imp && iter < 500) {
    imp = false; iter++;
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

function detectarTipo(endereco) {
  if (!endereco) return 'casa';
  var e = endereco.toLowerCase();
  if (/condominio|condomínio|residencial|bloco\s*\d|torre\s*\d|conjunto|parque|cdhu|predio|prédio|portaria/i.test(e)) {
    if (/ap\s*\d|apto\s*\d|apartamento|bloco\s*\d|torre\s*\d/i.test(e)) return 'apto';
    return 'condominio';
  }
  if (/apto|apartamento|ap\s*\d|andar|sala\s*\d|loja\s*\d|conj\s*\d/i.test(e)) return 'apto';
  if (/casa|sobrado|viela|beco|fundo/i.test(e)) return 'casa';
  return 'casa';
}

function agruparProximos(paradas, raioKm) {
  if (paradas.length < 2) return paradas;
  var grupos = [];
  var visitados = new Set();
  
  for (var i = 0; i < paradas.length; i++) {
    if (visitados.has(i)) continue;
    var grupo = [paradas[i]];
    visitados.add(i);
    
    for (var j = i + 1; j < paradas.length; j++) {
      if (visitados.has(j)) continue;
      var d = haversine(paradas[i], paradas[j]);
      if (d <= raioKm) {
        grupo.push(paradas[j]);
        visitados.add(j);
      }
    }
    grupos.push(grupo);
  }
  
  return grupos.map(function(g) {
    if (g.length === 1) return g[0];
    var lat = 0, lng = 0;
    g.forEach(function(p) { lat += p.lat; lng += p.lng; });
    lat /= g.length; lng /= g.length;
    
    var nomes = g.map(function(p) { return p.nome; });
    var tipos = g.map(function(p) { return p.tipo; });
    var tipoFinal = tipos.includes('condominio') ? 'condominio' : tipos.includes('apto') ? 'apto' : 'casa';
    
    return {
      nome: nomes[0],
      lat: lat,
      lng: lng,
      bairro: g[0].bairro || '',
      tipo: tipoFinal,
      subparadas: g.length,
      subdetalhes: nomes
    };
  });
}

// ============================================================
// API
// ============================================================
app.post('/api/upload', upload.single('file'), function(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo' });
    
    var fn = req.file.originalname || '', txt = '';
    if (fn.endsWith('.xlsx') || fn.endsWith('.xls')) {
      var wb = XLSX.read(req.file.buffer, { type: 'buffer' });
      txt = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
    } else {
      txt = req.file.buffer.toString('utf8');
    }
    
    var pts = processarPlanilha(txt);
    console.log('Paradas extraídas: ' + pts.length);
    
    if (pts.length < 2) return res.status(400).json({ error: 'Poucos endereços válidos. Encontrados: ' + pts.length + '. Verifique as colunas Latitude/Longitude.' });
    
    var ptsAgrupados = agruparProximos(pts, 0.03);
    console.log('Paradas após agrupamento: ' + ptsAgrupados.length);
    
    var opt = twoOpt(ptsAgrupados);
    
    var km = 0;
    for (var i = 0; i < opt.length - 1; i++) {
      km += haversine(opt[i], opt[i + 1]);
    }
    
    var totalOriginal = pts.length;
    var totalAgrupado = ptsAgrupados.length;
    var economia = totalOriginal > 0 ? Math.round((1 - totalAgrupado / totalOriginal) * 100) : 0;
    var lucroEstimado = totalOriginal * 12.75;
    
    var resultado = {
      success: true,
      totalParadas: totalAgrupado,
      totalOriginal: totalOriginal,
      agrupadas: totalOriginal - totalAgrupado,
      totalKm: +km.toFixed(2),
      totalMin: Math.round(km / 0.35),
      economia: economia,
      lucroEstimado: +lucroEstimado.toFixed(2),
      paradas: opt.map(function(p, i) {
        return {
          ordem: i + 1,
          nome: p.nome || ('Parada ' + (i + 1)),
          lat: p.lat,
          lng: p.lng,
          bairro: p.bairro || '',
          tipo: p.tipo || 'casa',
          subparadas: p.subparadas || 1,
          subdetalhes: p.subdetalhes || []
        };
      })
    };
    
    res.json(resultado);
  } catch(e) {
    console.error('Erro:', e);
    res.status(500).json({ error: e.message || 'Erro interno' });
  }
});

function processarPlanilha(txt) {
  var linhas = txt.split(/\r?\n/).filter(function(l) { return l.trim(); });
  if (linhas.length < 2) return [];
  
  var cab = linhas[0].split(',').map(function(h) { return h.trim().replace(/"/g, '').toLowerCase(); });
  console.log('CABECALHO:', JSON.stringify(cab));
  
  var cEnd = -1, cLat = -1, cLng = -1, cBai = -1;
  
  for (var i = 0; i < cab.length; i++) {
    var h = cab[i];
    if (cEnd === -1 && (h.includes('address') || h.includes('endereco') || h.includes('destino') || h.includes('rua') || h.includes('logradouro') || h.includes('destination'))) cEnd = i;
    if (cLat === -1 && (h.includes('latitude') || h === 'lat' || h === 'y')) cLat = i;
    if (cLng === -1 && (h.includes('longitude') || h === 'lng' || h === 'lon' || h === 'x')) cLng = i;
    if (cBai === -1 && (h.includes('bairro') || h.includes('district'))) cBai = i;
  }
  
  // Fallback: colunas I e J (índices 8 e 9) para Latitude/Longitude
  if (cLat === -1 && cab.length >= 9) cLat = 8;
  if (cLng === -1 && cab.length >= 10) cLng = 9;
  if (cEnd === -1 && cab.length >= 5) cEnd = 4;
  
  console.log('INDICES FINAL: End=' + cEnd + ' Lat=' + cLat + ' Lng=' + cLng);
  
  var pts = [];
  for (var i = 1; i < linhas.length; i++) {
    var cols = linhas[i].split(',').map(function(c) { return c.trim().replace(/"/g, ''); });
    if (cols.length < 3) continue;
    
    var lat = cLat >= 0 && cols[cLat] ? parseFloat(String(cols[cLat]).replace(',', '.')) : NaN;
    var lng = cLng >= 0 && cols[cLng] ? parseFloat(String(cols[cLng]).replace(',', '.')) : NaN;
    
    if (isNaN(lat) || isNaN(lng)) continue;
    if (lat === 0 && lng === 0) continue;
    
    var end = cEnd >= 0 && cols[cEnd] ? cols[cEnd] : ('Parada ' + i);
    var bairro = cBai >= 0 && cols[cBai] ? cols[cBai] : '';
    
    pts.push({
      nome: end,
      lat: lat,
      lng: lng,
      bairro: bairro,
      tipo: detectarTipo(end + ' ' + bairro)
    });
  }
  
  console.log('TOTAL PARADAS EXTRAÍDAS: ' + pts.length);
  return pts;
}

app.get('/api/health', function(req, res) {
  res.json({ ok: true, version: '4.2' });
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('RotaLucro Pro v4.2 on ' + port);
});
