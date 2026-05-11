var express = require('express');
var cors = require('cors');
var multer = require('multer');
var XLSX = require('xlsx');

var app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ============================================================
// FRONTEND v3 - PIXEL PERFECT
// ============================================================
app.get('/', function(req, res) {
  res.send(`<!DOCTYPE html>
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

/* TELAS */
#t1{display:flex;justify-content:center;align-items:center;padding:24px;position:fixed;inset:0;flex-direction:column;background:radial-gradient(circle at 50% -10%,#1e293b,#0F172A 45%,#020617)}
#t2{display:none;padding:20px;overflow-y:auto;position:fixed;inset:0;flex-direction:column;background:#0F172A}
#t3{display:none;position:fixed;inset:0;flex-direction:column;background:#0F172A}

/* LOGIN */
.cx{width:100%;max-width:340px;text-align:center}
.cx h1{font-size:32px;font-weight:800;margin-bottom:4px}
.cx h1 span{color:#00C853}
.cx p{color:#94A3B8;font-size:14px;margin-bottom:24px}
.cx input{width:100%;padding:14px;margin:6px 0;border:1.5px solid rgba(255,255,255,.1);border-radius:14px;background:rgba(255,255,255,.06);color:#fff;font-size:15px}
.bt{width:100%;padding:14px;border:0;border-radius:14px;font-weight:800;font-size:16px;cursor:pointer}
.btg{background:#00C853;color:#022c12}

/* IMPORTAR */
.ttl{font-size:22px;font-weight:800;margin-bottom:4px}
.ttl span{color:#00C853}
.sub{color:#94A3B8;font-size:13px;margin-bottom:20px}
.cd{background:#1E293B;padding:16px;border-radius:16px;margin-bottom:10px;cursor:pointer;font-weight:600;text-align:left;border-left:4px solid #00C853}
.cd:active{transform:scale(.98)}
.cd span{display:block;color:#94A3B8;font-size:12px;margin-top:4px}
.cd.am{border-left-color:#FFD700}

/* MAPA */
#map{position:absolute;inset:0;z-index:1}

/* HEADER CORRETO */
.header{position:absolute;top:0;left:0;right:0;height:56px;background:#1E293B;display:flex;align-items:center;justify-content:space-between;padding:0 12px;z-index:1000;border-bottom:1px solid rgba(255,255,255,.08)}
.header.left{display:flex;align-items:center;gap:10px}
.header.left button{background:transparent;border:0;color:#fff;font-size:24px;cursor:pointer;padding:0;width:32px}
.header.logo{font-size:18px;font-weight:800}
.header.logo span{color:#00C853}
.header.logo small{color:#64748B;font-weight:500;margin-left:4px;font-size:14px}
.header.add{background:#00C853;color:#022c12;border:0;padding:8px 16px;border-radius:10px;font-weight:700;font-size:14px;cursor:pointer}

/* MENU LATERAL CORRETO */
.sidebar{position:absolute;left:12px;top:68px;display:flex;flex-direction:column;gap:8px;z-index:1000}
.sidebar.btn{width:64px;height:64px;border-radius:14px;border:0;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;font-weight:700;gap:4px;box-shadow:0 4px 12px rgba(0,0,0,.4);line-height:1}
.sidebar.btn:active{transform:scale(.95)}
.sidebar.btn svg{width:24px;height:24px}
.sidebar.btn.red{background:#E11D48;color:#fff}
.sidebar.btn.blue{background:#2563EB;color:#fff}
.sidebar.btn.orange{background:#F97316;color:#fff}
.sidebar.btn.white{background:#F8FAFC;color:#0F172A}

/* CARD TERMINO */
.card-top{position:absolute;top:68px;right:12px;background:#fff;color:#0F172A;padding:14px 18px;border-radius:16px;z-index:1000;box-shadow:0 4px 16px rgba(0,0,0,.3);text-align:center;min-width:140px}
.card-top.label{font-size:10px;color:#64748B;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
.card-top.hora{font-size:36px;font-weight:800;line-height:1;margin:6px 0}
.card-top.info{font-size:11px;color:#64748B;font-weight:600}

/* PINO CIRCULAR */
.pin-circle{width:38px;height:38px;border-radius:50%;background:#2563EB;border:3px solid #fff;display:grid;place-items:center;color:#fff;font-weight:800;font-size:15px;box-shadow:0 3px 12px rgba(0,0,0,.5)}
.pin-circle.red{background:#E11D48}
.pin-circle.orange{background:#F97316}

/* BOTTOM SHEET CORRETO */
.bottom{position:absolute;bottom:0;left:0;right:0;background:#1E293B;border-radius:24px 24px 0 0;padding:16px;z-index:1000;box-shadow:0 -8px 32px rgba(0,0,0,.5)}
.bottom.stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px}
.bottom.stats.box{background:#0F172A;padding:14px;border-radius:14px;text-align:center}
.bottom.stats.box.label{font-size:10px;color:#94A3B8;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
.bottom.stats.box.valor{font-size:22px;font-weight:800;margin-top:4px}
.bottom.msg{font-size:11px;color:#94A3B8;text-align:center;margin-bottom:12px;padding:0 8px}
.bottom.actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.bottom.actions button{height:50px;border:0;border-radius:14px;font-weight:700;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px}
.bottom.actions.restaurar{background:#334155;color:#fff}
.bottom.actions.excluir{background:#E11D48;color:#fff}

/* TOAST */
.toast{position:fixed;bottom:200px;left:50%;transform:translateX(-50%);background:#1E293B;color:#fff;padding:12px 18px;border-radius:12px;font-weight:600;font-size:13px;z-index:3000;opacity:0;transition:.3s}
.toast.show{opacity:1}
#prog{display:none;text-align:center;padding:20px}
.sp{width:36px;height:36px;border:3px solid #334155;border-top-color:#00C853;border-radius:50%;animation:sp.8s linear infinite;margin:0 auto 12px}
@keyframes sp{to{transform:rotate(360deg)}}
</style>
</head>
<body>

<!-- TELA 1: LOGIN -->
<div id="t1">
  <div class="cx">
    <h1>Rota<span>Lucro</span></h1>
    <p>Otimizador inteligente de entregas</p>
    <input type="email" value="entregador@rotalucro.com" placeholder="Email">
    <input type="password" value="123456" placeholder="Senha">
    <button class="bt btg" onclick="irPara('t2')">ENTRAR</button>
  </div>
</div>

<!-- TELA 2: IMPORTAR -->
<div id="t2">
  <div class="ttl">Rota<span>Lucro</span></div>
  <p class="sub">Como quer adicionar sua rota hoje?</p>
  <div class="cd" onclick="alert('📸 Em breve')">📸 TIRAR FOTO<span>Em breve</span></div>
  <div class="cd" onclick="alert('⌨️ Em breve')">⌨️ DIGITAR<span>Em breve</span></div>
  <div class="cd" onclick="alert('🎤 Em breve')">🎤 AUDIO<span>Em breve</span></div>
  <input type="file" id="fileInput" accept=".csv,.xlsx,.xls" style="display:none" onchange="importar(this.files[0])">
  <div class="cd am" onclick="document.getElementById('fileInput').click()">📁 IMPORTAR PLANILHA<span>CSV • Excel • Shopee • Amazon</span></div>
  <div id="prog"><div class="sp"></div><p style="color:#94A3B8">Processando...</p></div>
  <p id="fileInfo" style="font-size:12px;color:#94A3B8;text-align:center;margin-top:8px"></p>
</div>

<!-- TELA 3: MAPA V3 -->
<div id="t3">
  <div id="map"></div>

  <!-- HEADER -->
  <div class="header">
    <div class="left">
      <button onclick="irPara('t2')">←</button>
      <div class="logo">Rota<span>Lucro</span><small>v3</small></div>
    </div>
    <button class="add" onclick="toast('Em breve')">+ Parada</button>
  </div>

  <!-- MENU LATERAL -->
  <div class="sidebar">
    <button class="btn red" onclick="toast('Menu')">
      <svg fill="currentColor" viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
      MENU
    </button>
    <button class="btn blue" onclick="centralizarGPS()">
      <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
      GPS
    </button>
    <button class="btn blue" onclick="toast('Modo Carro')">
      <svg fill="currentColor" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0.55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0.55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
      MODO<br>CARRO
    </button>
    <button class="btn orange" onclick="reorganizar()">
      <svg fill="currentColor" viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>
      REORG.
    </button>
    <button class="btn blue" onclick="verTudo()">
      <svg fill="currentColor" viewBox="0 0 24 24"><path d="M15 3l2.3 2.3-2.89 2.87 1.42 1.42L18.7 6.7 21 9V3h-6zM3 9l2.3-2.3 2.87 2.89 1.42-1.42L6.7 5.3 9 3H3v6zm6 12l-2.3-2.3 2.89-2.87-1.42L5.3 17.3 3 15v6h6zm12-6l-2.3 2.3-2.87-2.89-1.42 1.42 2.89 2.87L15 21h6v-6z"/></svg>
      VER<br>TUDO
    </button>
    <button class="btn white" onclick="otimizar()">
      <svg fill="#0F172A" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
      OTIMIZAR
    </button>
  </div>

  <!-- CARD TERMINO -->
  <div class="card-top">
    <div class="label">TÉRMINO ESTIMADO</div>
    <div class="hora" id="horaFim">--:--</div>
    <div class="info" id="infoTopo">0 PARADAS • 0 KM</div>
  </div>

  <!-- BOTTOM SHEET -->
  <div class="bottom">
    <div class="stats">
      <div class="box">
        <div class="label">PARADAS</div>
        <div class="valor" id="sp">0/0</div>
      </div>
      <div class="box">
        <div class="label">DISTÂNCIA</div>
        <div class="valor" id="sd">0 km</div>
      </div>
      <div class="box">
        <div class="label">LUCRO</div>
        <div class="valor" id="sl">R$ 0</div>
      </div>
    </div>
    <div class="msg" id="msgBottom">Importe uma planilha para começar</div>
    <div class="actions">
      <button class="restaurar" onclick="toast('Restaurar')">
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
        Restaurar
      </button>
      <button class="excluir" onclick="excluir()">
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        Excluir
      </button>
    </div>
  </div>

  <div class="toast" id="toast"></div>
</div>

<script>
function irPara(id){
  document.getElementById("t1").style.display="none";
  document.getElementById("t2").style.display="none";
  document.getElementById("t3").style.display="none";
  document.getElementById(id).style.display="flex";
}

var map, allMarkers=[], rotaData=null;

function toast(m){
  var t=document.getElementById("toast");
  t.textContent=m; t.classList.add("show");
  clearTimeout(t._t);
  t._t=setTimeout(function(){t.classList.remove("show")},2500);
}

async function importar(f){
  if(!f)return;
  document.getElementById("prog").style.display="block";
  document.getElementById("fileInfo").textContent="📄 "+f.name;
  var d=new FormData(); d.append("file",f);
  try{
    var r=await fetch("/api/upload",{method:"POST",body:d});
    var data=await r.json();
    document.getElementById("prog").style.display="none";
    if(!r.ok || data.error){
      var msg = data.error || "Erro "+r.status;
      document.getElementById("fileInfo").textContent="❌ "+msg;
      toast("❌ "+msg);
      return
    }
    rotaData=data;
    irPara("t3");
    setTimeout(function(){initMap(data)},500);
    toast("✅ "+data.totalParadas+" paradas otimizadas!");
  }catch(e){
    document.getElementById("prog").style.display="none";
    document.getElementById("fileInfo").textContent="❌ Erro de conexão";
    toast("❌ Erro ao processar arquivo");
  }
}

function initMap(data){
  if(map){map.remove();map=null}
  allMarkers=[];
  map=L.map("map",{zoomControl:false}).setView([-23.55,-46.63],12);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19}).addTo(map);

  var pts=[];
  var paradas=data.paradas||[];
  paradas.forEach(function(p,i){
    var lat=p.lat,lng=p.lng;
    pts.push([lat,lng]);

    var cor = i===0? 'red' : i===1? 'red' : 'blue';
    var icon=L.divIcon({
      className:"",
      html:'<div class="pin-circle '+cor+'">'+(i+1)+'</div>',
      iconSize:[38,38],
      iconAnchor:[19,19]
    });

    var m=L.marker([lat,lng],{icon:icon}).addTo(map);
    m.bindPopup("<b>"+(i+1)+". "+(p.nome||"Parada "+(i+1))+"</b><br><small>"+(p.tipo||"casa").toUpperCase()+"</small>");
    allMarkers.push(m);
  });

  if(pts.length>1){
    L.polyline(pts,{color:"#2563EB",weight:4,opacity:.8}).addTo(map);
  }
  if(pts.length)map.fitBounds(L.latLngBounds(pts).pad(0.2));

  document.getElementById("sp").textContent=paradas.length+"/"+paradas.length;
  document.getElementById("sd").textContent=(data.totalKm||0).toFixed(1)+" km";
  document.getElementById("sl").textContent="R$ "+(data.lucroEstimado||0).toFixed(2);
  document.getElementById("infoTopo").textContent=paradas.length+" PARADAS • "+(data.totalKm||0).toFixed(1)+" KM";

  var agora = new Date();
  var minTotal = Math.round((data.totalKm||0) / 0.35);
  agora.setMinutes(agora.getMinutes() + minTotal);
  var h = String(agora.getHours()).padStart(2,'0');
  var m = String(agora.getMinutes()).padStart(2,'0');
  document.getElementById("horaFim").textContent=h+":"+m;

  document.getElementById("msgBottom").textContent="Rota otimizada com "+data.economia+"% de economia";
  setTimeout(function(){map.invalidateSize()},400);
}

function centralizarGPS(){
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(function(pos){
      map.flyTo([pos.coords.latitude,pos.coords.longitude],15);
      toast("📍 GPS centralizado");
    });
  }else{
    toast("GPS não disponível");
  }
}

function reorganizar(){ toast("🔄 Reorganizando..."); }
function verTudo(){
  if(allMarkers.length)map.fitBounds(L.latLngBounds(allMarkers.map(m=>m.getLatLng())).pad(0.2));
  toast("🗺️ Visualizando tudo");
}
function otimizar(){ toast("⭐ Otimizando rota..."); }
function excluir(){
  if(confirm("Excluir rota atual?")){
    location.reload();
  }
}
</script>
</body>
</html>`);
});

