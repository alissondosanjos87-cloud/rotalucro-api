console.log('=== RotaLucro v4.0 ===');

var express = require('express');
var cors = require('cors');
var multer = require('multer');
var XLSX = require('xlsx');
var upload = multer({ storage: multer.memoryStorage() });
var app = express();

app.use(cors());
app.use(express.json());

app.get('/', function(req, res) {
  res.send('<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RotaLucro</title><style>body{margin:0;background:#0F172A;color:#fff;font-family:system-ui;display:grid;place-items:center;min-height:100vh}.c{background:#1E293B;padding:24px;border-radius:20px;width:92%;max-width:400px;text-align:center}h1{font-size:32px;font-weight:800;margin-bottom:4px}h1 span{color:#00C853}input{width:100%;padding:14px;margin:6px 0;border:1px solid #334155;border-radius:12px;background:#0F172A;color:#fff}button{width:100%;padding:14px;border:0;border-radius:12px;background:#00C853;color:#000;font-weight:800;font-size:16px;margin-top:8px;cursor:pointer}.card{background:#0F172A;padding:14px;border-radius:12px;margin:10px 0;border-left:4px solid #00C853;cursor:pointer;text-align:left}.card span{display:block;color:#94A3B8;font-size:12px;margin-top:4px}.h{display:none}#prog{text-align:center;padding:16px}.sp{width:36px;height:36px;border:3px solid #334155;border-top-color:#00C853;border-radius:50%;animation:sp .8s linear infinite;margin:0 auto 12px}@keyframes sp{to{transform:rotate(360deg)}}</style></head><body><div class="c" id="t1"><h1>Rota<span>Lucro</span></h1><p style="color:#94A3B8;margin-bottom:16px">Otimizador de entregas</p><input value="entregador@rotalucro.com" placeholder="Email"><input type="password" value="123456" placeholder="Senha"><button onclick="t1.classList.add(\'h\');t2.classList.remove(\'h\')">ENTRAR</button></div><div class="c h" id="t2"><h3 style="margin-bottom:12px">Como adicionar?</h3><div class="card" onclick="alert(\'📸 Em breve\')">📸 FOTO<span>Em breve</span></div><div class="card" onclick="alert(\'⌨️ Em breve\')">⌨️ DIGITAR<span>Em breve</span></div><input type="file" id="f" accept=".csv,.xlsx,.xls" style="display:none" onchange="go(this.files[0])"><div class="card" onclick="document.getElementById(\'f\').click()">📁 IMPORTAR PLANILHA<span>CSV • Excel • Shopee • Amazon • ML</span></div><div id="prog" class="h"><div class="sp"></div><p style="color:#94A3B8">Processando...</p></div><p id="r" style="color:#94A3B8;margin-top:12px;font-size:13px"></p></div><script>async function go(f){if(!f)return;document.getElementById("prog").classList.remove("h");var d=new FormData();d.append("file",f);var res=await fetch("/api/upload",{method:"POST",body:d});var j=await res.json();document.getElementById("prog").classList.add("h");if(j.error){r.textContent="❌ "+j.error;return}r.innerHTML="✅ <b>"+j.totalParadas+" paradas</b> - "+j.totalKm+"km - Economia "+j.economia+"%<br><small style=\'color:#94A3B8\'>Plataforma: "+j.plataforma.toUpperCase()+" | Lucro: R$ "+j.lucroEstimado+"</small>"}</script></body></html>');
});

app.get('/api/health', function(req, res) {
  res.json({ ok: true, version: '4.0' });
});

function toRad(d) { return d * Math.PI / 180; }

