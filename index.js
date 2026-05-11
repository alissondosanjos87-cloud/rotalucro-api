// index.js - RotaLucro API v4.0
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { supabase, logSeguro, sanitizarErro } = require('./config/supabase');
const { getWorkerPool } = require('./services/workerPool');
const routeCache = require('./services/cache');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('short'));
app.use(express.json({ limit: '2mb' }));

// Rate limiting
const optimizeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Muitas otimizações. Aguarde um minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Muitas requisições.' },
});

app.use('/api/optimize', optimizeLimiter);
app.use('/api', generalLimiter);

app.set('supabase', supabase);

// ============================================================
// FRONTEND
// ============================================================
app.get('/', function(req, res) {
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>RotaLucro v4</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui;background:#0F172A;color:#fff;overflow:hidden;height:100vh}
.screen{position:fixed;inset:0;display:none;flex-direction:column;background:#0F172A}
.screen.active{display:flex}
.scr-login{justify-content:center;align-items:center;padding:24px;background:radial-gradient(circle at 50% -10%,#1e293b,#0F172A 45%,#020617)}
.lb{width:100%;max-width:340px;text-align:center}
.lb h1{font-size:32px;font-weight:800;margin-bottom:4px}
.lb h1 span{color:#00C853}
.lb p{color:#94A3B8;font-size:14px;margin-bottom:24px}
.lb input{width:100%;padding:14px;margin:6px 0;border:1.5px solid rgba(255,255,255,.1);border-radius:14px;background:rgba(255,255,255,.06);color:#fff;font-size:15px}
.btn{width:100%;padding:14px;border:0;border-radius:14px;font-weight:800;font-size:16px;cursor:pointer}
.btn-g{background:#00C853;color:#022c12}
.scr-home{padding:20px;overflow-y:auto}
.ht{font-size:22px;font-weight:800;margin-bottom:4px}
.ht span{color:#00C853}
.hs{color:#94A3B8;font-size:13px;margin-bottom:20px}
.card{background:#1E293B;padding:16px;border-radius:16px;margin-bottom:10px;cursor:pointer;font-weight:600;text-align:left;border-left:4px solid #00C853}
.card:active{transform:scale(.98)}
.card span{display:block;color:#94A3B8;font-size:12px;margin-top:4px}
.card.import{border-left-color:#FFD700}
.modal{position:fixed;inset:0;z-index:2000;display:none;align-items:flex-end;justify-content:center}
.modal.show{display:flex}
.mb{position:absolute;inset:0;background:rgba(0,0,0,.7)}
.mc{position:relative;width:100%;max-width:480px;background:#1E293B;border-radius:24px 24px 0 0;padding:24px 20px 30px;max-height:85vh;overflow:auto;border-top:1px solid rgba(255,255,255,.08);animation:su .3s ease}
@keyframes su{from{transform:translateY(100%)}to{transform:translateY(0)}}
.mc h3{font-size:20px;font-weight:800;margin-bottom:8px}
.mc p{color:#94A3B8;font-size:14px;margin-bottom:16px}
.mc textarea{width:100%;min-height:200px;background:#0F172A;border:1.5px solid #334155;border-radius:14px;padding:14px;color:#fff;font-size:14px;resize:vertical}
.mc .mic{width:80px;height:80px;border-radius:50%;background:#FF6D00;margin:0 auto 16px;display:grid;place-items:center;font-size:32px;animation:pu 1.5s infinite}
@keyframes pu{0%,100%{box-shadow:0 0 20px rgba(255,109,0,.4)}50%{box-shadow:0 0 40px rgba(255,109,0,.7)}}
.scr-map{background:#000}
#map{flex:1;z-index:1}
.top{position:absolute;top:12px;left:12px;right:12px;height:48px;background:rgba(15,23,42,.94);backdrop-filter:blur(14px);border-radius:14px;display:flex;align-items:center;justify-content:space-between;padding:0 12px;z-index:1000;border:1px solid rgba(255,255,255,.08)}
.top button{width:34px;height:34px;border-radius:10px;border:0;background:rgba(255,255,255,.06);color:#fff;font-size:16px;cursor:pointer}
.top .tt{text-align:center;font-weight:700;font-size:14px}
.top .tt small{display:block;color:#94A3B8;font-size:11px}
.filtros{position:absolute;left:14px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:10px;z-index:1000}
.fd{width:36px;height:36px;border-radius:50%;border:3px solid #fff;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.4)}
.fd:active{transform:scale(.9)}
.fd.g{background:#00C853}.fd.b{background:#0057FF}.fd.r{background:#E10600}.fd.o{background:#FF6D00}
.fd.active{border-color:#FFD700}
.sheet{position:absolute;bottom:0;left:0;right:0;background:#0F172A;border-radius:24px 24px 0 0;padding:14px 18px 18px;box-shadow:0 -8px 32px rgba(0,0,0,.5);z-index:1000;border-top:1px solid rgba(255,255,255,.08)}
.sh{width:36px;height:4px;background:#334155;border-radius:2px;margin:0 auto 12px}
.sts{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px}
.sts div span{font-size:10px;color:#94A3B8;text-transform:uppercase;font-weight:600}
.sts div strong{display:block;font-size:20px;font-weight:800;margin-top:2px}
.sts .gr strong{color:#00C853}
.bs{width:100%;height:50px;background:#00C853;color:#022c12;font-weight:800;font-size:15px;border:0;border-radius:14px;cursor:pointer}
.pin{width:34px;height:42px;position:relative;display:grid;place-items:center;font-weight:800;color:#fff;font-size:13px}
.pin::before{content:'';position:absolute;width:34px;height:34px;background:currentColor;border-radius:50% 50% 50% 0;transform:rotate(-45deg);top:0;left:0;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.4)}
.pin span{position:relative;z-index:1}
.toast{position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#1E293B;color:#fff;padding:12px 18px;border-radius:12px;font-weight:600;font-size:13px;z-index:3000;opacity:0;transition:.3s;white-space:nowrap}
.toast.show{opacity:1}
#prog{display:none;text-align:center;padding:20px}
.sp{width:36px;height:36px;border:3px solid #334155;border-top-color:#00C853;border-radius:50%;animation:sp .8s linear infinite;margin:0 auto 12px}
@keyframes sp{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<div class="screen scr-login active" id="loginScreen">
  <div class="lb">
    <h1>Rota<span>Lucro</span></h1>
    <p>Otimizador inteligente de entregas</p>
    <input type="email" value="entregador@rotalucro.com" placeholder="Email">
    <input type="password" value="123456" placeholder="Senha">
    <button class="btn btn-g" onclick="show('home')">ENTRAR</button>
  </div>
</div>
<div class="screen scr-home" id="homeScreen">
  <div class="ht">Rota<span>Lucro</span></div>
  <p class="hs">Como quer adicionar sua rota hoje?</p>
  <div class="card" onclick="openModal('foto')">📸 TIRAR FOTO DA LISTA<span>Capture a lista de entregas</span></div>
  <div class="card" onclick="openModal('digitar')">⌨️ DIGITAR ENDEREÇOS<span>Digite um endereço por linha</span></div>
  <div class="card" onclick="openModal('audio')">🎤 GRAVAR EM ÁUDIO<span>Fale os endereços em voz alta</span></div>
  <input type="file" id="fileInput" accept=".csv,.xlsx,.xls" style="display:none" onchange="importarArquivo(this.files[0])">
  <div class="card import" onclick="document.getElementById('fileInput').click()">📁 IMPORTAR PLANILHA<span>CSV • Excel • Shopee • Mercado Livre • Amazon</span></div>
  <div id="prog"><div class="sp"></div><p style="color:#94A3B8">Processando e otimizando...</p></div>
  <p id="fileInfo" style="font-size:12px;color:#94A3B8;text-align:center;margin-top:8px"></p>
</div>
<div class="screen scr-map" id="mapScreen">
  <div id="map"></div>
  <div class="top">
    <button onclick="show('home')">←</button>
    <div class="tt">Rota Otimizada<small id="routeInfo">0 paradas</small></div>
    <button>⋮</button>
  </div>
  <div class="filtros">
    <div class="fd g active" data-type="all" onclick="filtrar('all',this)"></div>
    <div class="fd b" data-type="amazon" onclick="filtrar('amazon',this)"></div>
    <div class="fd r" data-type="shopee" onclick="filtrar('shopee',this)"></div>
    <div class="fd o" data-type="meli" onclick="filtrar('meli',this)"></div>
  </div>
  <div class="sheet">
    <div class="sh"></div>
    <div class="sts">
      <div><span>Paradas</span><strong id="sp">0</strong></div>
      <div><span>Distância</span><strong id="sd">0 km</strong></div>
      <div class="gr"><span>Lucro Est.</span><strong id="sl">R$ 0</strong></div>
    </div>
    <button class="bs" onclick="iniciar()">▶ INICIAR ROTA</button>
  </div>
  <div class="toast" id="toast"></div>
</div>
<div class="modal" id="modal">
  <div class="mb" onclick="closeModal()"></div>
  <div class="mc" id="modalContent"></div>
</div>
<script>
var map, allMarkers = [], rotaData = null;
function show(id) {
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
  document.getElementById(id + 'Screen').classList.add('active');
  if (id === 'map' && map) setTimeout(function() { map.invalidateSize(); }, 400);
}
function toast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(function() { t.classList.remove('show'); }, 2500);
}
function openModal(tipo) {
  var mc = document.getElementById('modalContent');
  if (tipo === 'foto') {
    mc.innerHTML = '<h3>📸 Tirar foto da lista</h3><p>Funcionalidade em breve</p><button class="btn btn-g" onclick="closeModal()">OK</button>';
  } else if (tipo === 'digitar') {
    mc.innerHTML = '<h3>⌨️ Digitar endereços</h3><p>Um endereço por linha</p><textarea id="txtAddr" placeholder="Av Paulista, 1000 - Bela Vista&#10;Rua Augusta, 500 - Consolação&#10;Rua Oscar Freire, 300 - Jardins"></textarea><button class="btn btn-g" onclick="processarDigitado()" style="margin-top:16px">OTIMIZAR</button>';
  } else if (tipo === 'audio') {
    mc.innerHTML = '<h3>🎤 Gravar áudio</h3><p>Toque no microfone e fale os endereços</p><div class="mic" onclick="simularAudio()">🎤</div><p id="audioText" style="color:#94A3B8;text-align:center">Toque para simular...</p><button class="btn btn-g" id="btnAudio" style="display:none" onclick="processarAudio()">USAR ENDEREÇOS</button>';
  }
  document.getElementById('modal').classList.add('show');
}
function closeModal() { document.getElementById('modal').classList.remove('show'); }
function processarDigitado() {
  var txt = document.getElementById('txtAddr').value.trim();
  if (!txt) return toast('Digite pelo menos um endereço');
  var linhas = txt.split('\\n').filter(function(l) { return l.trim(); });
  var pts = linhas.map(function(l) {
    return { nome: l.trim(), lat: -23.55 + (Math.random()-.5)*0.08, lng: -46.63 + (Math.random()-.5)*0.08, tipo: 'casa', fonte: 'manual' };
  });
  closeModal();
  otimizarEExibir(pts);
}
function simularAudio() {
  document.getElementById('audioText').textContent = 'Av Paulista 1000, Rua Augusta 500, Rua Oscar Freire 300';
  document.getElementById('btnAudio').style.display = 'block';
}
function processarAudio() {
  var pts = [
    { nome: 'Av Paulista, 1000 - Bela Vista', lat: -23.563, lng: -46.654, tipo: 'condominio', fonte: 'audio' },
    { nome: 'Rua Augusta, 500 - Consolação', lat: -23.556, lng: -46.648, tipo: 'apto', fonte: 'audio' },
    { nome: 'Rua Oscar Freire, 300 - Jardins', lat: -23.565, lng: -46.672, tipo: 'casa', fonte: 'audio' }
  ];
  closeModal();
  otimizarEExibir(pts);
}
async function importarArquivo(file) {
  if (!file) return;
  document.getElementById('prog').style.display = 'block';
  document.getElementById('fileInfo').textContent = '📄 ' + file.name;
  var fd = new FormData(); fd.append('file', file);
  try {
    var r = await fetch('/api/optimize/upload', { method: 'POST', body: fd });
    var data = await r.json();
    document.getElementById('prog').style.display = 'none';
    if (data.error) { document.getElementById('fileInfo').textContent = '❌ ' + data.error; return; }
    rotaData = data;
    show('map');
    setTimeout(function() { initMap(data); }, 500);
    toast('✅ ' + data.totalParadas + ' paradas otimizadas!');
  } catch(e) {
    document.getElementById('prog').style.display = 'none';
  }
}
function otimizarEExibir(pts) {
  rotaData = { paradas: pts, totalParadas: pts.length, totalKm: 0, lucroEstimado: (pts.length*12.75).toFixed(2), plataforma: 'manual' };
  show('map');
  setTimeout(function() { initMap(rotaData); }, 500);
}
function getColor(tipo, fonte) {
  if (fonte === 'amazon') return '#0057FF';
  if (fonte === 'shopee') return '#E10600';
  if (fonte === 'meli') return '#FF6D00';
  if (tipo === 'condominio') return '#FFD700';
  if (tipo === 'apto') return '#FF9800';
  return '#00C853';
}
function initMap(data) {
  if (map) { map.remove(); map = null; }
  allMarkers = [];
  map = L.map('map', { zoomControl: false }).setView([-23.55, -46.63], 12);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
  var pts = [];
  var paradas = data.paradas || data.order || [];
  paradas.forEach(function(p, i) {
    var lat = p.lat, lng = p.lng;
    pts.push([lat, lng]);
    var color = getColor(p.tipo, p.fonte);
    var icon = L.divIcon({ className: '', html: '<div class="pin" style="color:' + color + '"><span>' + (i+1) + '</span></div>', iconSize: [34, 42], iconAnchor: [17, 38] });
    var m = L.marker([lat, lng], { icon: icon, tipo: p.tipo, fonte: p.fonte }).addTo(map);
    m.bindPopup('<b>' + (i+1) + '. ' + (p.nome||'Parada '+(i+1)) + '</b><br><small>' + (p.tipo||'casa').toUpperCase() + ' • ' + (p.fonte||'').toUpperCase() + '</small>');
    allMarkers.push(m);
  });
  if (pts.length > 1) L.polyline(pts, { color: '#00C853', weight: 4, opacity: .85 }).addTo(map);
  if (pts.length) map.fitBounds(L.latLngBounds(pts).pad(0.2));
  document.getElementById('sp').textContent = paradas.length;
  document.getElementById('sd').textContent = (data.totalKm||0).toFixed(0) + ' km';
  document.getElementById('sl').textContent = 'R$ ' + (data.lucroEstimado||0);
  document.getElementById('routeInfo').textContent = paradas.length + ' paradas | ' + (data.plataforma||'manual').toUpperCase();
  setTimeout(function() { map.invalidateSize(); }, 400);
}
function filtrar(type, el) {
  document.querySelectorAll('.fd').forEach(function(d) { d.classList.remove('active'); });
  el.classList.add('active');
  allMarkers.forEach(function(m) { if (type === 'all' || m.options.fonte === type) m.addTo(map); else map.removeLayer(m); });
}
function iniciar() {
  if (allMarkers.length > 0) { map.flyTo(allMarkers[0].getLatLng(), 16, { duration: 1.5 }); setTimeout(function() { allMarkers[0].openPopup(); }, 1600); }
  toast('🚀 Rota iniciada!');
}
</script>
</body>
</html>`);
});

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/api/health', function(req, res) {
  res.json({ ok: true, version: '4.0', timestamp: new Date().toISOString() });
});

app.get('/ping', function(req, res) {
  res.send('pong');
});

// ============================================================
// ROTAS
// ============================================================
app.use('/api/health', require('./routes/health'));
app.use('/api/optimize', require('./routes/optimize'));
app.use('/api/track', require('./routes/track'));
app.use('/api/lucro', require('./routes/lucro'));
app.use('/api/perfil', require('./routes/perfil'));

// ============================================================
// 404
// ============================================================
app.use(function(req, res) {
  res.status(404).json({ error: 'Rota não encontrada', path: req.originalUrl });
});

// ============================================================
// ERROR HANDLER
// ============================================================
app.use(function(err, req, res, next) {
  logSeguro('error', 'Erro não tratado', { path: req.path, message: err.message });
  res.status(err.status || 500).json(sanitizarErro(err));
});

// ============================================================
// START
// ============================================================
const server = app.listen(PORT, function() {
  console.log('RotaLucro API v4.0 - Porta ' + PORT);
  console.log('Limite: 150 paradas');
  console.log('Cache: Memoria');
  console.log('Custo: R$ 0');
});

// Graceful shutdown
async function shutdown(signal) {
  console.log(signal + ' recebido. Encerrando...');
  server.close(function() { console.log('HTTP fechado'); });
  const pool = getWorkerPool();
  await pool.shutdown();
  console.log('Shutdown completo');
  process.exit(0);
}

process.on('SIGTERM', function() { shutdown('SIGTERM'); });
process.on('SIGINT', function() { shutdown('SIGINT'); });

process.on('uncaughtException', function(err) {
  logSeguro('error', 'Erro fatal', { message: err.message });
  console.error(err);
  process.exit(1);
});

process.on('unhandledRejection', function(reason) {
  logSeguro('error', 'Promise rejeitada', { message: reason instanceof Error ? reason.message : String(reason) });
});

module.exports = app;
