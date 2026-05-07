const express = require('express');
const cors = require('cors');
const multer = require('multer');
const XLSX = require('xlsx');
const upload = multer({ storage: multer.memoryStorage() });
const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const cache = new Map();
const getCache = (k) => {
  const v = cache.get(k);
  if (!v) return null;
  if (Date.now() > v.exp) { cache.delete(k); return null; }
  return v.data;
};
const setCache = (k, d, ttl = 300) => cache.set(k, { data: d, exp: Date.now() + ttl * 1000 });

const toRad = d => d * Math.PI / 180;
const haversine = (a, b) => {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const twoOpt = (points) => {
  let route = [...points];
  let improved = true;
  const dist = (p1, p2) => haversine(p1, p2);
  while (improved) {
    improved = false;
    for (let i = 1; i < route.length - 2; i++) {
      for (let j = i + 1; j < route.length - 1; j++) {
        if (dist(route[i-1],route[i]) + dist(route[j],route[j+1]) > dist(route[i-1],route[j]) + dist(route[i],route[j+1])) {
          route.splice(i, j-i+1,...route.slice(i, j+1).reverse());
          improved = true;
        }
      }
    }
  }
  return route;
};

// Detecta tipo de parada
function detectarTipo(endereco) {
  if (!endereco) return 'casa';
  var e = endereco.toLowerCase();
  if (/condominio|condomínio|residencial|bloco|torre|conjunto|parque/i.test(e)) return 'condominio';
  if (/apto|apartamento|sala|loja|bl\.?|ap\.?/i.test(e)) return 'apto';
  return 'casa';
}

app.get('/api/health', (req, res) => res.json({ ok: true, version: '5.0' }));

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo' });
    
    const fileName = req.file.originalname || '';
    let text = '';
    
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      text = XLSX.utils.sheet_to_csv(sheet);
    } else {
      text = req.file.buffer.toString('utf8');
    }
    
    const points = processarPlanilha(text, fileName);
    if (points.length < 2) return res.status(400).json({ error: 'Poucos endereços. Min 2.' });
    
    const optimized = twoOpt(points);
    
    let totalKm = 0;
    for (let i = 0; i < optimized.length - 1; i++) totalKm += haversine(optimized[i], optimized[i+1]);
    
    res.json({
      success: true,
      plataforma: points[0]?.fonte || 'outro',
      totalParadas: optimized.length,
      totalKm: +totalKm.toFixed(2),
      totalMin: Math.round(totalKm / 0.35),
      economia: Math.max(5, Math.min(35, Math.round(optimized.length * 2.3))),
      lucroEstimado: +(optimized.length * 12.75).toFixed(2),
      paradas: optimized.map((p, i) => ({
        ordem: i + 1,
        nome: p.nome || 'Parada ' + (i+1),
        lat: p.lat,
        lng: p.lng,
        bairro: p.bairro || '',
        cidade: p.cidade || '',
        tipo: p.tipo || 'casa',
        pacotes: p.pacotes || 1,
        fonte: p.fonte || 'outro'
      }))
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

function processarPlanilha(text, fileName) {
  const linhas = text.split(/\r?\n/).filter(l => l.trim());
  if (linhas.length < 2) return [];
  
  const cabecalho = linhas[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
  
  const fn = fileName.toLowerCase();
  const plataforma = fn.includes('amazon') ? 'amazon' : fn.includes('shopee') ? 'shopee' : fn.includes('meli') || fn.includes('mercado') ? 'meli' : 'outro';
  
  const colEnd = cabecalho.findIndex(h => ['endereco','address','destino','rua','logradouro','destination address'].some(k => h.includes(k)));
  const colLat = cabecalho.findIndex(h => h.includes('lat') || h === 'y');
  const colLng = cabecalho.findIndex(h => h.includes('lng') || h.includes('lon') || h === 'x');
  const colBairro = cabecalho.findIndex(h => h.includes('bairro') || h.includes('district'));
  const colCidade = cabecalho.findIndex(h => h.includes('cidade') || h.includes('city'));
  const colPacote = cabecalho.findIndex(h => ['track','codigo','spx','pedido','id','tn'].some(k => h.includes(k)));
  
  const points = [];
  
  for (let i = 1; i < linhas.length; i++) {
    const cols = linhas[i].split(',').map(c => c.trim().replace(/"/g, ''));
    if (cols.length < 2) continue;
    
    let lat = colLat >= 0 ? parseFloat(String(cols[colLat]).replace(',', '.')) : NaN;
    let lng = colLng >= 0 ? parseFloat(String(cols[colLng]).replace(',', '.')) : NaN;
    const endereco = colEnd >= 0 ? cols[colEnd] : '';
    const bairro = colBairro >= 0 ? cols[colBairro] : '';
    const cidade = colCidade >= 0 ? cols[colCidade] : '';
    
    if (isNaN(lat) || isNaN(lng)) continue;
    
    points.push({
      nome: endereco,
      lat, lng,
      bairro, cidade,
      tipo: detectarTipo(endereco),
      pacotes: colPacote >= 0 ? cols[colPacote] : '1',
      fonte: plataforma
    });
  }
  
  return points;
}

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>RotaLucro</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui;background:#0F172A;color:#fff;overflow:hidden;height:100vh}
.screen{position:fixed;inset:0;display:none;flex-direction:column;background:#0F172A}
.screen.active{display:flex}
.scr-login{justify-content:center;align-items:center;padding:24px;background:radial-gradient(circle at 50% -10%,#1e293b,#0F172A 45%,#020617)}
.login-box{width:100%;max-width:340px;text-align:center}
.login-box h1{font-size:32px;font-weight:800;margin-bottom:4px}
.login-box h1 span{color:#00C853}
.login-box p{color:#94A3B8;font-size:14px;margin-bottom:24px}
.login-box input{width:100%;padding:14px;margin:6px 0;border:1.5px solid rgba(255,255,255,.1);border-radius:14px;background:rgba(255,255,255,.06);color:#fff;font-size:15px}
.btn{width:100%;padding:14px;border:0;border-radius:14px;color:#022c12;font-weight:800;font-size:16px;cursor:pointer}
.btn-green{background:#00C853}
.scr-home{padding:20px;overflow-y:auto}
.home-title{font-size:22px;font-weight:800;margin-bottom:4px}
.home-title span{color:#00C853}
.home-sub{color:#94A3B8;font-size:13px;margin-bottom:20px}
.card{background:#1E293B;padding:16px;border-radius:16px;margin-bottom:10px;cursor:pointer;font-weight:600;text-align:left;border-left:4px solid #00C853}
.card:active{transform:scale(.98)}
.card span{display:block;color:#94A3B8;font-size:12px;margin-top:4px}
#progress{display:none;text-align:center;padding:30px}
.spinner{width:40px;height:40px;border:4px solid #334155;border-top-color:#00C853;border-radius:50%;animation:s .8s linear infinite;margin:0 auto 12px}
@keyframes s{to{transform:rotate(360deg)}}
.scr-map{background:#000}
#map{flex:1;z-index:1}
.topbar{position:absolute;top:12px;left:12px;right:12px;height:50px;background:rgba(15,23,42,.94);backdrop-filter:blur(14px);border-radius:14px;display:flex;align-items:center;justify-content:space-between;padding:0 12px;z-index:1000;border:1px solid rgba(255,255,255,.08)}
.topbar button{width:36px;height:36px;border-radius:10px;border:0;background:rgba(255,255,255,.06);color:#fff;font-size:18px;cursor:pointer}
.topbar .title{text-align:center;font-weight:700;font-size:14px}
.topbar .title small{display:block;color:#94A3B8;font-size:11px}
.filters{position:absolute;left:14px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:10px;z-index:1000}
.fdot{width:40px;height:40px;border-radius:50%;border:3px solid #fff;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.4)}
.fdot:active{transform:scale(.9)}
.fdot.green{background:#00C853}
.fdot.blue{background:#0057FF}
.fdot.red{background:#E10600}
.fdot.orange{background:#FF6D00}
.fdot.active{border-color:#FFD700}
.sheet{position:absolute;bottom:0;left:0;right:0;background:#0F172A;border-radius:24px 24px 0 0;padding:14px 18px 18px;box-shadow:0 -8px 32px rgba(0,0,0,.5);z-index:1000;border-top:1px solid rgba(255,255,255,.08)}
.sheet-handle{width:36px;height:4px;background:#334155;border-radius:2px;margin:0 auto 12px}
.stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px}
.stat span{font-size:10px;color:#94A3B8;text-transform:uppercase;font-weight:600}
.stat strong{display:block;font-size:20px;font-weight:800;margin-top:2px}
.stat.green strong{color:#00C853}
.btn-start{width:100%;height:52px;background:#00C853;color:#022c12;font-weight:800;font-size:15px;border:0;border-radius:14px;cursor:pointer}
.pin{width:36px;height:44px;position:relative;display:grid;place-items:center;font-weight:800;color:#fff;font-size:13px}
.pin::before{content:'';position:absolute;width:36px;height:36px;background:currentColor;border-radius:50% 50% 50% 0;transform:rotate(-45deg);top:0;left:0;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.4)}
.pin span{position:relative;z-index:1}
.toast{position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#1E293B;color:#fff;padding:12px 18px;border-radius:12px;font-weight:600;font-size:13px;z-index:3000;opacity:0;transition:.3s}
.toast.show{opacity:1}
</style>
</head>
<body>

<div class="screen scr-login active" id="loginScreen">
  <div class="login-box">
    <h1>Rota<span>Lucro</span></h1>
    <p>O Circuit brasileiro</p>
    <input type="email" value="entregador@rotalucro.com" placeholder="Email">
    <input type="password" value="123456" placeholder="Senha">
    <button class="btn btn-green" onclick="show('home')">ENTRAR</button>
  </div>
</div>

<div class="screen scr-home" id="homeScreen">
  <div class="home-title">Rota<span>Lucro</span></div>
  <p class="home-sub">Como quer adicionar sua rota hoje?</p>
  
  <div class="card" onclick="alert('📸 Em breve')">📸 TIRAR FOTO DA LISTA<span>Capture a lista de entregas</span></div>
  <div class="card" onclick="alert('⌨️ Em breve')">⌨️ DIGITAR ENDEREÇOS<span>Digite um por linha</span></div>
  <div class="card" onclick="alert('🎤 Em breve')">🎤 GRAVAR EM ÁUDIO<span>Fale os endereços</span></div>
  
  <input type="file" id="fileInput" accept=".csv,.xlsx,.xls" style="display:none" onchange="importar(this.files[0])">
  <div class="card" onclick="document.getElementById('fileInput').click()" style="border-left-color:#FFD700">
    📁 IMPORTAR PLANILHA
    <span>CSV • Excel • Shopee • Mercado Livre • Amazon</span>
  </div>

  <div id="progress"><div class="spinner"></div><p style="color:#94A3B8">Processando e otimizando rota...</p></div>
  <p id="fileInfo" style="font-size:12px;color:#94A3B8;text-align:center;margin-top:8px"></p>
</div>

<div class="screen scr-map" id="mapScreen">
  <div id="map"></div>
  <div class="topbar">
    <button onclick="show('home')">←</button>
    <div class="title">Rota Otimizada<small id="routeInfo">0 paradas</small></div>
    <button>⋮</button>
  </div>
  <div class="filters">
    <div class="fdot green active" data-type="all" onclick="filterMarkers('all',this)"></div>
    <div class="fdot blue" data-type="amazon" onclick="filterMarkers('amazon',this)"></div>
    <div class="fdot red" data-type="shopee" onclick="filterMarkers('shopee',this)"></div>
    <div class="fdot orange" data-type="meli" onclick="filterMarkers('meli',this)"></div>
  </div>
  <div class="sheet">
    <div class="sheet-handle"></div>
    <div class="stats">
      <div class="stat"><span>Paradas</span><strong id="statParadas">0</strong></div>
      <div class="stat"><span>Distância</span><strong id="statDistancia">0 km</strong></div>
      <div class="stat green"><span>Lucro Est.</span><strong id="statLucro">R$ 0</strong></div>
    </div>
    <button class="btn-start" onclick="iniciarRota()">▶ INICIAR ROTA</button>
  </div>
  <div class="toast" id="toast"></div>
</div>

<script>
var map, allMarkers = [], rotaData = null;

function show(id) {
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
  document.getElementById(id + 'Screen').classList.add('active');
  if (id === 'map' && map) setTimeout(function() { map.invalidateSize(); }, 300);
}

function toast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(function() { t.classList.remove('show'); }, 2500);
}

function getColor(tipo, fonte) {
  if (fonte === 'amazon') return '#0057FF';
  if (fonte === 'shopee') return '#E10600';
  if (fonte === 'meli') return '#FF6D00';
  if (tipo === 'condominio') return '#FFD700';
  if (tipo === 'apto') return '#FF9800';
  return '#00C853';
}

async function importar(file) {
  if (!file) return;
  
  document.getElementById('progress').style.display = 'block';
  document.getElementById('fileInfo').textContent = '📄 ' + file.name;
  document.querySelectorAll('.card').forEach(function(c) { c.style.display = 'none'; });
  
  var fd = new FormData();
  fd.append('file', file);
  
  try {
    var r = await fetch('/api/upload', { method: 'POST', body: fd });
    var data = await r.json();
    document.getElementById('progress').style.display = 'none';
    document.querySelectorAll('.card').forEach(function(c) { c.style.display = ''; });
    
    if (data.error) {
      document.getElementById('fileInfo').textContent = '❌ ' + data.error;
      return;
    }
    
    rotaData = data;
    show('map');
    setTimeout(function() { initMap(data); }, 400);
    toast('✅ ' + data.totalParadas + ' paradas otimizadas!');
  } catch (e) {
    document.getElementById('progress').style.display = 'none';
    document.querySelectorAll('.card').forEach(function(c) { c.style.display = ''; });
  }
}

function initMap(data) {
  if (map) { map.remove(); map = null; }
  allMarkers = [];
  
  map = L.map('map', { zoomControl: false }).setView([-23.55, -46.63], 12);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
  
  var pts = [];
  
  data.paradas.forEach(function(p, i) {
    pts.push([p.lat, p.lng]);
    var color = getColor(p.tipo, p.fonte);
    
    var icon = L.divIcon({
      className: '',
      html: '<div class="pin" style="color:' + color + '"><span>' + (i+1) + '</span></div>',
      iconSize: [36, 44],
      iconAnchor: [18, 40]
    });
    
    var m = L.marker([p.lat, p.lng], { icon: icon, tipo: p.tipo, fonte: p.fonte }).addTo(map);
    m.bindPopup('<b>' + (i+1) + '. ' + p.nome + '</b><br><small>' + (p.bairro||'') + ' • ' + p.tipo.toUpperCase() + '</small><br><small style="color:#FFD700">' + p.fonte.toUpperCase() + '</small>');
    allMarkers.push(m);
  });
  
  if (pts.length > 1) {
    L.polyline(pts, { color: '#00C853', weight: 4, opacity: .85 }).addTo(map);
  }
  
  map.fitBounds(L.latLngBounds(pts).pad(0.2));
  
  document.getElementById('statParadas').textContent = data.totalParadas;
  document.getElementById('statDistancia').textContent = data.totalKm.toFixed(0) + ' km';
  document.getElementById('statLucro').textContent = 'R$ ' + data.lucroEstimado.toFixed(0);
  document.getElementById('routeInfo').textContent = data.totalParadas + ' paradas | ' + data.plataforma.toUpperCase();
}

function filterMarkers(type, el) {
  document.querySelectorAll('.fdot').forEach(function(d) { d.classList.remove('active'); });
  el.classList.add('active');
  
  allMarkers.forEach(function(m) {
    if (type === 'all' || m.options.fonte === type) {
      m.addTo(map);
    } else {
      map.removeLayer(m);
    }
  });
}

function iniciarRota() {
  if (allMarkers.length > 0) {
    map.flyTo(allMarkers[0].getLatLng(), 16, { duration: 1.5 });
    setTimeout(function() { allMarkers[0].openPopup(); }, 1600);
  }
  toast('🚀 Rota iniciada! Vá para a parada 1');
}
</script>
</body>
</html>`;

app.get('/', (req, res) => res.send(html));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('RotaLucro v5.0 on ' + port));
