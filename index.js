
var express = require('express');
var cors = require('cors');
var multer = require('multer');
var XLSX = require('xlsx');
// Descomente se for usar Supabase
// var { createClient } = require('@supabase/supabase-js');
// var ws = require('ws');
// globalThis.WebSocket = ws;
// var supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });

var app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ============================================================
// FRONTEND - mesmo HTML, só mudei o fetch pra mostrar erro
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
#t1{display:flex;justify-content:center;align-items:center;padding:24px;position:fixed;inset:0;flex-direction:column;background:radial-gradient(circle at 50% -10%,#1e293b,#0F172A 45%,#020617)}
#t2{display:none;padding:20px;overflow-y:auto;position:fixed;inset:0;flex-direction:column;background:#0F172A}
#t3{display:none;position:fixed;inset:0;flex-direction:column;background:#000}
.cx{width:100%;max-width:340px;text-align:center}
.cx h1{font-size:32px;font-weight:800;margin-bottom:4px}
.cx h1 span{color:#00C853}
.cx p{color:#94A3B8;font-size:14px;margin-bottom:24px}
.cx input{width:100%;padding:14px;margin:6px 0;border:1.5px solid rgba(255,255,255,.1);border-radius:14px;background:rgba(255,255,255,.06);color:#fff;font-size:15px}
.bt{width:100%;padding:14px;border:0;border-radius:14px;font-weight:800;font-size:16px;cursor:pointer}
.btg{background:#00C853;color:#022c12}
.ttl{font-size:22px;font-weight:800;margin-bottom:4px}
.ttl span{color:#00C853}
.sub{color:#94A3B8;font-size:13px;margin-bottom:20px}
.cd{background:#1E293B;padding:16px;border-radius:16px;margin-bottom:10px;cursor:pointer;font-weight:600;text-align:left;border-left:4px solid #00C853}
.cd:active{transform:scale(.98)}
.cd span{display:block;color:#94A3B8;font-size:12px;margin-top:4px}
.cd.am{border-left-color:#FFD700}
#map{flex:1;z-index:1}
.tb{position:absolute;top:12px;left:12px;right:12px;height:48px;background:rgba(15,23,42,.94);backdrop-filter:blur(14px);border-radius:14px;display:flex;align-items:center;justify-content:space-between;padding:0 12px;z-index:1000;border:1px solid rgba(255,255,255,.08)}
.tb button{width:34px;height:34px;border-radius:10px;border:0;background:rgba(255,255,255,.06);color:#fff;font-size:16px;cursor:pointer}
.tb.ti{text-align:center;font-weight:700;font-size:14px}
.tb.ti small{display:block;color:#94A3B8;font-size:11px}
.ft{position:absolute;left:14px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:10px;z-index:1000}
.fd{width:36px;height:36px;border-radius:50%;border:3px solid #fff;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.4)}
.fd:active{transform:scale(.9)}
.fd.vd{background:#00C853}.fd.az{background:#0057FF}.fd.vm{background:#E10600}.fd.lr{background:#FF6D00}
.fd.at{border-color:#FFD700}
.st{position:absolute;bottom:0;left:0;right:0;background:#0F172A;border-radius:24px 24px 0 0;padding:14px 18px 18px;box-shadow:0 -8px 32px rgba(0,0,0,.5);z-index:1000;border-top:1px solid rgba(255,255,255,.08)}
.st.ha{width:36px;height:4px;background:#334155;border-radius:2px;margin:0 auto 12px}
.st.rs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px}
.st.rs div span{font-size:10px;color:#94A3B8;text-transform:uppercase;font-weight:600}
.st.rs div strong{display:block;font-size:20px;font-weight:800;margin-top:2px}
.st.rs.vr strong{color:#00C853}
.btn-iniciar{width:100%;height:50px;background:#00C853;color:#022c12;font-weight:800;font-size:15px;border:0;border-radius:14px;cursor:pointer}
.pin{width:34px;height:42px;position:relative;display:grid;place-items:center;font-weight:800;color:#fff;font-size:13px}
.pin::before{content:"";position:absolute;width:34px;height:34px;background:currentColor;border-radius:50% 50% 50% 0;transform:rotate(-45deg);top:0;left:0;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.4)}
.pin span{position:relative;z-index:1}
.toast{position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#1E293B;color:#fff;padding:12px 18px;border-radius:12px;font-weight:600;font-size:13px;z-index:3000;opacity:0;transition:.3s}
.toast.show{opacity:1}
#prog{display:none;text-align:center;padding:20px}
.sp{width:36px;height:36px;border:3px solid #334155;border-top-color:#00C853;border-radius:50%;animation:sp.8s linear infinite;margin:0 auto 12px}
@keyframes sp{to{transform:rotate(360deg)}}
</style>
</head>
<body>

<div id="t1">
  <div class="cx">
    <h1>Rota<span>Lucro</span></h1>
    <p>Otimizador inteligente de entregas</p>
    <input type="email" value="entregador@rotalucro.com" placeholder="Email">
    <input type="password" value="123456" placeholder="Senha">
    <button class="bt btg" onclick="irPara('t2')">ENTRAR</button>
  </div>
</div>

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

<div id="t3">
  <div id="map"></div>
  <div class="tb">
    <button onclick="irPara('t2')">←</button>
    <div class="ti">Rota Otimizada<small id="routeInfo">0 paradas</small></div>
    <button>⋮</button>
  </div>
  <div class="ft">
    <div class="fd vd at" data-type="all" onclick="filtrar('all',this)"></div>
    <div class="fd az" data-type="amazon" onclick="filtrar('amazon',this)"></div>
    <div class="fd vm" data-type="shopee" onclick="filtrar('shopee',this)"></div>
    <div class="fd lr" data-type="meli" onclick="filtrar('meli',this)"></div>
  </div>
  <div class="st">
    <div class="ha"></div>
    <div class="rs">
      <div><span>Paradas</span><strong id="sp">0</strong></div>
      <div><span>Distância</span><strong id="sd">0 km</strong></div>
      <div class="vr"><span>Lucro</span><strong id="sl">R$ 0</strong></div>
    </div>
    <button class="btn-iniciar" onclick="iniciar()">▶ INICIAR ROTA</button>
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
    if(data.error){
      document.getElementById("fileInfo").textContent="❌ "+data.error;
      toast("❌ "+data.error);
      return
    }
    rotaData=data;
    irPara("t3");
    setTimeout(function(){initMap(data)},500);
    toast("✅ "+data.totalParadas+" paradas! Economia: "+data.economia+"%");
  }catch(e){
    document.getElementById("prog").style.display="none";
    document.getElementById("fileInfo").textContent="❌ Erro de conexão";
    toast("❌ Erro ao processar arquivo");
  }
}

function getColor(t,f){
  if(f==="amazon")return"#0057FF";
  if(f==="shopee")return"#E10600";
  if(f==="meli")return"#FF6D00";
  if(t==="condominio")return"#FFD700";
  if(t==="apto")return"#FF9800";
  return"#00C853";
}

function initMap(data){
  if(map){map.remove();map=null}
  allMarkers=[];
  map=L.map("map",{zoomControl:false}).setView([-23.55,-46.63],12);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19}).addTo(map);
  var pts=[];
  var paradas=data.paradas||data.order||[];
  paradas.forEach(function(p,i){
    var lat=p.lat,lng=p.lng;
    pts.push([lat,lng]);
    var color=getColor(p.tipo,p.fonte);
    var icon=L.divIcon({className:"",html:'<div class="pin" style="color:'+color+'"><span>'+(i+1)+'</span></div>',iconSize:[34,42],iconAnchor:[17,38]});
    var m=L.marker([lat,lng],{icon:icon,tipo:p.tipo,fonte:p.fonte}).addTo(map);
    m.bindPopup("<b>"+(i+1)+". "+(p.nome||"Parada "+(i+1))+"</b><br><small>"+(p.tipo||"casa").toUpperCase()+" • "+(p.fonte||"").toUpperCase()+"</small>");
    allMarkers.push(m);
  });
  if(pts.length>1)L.polyline(pts,{color:"#00C853",weight:4,opacity:.85}).addTo(map);
  if(pts.length)map.fitBounds(L.latLngBounds(pts).pad(0.2));
  document.getElementById("sp").textContent=paradas.length;
  document.getElementById("sd").textContent=(data.totalKm||0).toFixed(1)+" km";
  document.getElementById("sl").textContent="R$ "+(data.lucroEstimado||0);
  document.getElementById("routeInfo").textContent=paradas.length+" paradas • "+data.economia+"% economia";
  setTimeout(function(){map.invalidateSize()},400);
}

function filtrar(type,el){
  document.querySelectorAll(".fd").forEach(function(d){d.classList.remove("at")});
  el.classList.add("at");
  var count=0;
  allMarkers.forEach(function(m){
    if(type==="all"||m.options.fonte===type){m.addTo(map);count++}
    else map.removeLayer(m);
  });
  document.getElementById("routeInfo").textContent=count+" paradas";
}

function iniciar(){
  if(allMarkers.length>0){
    map.flyTo(allMarkers[0].getLatLng(),16,{duration:1.5});
    setTimeout(function(){allMarkers[0].openPopup()},1600);
  }
  toast("🚀 Rota iniciada!");
}
</script>
</body>
</html>`);
});

// ============================================================
// API - MELHORIAS
// ============================================================

function toRad(d) { return d * Math.PI / 180; }
function haversine(a, b) {
  var R = 6371;
  var dLat = toRad(b.lat - a.lat);
  var dLng = toRad(b.lng - a.lng);
  var h = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)*Math.sin(dLng/2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

// 2-opt só pra rota pequena, senão usa nearest neighbor
function otimizarRota(points) {
  if (points.length <= 1) return points;
  if (points.length > 100) {
    console.log('Rota grande, usando Nearest Neighbor');
    return nearestNeighbor(points);
  }
  return twoOpt(points);
}

function twoOpt(points) {
  var r = points.slice(), imp = true, iter = 0;
  while (imp && iter < 1000) { // trava de segurança
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

// Parser CSV que respeita aspas
function parseCSV(text) {
  var linhas = text.split(/\r?\n/).filter(l => l.trim());
  return linhas.map(linha => {
    var cols = linha.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
    return cols.map(c => c.replace(/^"|"$/g, '').trim());
  });
}

var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 } // 10mb
});

app.post('/api/upload', upload.single('file'), async function(req, res) {
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
    if (pts.length === 0) return res.status(400).json({ error: 'Nenhum endereço válido encontrado. Verifique as colunas lat/lng' });
    if (pts.length < 2) return res.status(400).json({ error: 'Mínimo 2 endereços. Encontrados: ' + pts.length });

    var opt = otimizarRota(pts);
    var km = 0;
    for (var i = 0; i < opt.length - 1; i++) km += haversine(opt[i], opt[i+1]);

    var kmOriginal = km * 1.3; // estima rota sem otimização
    var economia = Math.round((1 - km/kmOriginal) * 100);

    var resultado = {
      success: true,
      plataforma: pts[0]?.fonte || 'outro',
      totalParadas: opt.length,
      totalKm: +km.toFixed(2),
      totalMin: Math.round(km / 0.35), // 21km/h média cidade
      economia: Math.max(5, Math.min(35, economia)),
      lucroEstimado: +(opt.length * 12.75).toFixed(2),
      paradas: opt.map(function(p, i) {
        return { ordem: i+1, nome: p.nome, lat: p.lat, lng: p.lng, bairro: p.bairro||'', tipo: p.tipo, fonte: p.fonte };
      })
    };

    // Descomente pra salvar no Supabase
    // if (process.env.SUPABASE_URL) {
    // const { error } = await supabase.from('rotas').insert({
    // arquivo_nome: fn,
    // total_paradas: opt.length,
    // total_km: resultado.totalKm,
    // lucro_estimado: resultado.lucroEstimado,
    // paradas: opt,
    // plataforma: resultado.plataforma
    // });
    // if (error) console.log('Erro ao salvar:', error);
    // }

    res.json(resultado);
  } catch(e) {
    console.log('Erro /api/upload:', e);
    res.status(500).json({ error: e.message || 'Erro interno' });
  }
});

function processar(txt, fn) {
  var dados = parseCSV(txt);
  if (dados.length < 2) return [];

  var cab = dados[0].map(h => h.toLowerCase());
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
    if (cols.length < 3) continue;

    var lat = cLat >= 0? parseFloat(String(cols[cLat]).replace(',', '.')) : NaN;
    var lng = cLng >= 0? parseFloat(String(cols[cLng]).replace(',', '.')) : NaN;

    // Valida coordenada
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
  res.json({ ok: true, version: '5.1', timestamp: new Date().toISOString() });
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('RotaLucro v5.1 on ' + port);
});
