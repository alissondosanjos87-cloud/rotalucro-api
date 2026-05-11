var express = require('express');
var cors = require('cors');
var multer = require('multer');
var XLSX = require('xlsx');
var upload = multer({ storage: multer.memoryStorage() });
var app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/', function(req, res) {
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>RotaLucro v3</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;background:#0a0f1a;color:#fff;overflow:hidden;height:100dvh}
#app{width:100%;height:100%;max-width:480px;margin:0 auto;position:relative}
#map{position:absolute;inset:0;z-index:1}
.topbar{position:absolute;top:12px;left:12px;right:12px;z-index:1000;display:flex;justify-content:space-between;align-items:flex-start}
.menu-btn{width:44px;height:44px;border-radius:12px;background:#E10600;color:#fff;border:0;font-size:20px;font-weight:800;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.4)}
.menu-drop{position:absolute;top:52px;left:0;display:none;flex-direction:column;gap:4px;z-index:1001}
.menu-drop.open{display:flex}
.menu-drop button{padding:10px 14px;border-radius:8px;border:0;font-weight:700;font-size:12px;cursor:pointer;background:rgba(0,0,0,.9);color:#fff;text-align:left;white-space:nowrap}
.menu-drop button:active{background:#E10600}
.clock-box{background:rgba(0,0,0,.9);padding:8px 12px;border-radius:10px;text-align:center;border:2px solid #0057FF}
.clock-box .cl{font-size:9px;color:#888;text-transform:uppercase;letter-spacing:1px}
.clock-box .ct{font-size:14px;font-weight:700;color:#0057FF}
.clock-box .ce{font-size:10px;color:#aaa}
.card{position:absolute;bottom:0;left:0;right:0;z-index:1000;background:#0d1117;border-radius:20px 20px 0 0;padding:12px 16px 16px;box-shadow:0 -8px 32px rgba(0,0,0,.6);border-top:3px solid #0057FF;max-height:55vh;display:flex;flex-direction:column}
.card .handle{width:36px;height:4px;background:#333;border-radius:2px;margin:0 auto 10px}
.card .row{display:grid;grid-template-columns:1fr 1fr 1.3fr;gap:8px;margin-bottom:10px}
.card .row div{text-align:center}
.card .row span{font-size:9px;color:#888;text-transform:uppercase;letter-spacing:.5px}
.card .row strong{display:block;font-size:18px;font-weight:800;margin-top:2px}
.card .row .gr strong{color:#00C853}
.btn-start{width:100%;height:48px;background:#00C853;color:#000;font-weight:800;font-size:15px;border:0;border-radius:12px;cursor:pointer}
.stops{overflow-y:auto;flex:1;margin-top:8px;min-height:0}
.stop-item{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:13px}
.stop-num{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:12px;color:#fff;flex-shrink:0}
.stop-info{flex:1;min-width:0}
.stop-info .addr{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.stop-info .meta{font-size:10px;color:#888}
.toast{position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#1E293B;color:#fff;padding:10px 18px;border-radius:10px;font-weight:600;font-size:13px;z-index:2000;opacity:0;transition:opacity .3s;white-space:nowrap}
.toast.show{opacity:1}
.pin{width:36px;height:44px;position:relative;display:grid;place-items:center;font-weight:800;color:#fff;font-size:14px}
.pin::before{content:"";position:absolute;width:36px;height:36px;background:currentColor;border-radius:50% 50% 50% 0;transform:rotate(-45deg);top:0;left:0;border:3px solid #fff;box-shadow:0 3px 12px rgba(0,0,0,.5)}
.pin span{position:relative;z-index:1}
#prog{display:none;text-align:center;padding:40px}
.sp{width:40px;height:40px;border:3px solid #333;border-top-color:#00C853;border-radius:50%;animation:sp .8s linear infinite;margin:0 auto 12px}
@keyframes sp{to{transform:rotate(360deg)}}
input[type=file]{display:none}
</style>
</head>
<body>
<div id="app">
  <div id="map"></div>
  <div class="topbar">
    <div style="position:relative">
      <button class="menu-btn" onclick="toggleMenu()">☰</button>
      <div class="menu-drop" id="menuDrop">
        <button onclick="gps()">📍 GPS</button>
        <button onclick="reorg()">🔄 REORG.</button>
        <button onclick="verTudo()">🗺️ VER TUDO</button>
        <button onclick="otimizar()">🚀 OTIMIZAR</button>
        <button onclick="document.getElementById('fileInput').click()">📂 IMPORTAR</button>
      </div>
    </div>
    <div class="clock-box" id="clockBox" style="display:none">
      <div class="cl">⏱ TÉRMINO ESTIMADO</div>
      <div class="ct" id="tempoTotal">--:--</div>
      <div class="ce" id="horaTermino">--:--</div>
    </div>
  </div>
  <div class="card" id="card" style="display:none">
    <div class="handle"></div>
    <div class="row">
      <div><span>PARADAS</span><strong id="sp">0</strong></div>
      <div><span>DISTÂNCIA</span><strong id="sd">0 km</strong></div>
      <div class="gr"><span>LUCRO</span><strong id="sl">R$0</strong></div>
    </div>
    <button class="btn-start" onclick="iniciar()">▶ INICIAR ROTA</button>
    <div class="stops" id="stopsList"></div>
  </div>
  <div class="toast" id="toast"></div>
  <input type="file" id="fileInput" accept=".csv,.xlsx,.xls" onchange="importar(this.files[0])">
  <div id="prog"><div class="sp"></div><p style="color:#888">Processando e otimizando...</p></div>
</div>
<script>
var map,allMarkers=[],rotaData=null;
function initApp(){
  map=L.map('map',{zoomControl:false,attributionControl:false}).setView([-23.55,-46.63],13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
  document.getElementById('fileInput').click();
}
function toggleMenu(){document.getElementById('menuDrop').classList.toggle('open')}
function toast(m){var t=document.getElementById('toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(function(){t.classList.remove('show')},2500)}
function getColor(t,f){if(f==='amazon')return'#0057FF';if(f==='shopee')return'#E10600';if(f==='meli')return'#FF6D00';if(t==='condominio')return'#FFD700';if(t==='apto')return'#FF9800';return'#00C853'}
async function importar(f){
  if(!f)return;
  document.getElementById('card').style.display='none';
  document.getElementById('clockBox').style.display='none';
  document.getElementById('prog').style.display='block';
  var d=new FormData();d.append('file',f);
  try{
    var r=await fetch('/api/upload',{method:'POST',body:d});
    var data=await r.json();
    document.getElementById('prog').style.display='none';
    document.getElementById('card').style.display='flex';
    document.getElementById('clockBox').style.display='block';
    if(data.error){toast('❌ '+data.error);return}
    rotaData=data;
    initMap(data);
    toast('✅ '+data.totalParadas+' paradas otimizadas');
  }catch(e){
    document.getElementById('prog').style.display='none';
    document.getElementById('card').style.display='flex';
    document.getElementById('clockBox').style.display='block';
    toast('❌ Erro de conexao');
  }
}
function initMap(data){
  allMarkers=[];var pts=[];
  data.paradas.forEach(function(p,i){
    pts.push([p.lat,p.lng]);
    var color=getColor(p.tipo,p.fonte);
    var icon=L.divIcon({className:'',html:'<div class="pin" style="color:'+color+'"><span>'+(i+1)+'</span></div>',iconSize:[36,44],iconAnchor:[18,40]});
    var m=L.marker([p.lat,p.lng],{icon:icon,tipo:p.tipo,fonte:p.fonte}).addTo(map);
    m.bindPopup('<b>'+(i+1)+'. '+(p.nome||'Parada')+'</b><br><small>'+(p.tipo||'casa').toUpperCase()+'</small>');
    allMarkers.push(m);
  });
  if(pts.length>1)L.polyline(pts,{color:'#00C853',weight:5,opacity:.9}).addTo(map);
  if(pts.length)map.fitBounds(L.latLngBounds(pts).pad(0.15));
  document.getElementById('sp').textContent=data.totalParadas;
  document.getElementById('sd').textContent=data.totalKm.toFixed(1)+' km';
  document.getElementById('sl').textContent='R$ '+data.lucroEstimado.toFixed(2);
  var agora=new Date(),fim=new Date(agora.getTime()+data.totalMin*60000);
  document.getElementById('tempoTotal').textContent=fim.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  document.getElementById('horaTermino').textContent=data.totalParadas+' PARADAS • '+data.totalKm.toFixed(1)+' KM';
  var h='';
  data.paradas.forEach(function(p,i){h+='<div class="stop-item"><div class="stop-num" style="background:'+getColor(p.tipo,p.fonte)+'">'+(i+1)+'</div><div class="stop-info"><div class="addr">'+p.nome+'</div><div class="meta">'+p.bairro+' • '+(p.tipo||'casa').toUpperCase()+'</div></div></div>'});
  document.getElementById('stopsList').innerHTML=h;
}
function gps(){if(navigator.geolocation)navigator.geolocation.getCurrentPosition(function(p){map.setView([p.coords.latitude,p.coords.longitude],16);L.circleMarker([p.coords.latitude,p.coords.longitude],{radius:8,color:'#fff',fillColor:'#0057FF',fillOpacity:1}).addTo(map)});toast('📍 GPS ativado')}
function reorg(){if(rotaData)initMap(rotaData);toast('🔄 Reorganizado')}
function verTudo(){if(allMarkers.length){var g=L.featureGroup(allMarkers);map.fitBounds(g.getBounds().pad(0.1))};toast('🗺️ Ver tudo')}
function otimizar(){if(rotaData){initMap(rotaData);toast('🚀 Otimizado')}}
function iniciar(){if(allMarkers.length>0){map.flyTo(allMarkers[0].getLatLng(),17,{duration:1.5});setTimeout(function(){allMarkers[0].openPopup()},1600)};toast('🚀 Rota iniciada!')}
window.onload=initApp;
</script>
</body>
</html>`);
});

// API
function toRad(d){return d*Math.PI/180}
function haversine(a,b){var R=6371,dLat=toRad(b.lat-a.lat),dLng=toRad(b.lng-a.lng),h=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)*Math.sin(dLng/2);return R*2*Math.asin(Math.sqrt(h))}
function twoOpt(p){var r=p.slice(),imp=true;while(imp){imp=false;for(var i=1;i<r.length-2;i++){for(var j=i+1;j<r.length-1;j++){if(haversine(r[i-1],r[i])+haversine(r[j],r[j+1])>haversine(r[i-1],r[j])+haversine(r[i],r[j+1])){var t=r.slice(i,j+1).reverse();r=r.slice(0,i).concat(t,r.slice(j+1));imp=true}}}}return r}
function detectarTipo(e){if(!e)return'casa';var x=e.toLowerCase();if(/condominio|condomínio|residencial|bloco|torre|conjunto|parque/i.test(x))return'condominio';if(/apto|apartamento|ap|sala|loja/i.test(x))return'apto';return'casa'}

app.post('/api/upload',upload.single('file'),function(req,res){
  try{
    if(!req.file)return res.status(400).json({error:'Nenhum arquivo'});
    var fn=req.file.originalname||'',txt='';
    if(fn.endsWith('.xlsx')||fn.endsWith('.xls')){var wb=XLSX.read(req.file.buffer,{type:'buffer'});txt=XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]])}
    else{txt=req.file.buffer.toString('utf8')}
    var pts=processar(txt,fn);
    if(pts.length<2)return res.status(400).json({error:'Min 2 enderecos. Encontrados:'+pts.length});
    var opt=twoOpt(pts),km=0;
    for(var i=0;i<opt.length-1;i++)km+=haversine(opt[i],opt[i+1]);
    res.json({success:true,plataforma:pts[0]?.fonte||'outro',totalParadas:opt.length,totalKm:+km.toFixed(2),totalMin:Math.round(km/0.35),economia:Math.max(5,Math.min(35,Math.round(opt.length*2.3))),lucroEstimado:+(opt.length*12.75).toFixed(2),paradas:opt.map(function(p,i){return{ordem:i+1,nome:p.nome,lat:p.lat,lng:p.lng,bairro:p.bairro||'',tipo:p.tipo,fonte:p.fonte}})});
  }catch(e){res.status(500).json({error:e.message})}
});

function processar(txt,fn){
  var linhas=txt.split(/\r?\n/).filter(function(l){return l.trim()});if(linhas.length<2)return[];
  var cab=linhas[0].split(',').map(function(h){return h.trim().replace(/"/g,'').toLowerCase()});
  var pf=fn.toLowerCase().includes('amazon')?'amazon':fn.toLowerCase().includes('shopee')?'shopee':fn.toLowerCase().includes('meli')||fn.toLowerCase().includes('mercado')?'meli':'outro';
  var cEnd=cab.findIndex(function(h){return h.includes('destination')||h.includes('address')||h.includes('endereco')||h.includes('destino')||h.includes('rua')||h.includes('logradouro')});
  var cLat=cab.findIndex(function(h){return h.includes('latitude')||h.includes('lat')||h==='y'});
  var cLng=cab.findIndex(function(h){return h.includes('longitude')||h.includes('lng')||h.includes('lon')||h==='x'});
  var cBai=cab.findIndex(function(h){return h.includes('bairro')||h.includes('district')});
  var pts=[];
  for(var i=1;i<linhas.length;i++){var cols=linhas[i].split(',').map(function(c){return c.trim().replace(/"/g,'')});if(cols.length<3)continue;var lat=cLat>=0?parseFloat(String(cols[cLat]).replace(',','.')):NaN;var lng=cLng>=0?parseFloat(String(cols[cLng]).replace(',','.')):NaN;if(isNaN(lat)||isNaN(lng))continue;var end=cEnd>=0?cols[cEnd]:'';pts.push({nome:end,lat:lat,lng:lng,bairro:cBai>=0?cols[cBai]:'',tipo:detectarTipo(end),fonte:pf})}
  return pts;
}

app.get('/api/health',function(req,res){res.json({ok:true,version:'3.0'})});

var port=process.env.PORT||3000;
app.listen(port,function(){console.log('RotaLucro v3 on '+port)});
