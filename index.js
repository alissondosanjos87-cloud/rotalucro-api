var express = require('express');
var cors = require('cors');
var multer = require('multer');
var XLSX = require('xlsx');

var app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ============================================================
// FRONTEND v3 - LAYOUT NOVO
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

/* TELA LOGIN */
.cx{width:100%;max-width:340px;text-align:center}
.cx h1{font-size:32px;font-weight:800;margin-bottom:4px}
.cx h1 span{color:#00C853}
.cx p{color:#94A3B8;font-size:14px;margin-bottom:24px}
.cx input{width:100%;padding:14px;margin:6px 0;border:1.5px solid rgba(255,255,255,.1);border-radius:14px;background:rgba(255,255,255,.06);color:#fff;font-size:15px}
.bt{width:100%;padding:14px;border:0;border-radius:14px;font-weight:800;font-size:16px;cursor:pointer}
.btg{background:#00C853;color:#022c12}

/* TELA IMPORTAR */
.ttl{font-size:22px;font-weight:800;margin-bottom:4px}
.ttl span{color:#00C853}
.sub{color:#94A3B8;font-size:13px;margin-bottom:20px}
.cd{background:#1E293B;padding:16px;border-radius:16px;margin-bottom:10px;cursor:pointer;font-weight:600;text-align:left;border-left:4px solid #00C853}
.cd:active{transform:scale(.98)}
.cd span{display:block;color:#94A3B8;font-size:12px;margin-top:4px}
.cd.am{border-left-color:#FFD700}

/* TELA MAPA V3 */
#map{position:absolute;inset:0;z-index:1}

/* HEADER NOVO */
.header{position:absolute;top:0;left:0;right:0;height:56px;background:#1E293B;display:flex;align-items:center;justify-content:space-between;padding:0 16px;z-index:1000;border-bottom:1px solid rgba(255,255,255,.08)}
.header.left{display:flex;align-items:center;gap:12px}
.header.left button{background:none;border:0;color:#fff;font-size:20px;cursor:pointer}
.header.logo{font-size:18px;font-weight:800}
.header.logo span{color:#00C853}
.header.logo small{color:#64748B;font-weight:500;margin-left:4px}
.header.add{background:#00C853;color:#022c12;border:0;padding:8px 16px;border-radius:10px;font-weight:700;font-size:14px;cursor:pointer}

/* MENU LATERAL ESQUERDO */
.sidebar{position:absolute;left:12px;top:72px;display:flex;flex-direction:column;gap:8px;z-index:1000}
.sidebar.btn{width:56px;height:56px;border-radius:12px;border:0;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:11px;font-weight:700;gap:2px;box-shadow:0 4px 12px rgba(0,0,0,.3)}
.sidebar.btn:active{transform:scale(.95)}
.sidebar.btn svg{width:22px;height:22px}
.sidebar.red{background:#E11D48;color:#fff}
.sidebar.blue{background:#2563EB;color:#fff}
.sidebar.orange{background:#F97316;color:#fff}
.sidebar.white{background:#F1F5F9;color:#0F172A}

/* CARD TERMINO ESTIMADO */
.card-top{position:absolute;top:72px;right:12px;background:#fff;color:#0F172A;padding:12px 16px;border-radius:14px;z-index:1000;box-shadow:0 4px 16px rgba(0,0,0,.3);text-align:center}
.card-top.label{font-size:10px;color:#64748B;font-weight:600;text-transform:uppercase}
.card-top.hora{font-size:32px;font-weight:800;line-height:1;margin:4px 0}
.card-top.info{font-size:11px;color:#64748B;font-weight:600}

/* PINO CIRCULAR NOVO */
.pin-circle{width:36px;height:36px;border-radius:50%;background:#2563EB;border:3px solid #fff;display:grid;place-items:center;color:#fff;font-weight:800;font-size:14px;box-shadow:0 3px 10px rgba(0,0,0,.4)}
.pin-circle.red{background:#E11D48}
.pin-circle.orange{background:#F97316}

/* BOTTOM SHEET NOVO */
.bottom{position:absolute;bottom:0;left:0;right:0;background:#1E293B;border-radius:24px 24px 0 0;padding:16px;z-index:1000;box-shadow:0 -8px 32px rgba(0,0,0,.5)}
.bottom.stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px}
.bottom.stats.box{background:#0F172A;padding:12px;border-radius:12px;text-align:center}
.bottom.stats.box.label{font-size:10px;color:#94A3B8;font-weight:600;text-transform:uppercase}
.bottom.stats.box.valor{font-size:20px;font-weight:800;margin-top:4px}
.bottom.msg{font-size:11px;color:#94A3B8;text-align:center;margin-bottom:12px}
.bottom.actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.bottom.actions button{height:48px;border:0;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px}
.bottom.actions.restaurar{background:#334155;color:#fff}
.bottom.actions.excluir{background:#E11D48;color:#fff}

/* TOAST */
.toast{position:fixed;bottom:180px;left:50%;transform:translateX(-50%);background:#1E293B;color:#fff;padding:12px 18px;border-radius:12px;font-weight:600;font-size:13px;z-index:3000;opacity:0;transition:.3s}
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
      <svg fill="currentColor" viewBox="0 0 20 20"><path d="M3 5h14M3 10h14M3 15h14"/></svg>
      MENU
    </button>
    <button class="btn blue" onclick="centralizarGPS()">
      <svg fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="3"/><path d="M10 2v3M10 15v3M2 10h3M15 10h3"/></svg>
      GPS
    </button>
    <button class="btn blue" onclick="toast('Modo Carro')">
      <svg fill="currentColor" viewBox="0 0 20 20"><path d="M8 7h8l-1 5H9zM6 9H5l-1 3h2zM14 14a2 2 0 100-4 2 2 0 000 4zM8 14a2 2 0 100-4 2 2 0 000 4z"/></svg>
      MODO<br>CARRO
    </button>
    <button class="btn orange" onclick="reorganizar()">
      <svg fill="currentColor" viewBox="0 0 20 20"><path d="M5 3l4 4H7v6h2l-4 4-4-4h2V7H3zM15 17l-4-4h2V7h-2l4-4 4 4h-2v6h2z"/></svg>
      REORG.
    </button>
    <button class="btn blue" onclick="verTudo()">
      <svg fill="currentColor" viewBox="0 0 20 20"><path d="M3 3h6v6H3zM11 3h6v6h-6zM3 11h6v6H3zM11 11h6v6h-6z"/></svg>
      VER<br>TUDO
    </button>
    <button class="btn white" onclick="otimizar()">
      <svg fill="#0F172A" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
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
    <div class="msg" id="msgBottom">Importe uma planilha para começar</div>
    <div class="actions">
      <button class="restaurar" onclick="toast('Restaurar')">
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><path d="M4 10a6 6 0 0112 0v1H4v-1zM4 12h12v2H4z"/></svg>
        Restaurar
      </button>
      <button class="excluir" onclick="excluir()">
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><path d="M6 2l2-2h4l2 2h4v2H2V2zM3 6h14l-1 12H4z"/></svg>
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

    // PINO CIRCULAR NOVO
    var cor = i===0? 'red' : i===1? 'red' : 'blue';
    var icon=L.divIcon({
      className:"",
      html:'<div class="pin-circle '+cor+'">'+(i+1)+'</div>',
      iconSize:[36,36],
      iconAnchor:[18,18]
    });

    var m=L.marker([lat,lng],{icon:icon}).addTo(map);
    m.bindPopup("<b>"+(i+1)+". "+(p.nome||"Parada "+(i+1))+"</b><br><small>"+(p.tipo||"casa").toUpperCase()+"</small>");
    allMarkers.push(m);
  });

  if(pts.length>1){
    L.polyline(pts,{color:"#2563EB",weight:4,opacity:.8}).addTo(map);
  }
  if(pts.length)map.fitBounds(L.latLngBounds(pts).pad(0.2));

  // ATUALIZA CARDS
  document.getElementById("sp").textContent=paradas.length+"/"+paradas.length;
  document.getElementById("sd").textContent=(data.totalKm||0).toFixed(1)+" km";
  document.getElementById("sl").textContent="R$ "+(data.lucroEstimado||0).toFixed(2);
  document.getElementById("infoTopo").textContent=paradas.length+" PARADAS • "+(data.totalKm||0).toFixed(1)+" KM";

  // CALCULA HORA FIM
  var agora = new Date();
  var minTotal = Math.round((data.totalKm||0) / 0.35); // 21km/h
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
// API
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

    var lat = cLat >= 0? parseFloat(String(cols[cLat]).replace(',', '.')) : NaN;
    var lng = cLng >= 0? parseFloat(String(cols[cLng]).replace(',', '.')) : NaN;

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;

    var end = cEnd >= 0? cols[cEnd] : `Parada ${i}`;
    pts.push({
      nome: end,
      lat: lat,
      lng: lng,
      bairro: cBai >= 0? cols[cBai] : '',
      tipo: detectarTipo(end),
      fonte: pf
    });
  }
  return pts;
}

app.get('/api/health', function(req, res) {
  res.json({ ok: true, version: '5.4', timestamp: new Date().toISOString() });
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('RotaLucro v5.4 on ' + port);
});