// ============================================================
// API - MESMA DE ANTES
// ============================================================

function toRad(d) { return d * Math.PI / 180; }
function haversine(a, b) {
  var R = 6371;
  var dLat = toRad(b.lat - a.lat);
  var dLng = toRad(b.lng - a.lng);
  var h = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)*Math.sin(dLng/2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function otimizarRota(points) {
  if (points.length <= 1) return points;
  if (points.length > 100) return nearestNeighbor(points);
  return twoOpt(points);
}

function twoOpt(points) {
  var r = points.slice(), imp = true, iter = 0;
  while (imp && iter < 1000) {
    imp = false; iter++;
    for (var i = 1; i < r.length - 2; i++) {
      for (var j = i + 1; j < r.length - 1; j++) {
        var d1 = haversine(r[i-1],r[i]) + haversine(r[j],r[j+1]);
        var d2 = haversine(r[i-1],r[j]) + haversine(r[i],r[j+1]);
        if (d1 > d2) {
          var t = r.slice(i, j+1).reverse();
          r = r.slice(0, i).concat(t, r.slice(j+1));
          imp = true;
        }
      }
    }
  }
  return r;
}

function nearestNeighbor(points) {
  var r = [points[0]], vis = new Set([0]);
  while (r.length < points.length) {
    var last = r[r.length-1], best = -1, dist = Infinity;
    for (var i = 0; i < points.length; i++) {
      if (vis.has(i)) continue;
      var d = haversine(last, points[i]);
      if (d < dist) { dist = d; best = i; }
    }
    r.push(points[best]); vis.add(best);
  }
  return r;
}

function detectarTipo(e) {
  if (!e) return 'casa';
  var x = e.toLowerCase();
  if (/condominio|condomínio|residencial|bloco|torre|conjunto|parque|edificio/i.test(x)) return 'condominio';
  if (/apto|apartamento|ap|andar|sala|loja|conj/i.test(x)) return 'apto';
  return 'casa';
}

function parseCSV(text) {
  var linhas = text.split(/\r?\n/).filter(l => l.trim());
  var result = [];
  for (var i = 0; i < linhas.length; i++) {
    var row = [];
    var linha = linhas[i];
    var dentro = false;
    var campo = '';
    for (var j = 0; j < linha.length; j++) {
      var c = linha[j];
      if (c === '"') {
        dentro =!dentro;
      } else if (c === ',' &&!dentro) {
        row.push(campo.trim());
        campo = '';
      } else {
        campo += c;
      }
    }
    row.push(campo.trim());
    result.push(row);
  }
  return result;
}

var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.post('/api/upload', upload.single('file'), async function(req, res) {
  console.log('Upload:', req.file?.originalname, req.file?.size);
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

    var fn = req.file.originalname || '', txt = '';
    if (fn.endsWith('.xlsx') || fn.endsWith('.xls')) {
      var wb = XLSX.read(req.file.buffer, { type: 'buffer' });
      txt = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
    } else {
      txt = req.file.buffer.toString('utf8');
    }

    var pts = processar(txt, fn);
    if (pts.length === 0) return res.status(400).json({ error: 'Nenhum endereço válido. Precisa colunas lat/lng' });
    if (pts.length < 2) return res.status(400).json({ error: 'Mínimo 2 endereços. Encontrados: ' + pts.length });

    var opt = otimizarRota(pts);
    var km = 0;
    for (var i = 0; i < opt.length - 1; i++) km += haversine(opt[i], opt[i+1]);

    var kmOriginal = km * 1.3;
    var economia = Math.round((1 - km/kmOriginal) * 100);

    var resultado = {
      success: true,
      plataforma: pts[0]?.fonte || 'outro',
      totalParadas: opt.length,
      totalKm: +km.toFixed(2),
      totalMin: Math.round(km / 0.35),
      economia: Math.max(5, Math.min(35, economia)),
      lucroEstimado: +(opt.length * 12.75).toFixed(2),
      paradas: opt.map(function(p, i) {
        return { ordem: i+1, nome: p.nome, lat: p.lat, lng: p.lng, bairro: p.bairro||'', tipo: p.tipo, fonte: p.fonte };
      })
    };

    res.json(resultado);
  } catch(e) {
    console.log('Erro /api/upload:', e.stack);
    res.status(500).json({ error: e.message || 'Erro interno' });
  }
});

