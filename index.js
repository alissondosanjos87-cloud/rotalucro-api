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

// Página inicial → login
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ============================================================
// API
// ============================================================
function toRad(d){return d*Math.PI/180}
function haversine(a,b){var R=6371,dLat=toRad(b.lat-a.lat),dLng=toRad(b.lng-a.lng),h=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)*Math.sin(dLng/2);return R*2*Math.asin(Math.sqrt(h))}
function twoOpt(p){var r=p.slice(),imp=true;while(imp){imp=false;for(var i=1;i<r.length-2;i++){for(var j=i+1;j<r.length-1;j++){if(haversine(r[i-1],r[i])+haversine(r[j],r[j+1])>haversine(r[i-1],r[j])+haversine(r[i],r[j+1])){var t=r.slice(i,j+1).reverse();r=r.slice(0,i).concat(t,r.slice(j+1));imp=true}}}}return r}
function detectarTipo(e){if(!e)return'casa';var x=e.toLowerCase();if(/condominio|condomínio|residencial|bloco|torre|conjunto|parque/i.test(x))return'condominio';if(/apto|apartamento|ap|sala|loja/i.test(x))return'apto';return'casa'}

app.post('/api/upload', upload.single('file'), function(req, res) {
  try{
    if(!req.file)return res.status(400).json({error:'Nenhum arquivo'});
    var fn=req.file.originalname||'',txt='';
    if(fn.endsWith('.xlsx')||fn.endsWith('.xls')){var wb=XLSX.read(req.file.buffer,{type:'buffer'});txt=XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]])}
    else{txt=req.file.buffer.toString('utf8')}
    var pts=processar(txt);
    if(pts.length<2)return res.status(400).json({error:'Min 2 endereços. Encontrados:'+pts.length});
    var opt=twoOpt(pts),km=0;
    for(var i=0;i<opt.length-1;i++)km+=haversine(opt[i],opt[i+1]);
    res.json({success:true,totalParadas:opt.length,totalKm:+km.toFixed(2),totalMin:Math.round(km/0.35),economia:Math.max(5,Math.min(35,Math.round(opt.length*2.3))),lucroEstimado:+(opt.length*12.75).toFixed(2),paradas:opt.map(function(p,i){return{ordem:i+1,nome:p.nome,lat:p.lat,lng:p.lng,bairro:p.bairro||'',tipo:p.tipo}})});
  }catch(e){res.status(500).json({error:e.message})}
});

function processar(txt){
  var linhas=txt.split(/\r?\n/).filter(function(l){return l.trim()});if(linhas.length<2)return[];
  var cab=linhas[0].split(',').map(function(h){return h.trim().replace(/"/g,'').toLowerCase()});
  var cEnd=cab.findIndex(function(h){return h.includes('destination')||h.includes('address')||h.includes('endereco')||h.includes('destino')||h.includes('rua')||h.includes('logradouro')});
  var cLat=cab.findIndex(function(h){return h.includes('latitude')||h.includes('lat')||h==='y'});
  var cLng=cab.findIndex(function(h){return h.includes('longitude')||h.includes('lng')||h.includes('lon')||h==='x'});
  var cBai=cab.findIndex(function(h){return h.includes('bairro')||h.includes('district')});
  var pts=[];
  for(var i=1;i<linhas.length;i++){var cols=linhas[i].split(',').map(function(c){return c.trim().replace(/"/g,'')});if(cols.length<3)continue;var lat=cLat>=0?parseFloat(String(cols[cLat]).replace(',','.')):NaN;var lng=cLng>=0?parseFloat(String(cols[cLng]).replace(',','.')):NaN;if(isNaN(lat)||isNaN(lng))continue;var end=cEnd>=0?cols[cEnd]:'';pts.push({nome:end,lat:lat,lng:lng,bairro:cBai>=0?cols[cBai]:'',tipo:detectarTipo(end)})}
  return pts;
}

app.get('/api/health',function(req,res){res.json({ok:true})});

var port=process.env.PORT||3000;
app.listen(port,function(){console.log('RotaLucro Pro v4.0 on '+port)});
