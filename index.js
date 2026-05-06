const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Cache simples
const cache = new Map();
const getCache = (k) => {
  const v = cache.get(k);
  if (!v) return null;
  if (Date.now() > v.exp) { cache.delete(k); return null; }
  return v.data;
};
const setCache = (k, d, ttl = 300) => cache.set(k, { data: d, exp: Date.now() + ttl * 1000 });

// Haversine
const toRad = d => d * Math.PI / 180;
const haversine = (a, b) => {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// 2-opt
const twoOpt = (points) => {
  let route = [...points];
  let improved = true;
  const dist = (p1, p2) => haversine(p1, p2);
  while (improved) {
    improved = false;
    for (let i = 1; i < route.length - 2; i++) {
      for (let j = i + 1; j < route.length - 1; j++) {
        const a = route[i-1], b = route[i], c = route[j], d = route[j+1];
        if (dist(a,b) + dist(c,d) > dist(a,c) + dist(b,d)) {
          route.splice(i, j-i+1,...route.slice(i, j+1).reverse());
          improved = true;
        }
      }
    }
  }
  return route;
};

// ROTAS API
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString(), version: '2.1' });
});

app.post('/api/lucro', (req, res) => {
  const { valorEntrega = 7, km = 0, tempoMin = 0, custoKm = 0.75, custoHora = 18 } = req.body || {};
  const custo = km * custoKm + (tempoMin / 60) * custoHora;
  const lucro = valorEntrega - custo;
  const margem = valorEntrega? (lucro / valorEntrega * 100) : 0;
  res.json({
    valorEntrega, km, tempoMin,
    custo: +custo.toFixed(2),
    lucro: +lucro.toFixed(2),
    margem: +margem.toFixed(1)
  });
});

app.post('/api/optimize', (req, res) => {
  try {
    const { points = [], start } = req.body || {};
    if (points.length < 2) return res.status(400).json({ error: 'Min 2 pontos' });
    const key = JSON.stringify({ points, start });
    const cached = getCache(key);
    if (cached) return res.json({...cached, cached: true });
    const startPoint = start || points[0];
    const rest = points.filter(p => p!== startPoint);
    const optimized = [startPoint,...twoOpt([startPoint,...rest]).slice(1)];
    let totalKm = 0;
    for (let i = 0; i < optimized.length - 1; i++) totalKm += haversine(optimized[i], optimized[i+1]);
    const result = {
      order: optimized,
      totalKm: +totalKm.toFixed(2),
      totalMin: Math.round(totalKm / 0.35),
      economia: `${Math.max(5, Math.min(35, Math.round(points.length * 2.3)))}%`
    };
    setCache(key, result);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/perfil/:id', (req, res) => {
  res.json({ id: req.params.id, nome: 'Alisson', plano: 'PRO', entregasHoje: 12, ganhoHoje: 84.5 });
});

app.post('/api/track', (req, res) => {
  console.log('TRACK', req.body);
  res.json({ ok: true });
});

// FRONTEND
const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>RotaLucro</title>
<style>
body{margin:0;background:#0F172A;color:#fff;font-family:system-ui;display:grid;place-items:center;min-height:100vh}
.c{background:#1E293B;padding:24px;border-radius:20px;width:92%;max-width:400px}
.l{font-size:32px;font-weight:800;text-align:center;margin-bottom:18px}
.l span{color:#00C853}
input{width:100%;padding:14px;margin:6px 0;border:0;border-radius:12px;background:#0F172A;color:#fff;box-sizing:border-box}
button{width:100%;padding:14px;border:0;border-radius:12px;background:#00C853;font-weight:800;margin-top:8px;color:#000}
.o{background:#0F172A;padding:16px;border-radius:12px;margin:10px 0;border-left:4px solid #00C853;cursor:pointer}
.h{display:none}
</style>
</head>
<body>
<div class="c" id="a">
  <div class="l">Rota<span>Lucro</span></div>
  <input value="entregador@rotalucro.com">
  <input type="password" value="123456">
  <button onclick="a.classList.add('h');b.classList.remove('h')">ENTRAR</button>
</div>
<div class="c h" id="b">
  <h3>Como adicionar?</h3>
  <div class="o" onclick="alert('FOTO: tira foto da lista')">📸 FOTO</div>
  <div class="o" onclick="alert('DIGITAR: digite endereços')">⌨️ DIGITAR</div>
  <div class="o" onclick="alert('AUDIO: grave os endereços')">🎤 AUDIO</div>
  <div class="o" onclick="importar()">📁 IMPORTAR ROTAS</div>
  <p id="s" style="opacity:.8;margin-top:12px"></p>
</div>
<script>
async function importar(){
  s.textContent = 'Importando e otimizando...';
  const r = await fetch('/api/optimize', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      points: [
        {lat:-23.55,lng:-46.63,nome:'Cliente 1'},
        {lat:-23.56,lng:-46.65,nome:'Cliente 2'},
        {lat:-23.54,lng:-46.62,nome:'Cliente 3'}
      ]
    })
  });
  const j = await r.json();
  s.textContent = '✅ ' + j.order.length + ' paradas - ' + j.totalKm + 'km - Economia ' + j.economia;
}
</script>
</body>
</html>`;

app.get('/', (req, res) => res.send(html));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('RotaLucro v2.1 on ' + port));