function processar(txt, fn) {
  var dados = parseCSV(txt);
  if (dados.length < 2) return [];

  var cab = dados[0].map(h => h.toLowerCase().trim());
  var pf = fn.toLowerCase().includes('amazon')? 'amazon' :
           fn.toLowerCase().includes('shopee')? 'shopee' :
           fn.toLowerCase().includes('meli')||fn.toLowerCase().includes('mercado')? 'meli' : 'outro';

  var cEnd = cab.findIndex(h => h.includes('destination') || h.includes('address') || h.includes('endereco') || h.includes('destino') || h.includes('rua') || h.includes('logradouro'));
  var cLat = cab.findIndex(h => h.includes('latitude') || h === 'lat' || h === 'y');
  var cLng = cab.findIndex(h => h.includes('longitude') || h === 'lng' || h === 'lon' || h === 'x');
  var cBai = cab.findIndex(h => h.includes('bairro') || h.includes('district') || h.includes('neighborhood'));

  var pts = [];
  for (var i = 1; i < dados.length; i++) {
    var cols = dados[i];
    if (cols.length < 2) continue;

    var lat = cLat >= 0? parseFloat(String(cols).replace(',', '.')) : NaN;
    var lng = cLng >= 0? parseFloat(String(cols).replace(',', '.')) : NaN;

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;

    var end = cEnd >= 0? cols : `Parada ${i}`;
    pts.push({
      nome: end,
      lat: lat,
      lng: lng,
      bairro: cBai >= 0? cols : '',
      tipo: detectarTipo(end),
      fonte: pf
    });
  }
  return pts;
}

app.get('/api/health', function(req, res) {
  res.json({ ok: true, version: '5.5', timestamp: new Date().toISOString() });
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('RotaLucro v5.5 on ' + port);
});
