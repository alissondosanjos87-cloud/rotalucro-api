const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json({limit:'2mb'}));

const cache=new Map();
const getCache=k=>{const v=cache.get(k);if(!v)return null;if(Date.now()>v.exp){cache.delete(k);return null}return v.data};
const setCache=(k,d,t=300)=>cache.set(k,{data:d,exp:Date.now()+t*1000});
const toRad=d=>d*Math.PI/180;
const haversine=(a,b)=>{const R=6371,dLat=toRad(b.lat-a.lat),dLng=toRad(b.lng-a.lng),la1=toRad(a.lat),la2=toRad(b.lat),h=Math.sin(dLat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2;return 2*R*Math.asin(Math.sqrt(h))};
const twoOpt=p=>{let r=[...p],i=true;const d=(x,y)=>haversine(x,y);while(i){i=false;for(let a=1;a<r.length-2;a++)for(let b=a+1;b<r.length-1;b++){const p1=r[a-1],p2=r[a],p3=r[b],p4=r[b+1];if(d(p1,p2)+d(p3,p4)>d(p1,p3)+d(p2,p4)){r.splice(a,b-a+1,...r.slice(a,b+1).reverse());i=true}}}return r};

app.get('/api/health',(q,r)=>r.json({ok:true,time:new Date().toISOString(),version:'2.0'}));
app.post('/api/lucro',(q,r)=>{const {valorEntrega=7,km=0,tempoMin=0,custoKm=0.75,custoHora=18}=q.body||{};const c=km*custoKm+(tempoMin/60)*custoHora,l=valorEntrega-c,m=valorEntrega?l/valorEntrega*100:0;r.json({valorEntrega,km,tempoMin,custo:+c.toFixed(2),lucro:+l.toFixed(2),margem:+m.toFixed(1)})});
app.post('/api/optimize',(q,r)=>{try{const {points=[],start}=q.body||{};if(points.length<2)return r.status(400).json({error:'Min 2'});const k=JSON.stringify({points,start});const c=getCache(k);if(c)return r.json({...c,cached:true});const s=start||points[0],rest=points.filter(p=>p!==s),opt=[s,...twoOpt([s,...rest]).slice(1)];let km=0;for(let i=0;i<opt.length-1;i++)km+=haversine(opt[i],opt[i+1]);const res={order:opt,totalKm:+km.toFixed(2),totalMin:Math.round(km/0.35),economia:`${Math.max(5,Math.min(35,Math.round(points.length*2.3)))}%`};setCache(k,res);r.json(res)}catch(e){r.status(500).json({error:e.message})}});
app.get('/api/perfil/:id',(q,r)=>r.json({id:q.params.id,nome:'Alisson',plano:'PRO',entregasHoje:12,ganhoHoje:84.5}));
app.post('/api/track',(q,r)=>r.json({ok:true}));

const html=`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RotaLucro</title><style>body{margin:0;background:#0F172A;color:#fff;font-family:system-ui;display:grid;place-items:center;height:100vh}.c{background:#1E293B;padding:24px;border-radius:20px;width:92%;max-width:400px}.l{font-size:32px;font-weight:800;text-align:center;margin-bottom:18px}.l span{color:#00C853}input{width:100%;padding:14px;margin:6px 0;border:0;border-radius:12px;background:#0F172A;color:#fff}button{width:100%;padding:14px;border:0;border-radius:12px;background:#00C853;font-weight:800;margin-top:8px}.o{background:#0F172A;padding:14px;border-radius:12px;margin:8px 0;border-left:4px solid #00C853}.h{display:none}</style></head><body><div class="c" id="a"><div class="l">Rota<span>Lucro</span></div><input value="entregador@rotalucro.com"><input type="password" value="123456"><button onclick="a.classList.add('h');b.classList.remove('h')">ENTRAR</button></div><div class="c h" id="b"><h3>Como adicionar?</h3><div class="o" onclick="alert('FOTO ok')">📸 FOTO</div><div class="o" onclick="alert('DIGITAR ok')">⌨️ DIGITAR</div><div class="o" onclick="alert('AUDIO ok')">🎤 AUDIO</div><div class="o" onclick="fetch('/api/optimize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({points:[{lat:-23.5,lng:-46.6},{lat:-23.6,lng:-46.7}]})}).then(r=>r.json()).then(j=>alert('Economia '+j.economia))">🧠 OTIMIZAR</div></div></body></html>`;

app.get('/',(q,r)=>r.send(html));
app.listen(process.env.PORT||3000,()=>console.log('ok'));