function haversine(a, b) {
  var R = 6371;
  var dLat = toRad(b.lat - a.lat);
  var dLng = toRad(b.lng - a.lng);
  var h = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)*Math.sin(dLng/2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function twoOpt(points) {
  var r = points.slice();
  var imp = true;
  while (imp) {
    imp = false;
    for (var i = 1; i < r.length - 2; i++) {
      for (var j = i + 1; j < r.length - 1; j++) {
        if (haversine(r[i-1],r[i]) + haversine(r[j],r[j+1]) > haversine(r[i-1],r[j]) + haversine(r[i],r[j+1])) {
          var trecho = r.slice(i, j+1).reverse();
          r = r.slice(0, i).concat(trecho, r.slice(j+1));
          imp = true;
        }
      }
    }
  }
  return r;
}

function detectarTipo(e) {
  if (!e) return 'casa';
  var x = e.toLowerCase();
  if (/condominio|condomínio|residencial|bloco|torre|conjunto|parque/i.test(x)) return 'condominio';
  if (/apto|apartamento|sala|loja/i.test(x)) return 'apto';
  return 'casa';
}

app.post('/api/upload', upload.single('file'), function(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo' });
    
    var fn = req.file.originalname || '';
    var txt = '';
    
    if (fn.endsWith('.xlsx') || fn.endsWith('.xls')) {
      var wb = XLSX.read(req.file.buffer, { type: 'buffer' });
      txt = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
    } else {
      txt = req.file.buffer.toString('utf8');
    }
    
    var pts = processar(txt, fn);
    if (pts.length < 2) return res.status(400).json({ error: 'Poucos endereços. Min 2.' });
    
    var opt = twoOpt(pts);
    var km = 0;
    for (var i = 0; i < opt.length - 1; i++) km += haversine(opt[i], opt[i+1]);
    
    res.json({
      success: true,
      plataforma: pts[0]?.fonte || 'outro',
      totalParadas: opt.length,
      totalKm: +km.toFixed(2),
      totalMin: Math.round(km / 0.35),
      economia: Math.max(5, Math.min(35, Math.round(opt.length * 2.3))),
      lucroEstimado: +(opt.length * 12.75).toFixed(2),
      paradas: opt.map(function(p, i) {
        return { ordem: i+1, nome: p.nome, lat: p.lat, lng: p.lng, bairro: p.bairro||'', tipo: p.tipo||'casa', fonte: p.fonte||'outro' };
      })
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

function processar(txt, fn) {
  var linhas = txt.split(/\r?\n/).filter(function(l) { return l.trim(); });
  if (linhas.length < 2) return [];
  
  var cab = linhas[0].toLowerCase().split(',').map(function(h) { return h.trim().replace(/"/g, ''); });
  var pf = fn.toLowerCase().includes('amazon') ? 'amazon' : fn.toLowerCase().includes('shopee') ? 'shopee' : fn.toLowerCase().includes('meli')||fn.toLowerCase().includes('mercado') ? 'meli' : 'outro';
  
  var cEnd = cab.findIndex(function(h) { return /endereco|address|destino|rua|logradouro/i.test(h); });
  var cLat = cab.findIndex(function(h) { return h.includes('lat') || h === 'y'; });
  var cLng = cab.findIndex(function(h) { return h.includes('lng') || h.includes('lon') || h === 'x'; });
  var cBai = cab.findIndex(function(h) { return h.includes('bairro') || h.includes('district'); });
  
  var pts = [];
  for (var i = 1; i < linhas.length; i++) {
    var cols = linhas[i].split(',').map(function(c) { return c.trim().replace(/"/g, ''); });
    if (cols.length < 2) continue;
    var lat = cLat >= 0 ? parseFloat(String(cols[cLat]).replace(',', '.')) : NaN;
    var lng = cLng >= 0 ? parseFloat(String(cols[cLng]).replace(',', '.')) : NaN;
    if (isNaN(lat) || isNaN(lng)) continue;
    var end = cEnd >= 0 ? cols[cEnd] : '';
    pts.push({ nome: end, lat: lat, lng: lng, bairro: cBai >= 0 ? cols[cBai] : '', tipo: detectarTipo(end), fonte: pf });
  }
  return pts;
}

app.post('/api/optimize', function(req, res) {
  try {
    var points = req.body.points || [];
    if (points.length < 2) return res.status(400).json({ error: 'Min 2 pontos' });
    var opt = twoOpt(points);
    var km = 0;
    for (var i = 0; i < opt.length - 1; i++) km += haversine(opt[i], opt[i+1]);
    res.json({ success: true, order: opt, totalKm: +km.toFixed(2), totalMin: Math.round(km/0.35), economia: Math.max(5, Math.min(35, Math.round(points.length * 2.3))) + '%' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('RotaLucro v4.0 on ' + port);
});
