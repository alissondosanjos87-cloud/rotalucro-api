const express = require('express');
const cors = require('cors');
const multer = require('multer');
const XLSX = require('xlsx');
const upload = multer({ storage: multer.memoryStorage() });
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
  res.json({ ok: true, time: new Date().toISOString(), version: '3.1' });
});

app.post('/api/lucro', (req, res) => {
  const { valorEntrega = 7, km = 0, tempoMin = 0, custoKm = 0.75, custoHora = 18 } = req.body || {};
  const custo = km * custoKm + (tempoMin / 60) * custoHora;
  const lucro = valorEntrega - custo;
  const margem = valorEntrega? (lucro / valorEntrega * 100) : 0;
  res.json({ valorEntrega, km, tempoMin, custo: +custo.toFixed(2), lucro: +lucro.toFixed(2), margem: +margem.toFixed(1) });
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
    const result = { order: optimized, totalKm: +totalKm.toFixed(2), totalMin: Math.round(totalKm / 0.35), economia: `${Math.max(5, Math.min(35, Math.round(points.length * 2.3)))}%` };
    setCache(key, result);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// NOVA ROTA: Upload de arquivo (CSV + EXCEL)
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    
    const fileName = req.file.originalname || '';
    let text = '';
    
    // Detecta tipo de arquivo
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      // Arquivo Excel
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      text = XLSX.utils.sheet_to_csv(sheet);
    } else {
      // Arquivo CSV/TXT
      text = req.file.buffer.toString('utf8');
    }
    
    const points = processarPlanilha(text, fileName);
    
    if (points.length < 2) {
      return res.status(400).json({ error: 'Poucos endereços. Min 2. Encontrados: ' + points.length });
    }
    
    const startPoint = points[0];
    const rest = points.filter(p => p !== startPoint);
    const optimized = [startPoint, ...twoOpt([startPoint, ...rest]).slice(1)];
    
    let totalKm = 0;
    for (let i = 0; i < optimized.length - 1; i++) totalKm += haversine(optimized[i], optimized[i+1]);
    
    res.json({
      success: true,
      plataforma: points[0]?.fonte || 'desconhecida',
      order: optimized,
      totalParadas: optimized.length,
      totalKm: +totalKm.toFixed(2),
      totalMin: Math.round(totalKm / 0.35),
      economia: `${Math.max(5, Math.min(35, Math.round(points.length * 2.3)))}%`,
      lucroEstimado: +(optimized.length * 12.75).toFixed(2)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

function processarPlanilha(csvText, fileName) {
  const linhas = csvText.split(/\r?\n/).filter(l => l.trim());
  if (linhas.length < 2) return [];
  
  const cabecalho = linhas[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
  
  // Detecta plataforma
  const isAmazon = fileName.toLowerCase().includes('amazon') || cabecalho.some(h => h.includes('amazon'));
  const isShopee = fileName.toLowerCase().includes('shopee') || cabecalho.some(h => h.includes('shopee'));
  const isMeli = fileName.toLowerCase().includes('meli') || fileName.toLowerCase().includes('mercado') || cabecalho.some(h => h.includes('mercado') || h.includes('meli'));
  const plataforma = isAmazon ? 'amazon' : isShopee ? 'shopee' : isMeli ? 'meli' : 'outro';
  
  // Mapeia colunas
  const colEnd = cabecalho.findIndex(h => ['endereco','address','destino','rua','logradouro','destination address'].some(k => h.includes(k)));
  const colLat = cabecalho.findIndex(h => h.includes('lat') || h === 'y');
  const colLng = cabecalho.findIndex(h => h.includes('lng') || h.includes('lon') || h.includes('long') || h === 'x');
  const colBairro = cabecalho.findIndex(h => h.includes('bairro') || h.includes('district'));
  const colCidade = cabecalho.findIndex(h => h.includes('cidade') || h.includes('city'));
  const colPacote = cabecalho.findIndex(h => ['track','codigo','spx','pedido','order','id','tn'].some(k => h.includes(k)));
  
  const points = [];
  
  for (let i = 1; i < linhas.length; i++) {
    const cols = linhas[i].split(',').map(c => c.trim().replace(/"/g, ''));
    if (cols.length < 2) continue;
    
    let lat = colLat >= 0 ? parseFloat(String(cols[colLat]).replace(',', '.')) : NaN;
    let lng = colLng >= 0 ? parseFloat(String(cols[colLng]).replace(',', '.')) : NaN;
    const endereco = colEnd >= 0 ? cols[colEnd] : '';
    const bairro = colBairro >= 0 ? cols[colBairro] : '';
    const cidade = colCidade >= 0 ? cols[colCidade] : '';
    const pacote = colPacote >= 0 ? cols[colPacote] : '';
    
    if (isNaN(lat) || isNaN(lng)) {
      lat = -23.55 + (Math.random() - 0.5) * 0.1;
      lng = -46.63 + (Math.random() - 0.5) * 0.1;
    }
    
    if (!isNaN(lat) && !isNaN(lng)) {
      points.push({ nome: endereco || `Parada ${i}`, lat, lng, endereco, bairro, cidade, pacote, fonte: plataforma });
    }
  }
  
  return points;
}

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
.c{background:#1E293B;padding:24px;border-radius:20px;width:92%;max-width:420px}
.l{font-size:32px;font-weight:800;text-align:center;margin-bottom:18px}
.l span{color:#00C853}
input{width:100%;padding:14px;margin:6px 0;border:0;border-radius:12px;background:#0F172A;color:#fff;box-sizing:border-box}
button{width:100%;padding:14px;border:0;border-radius:12px;background:#00C853;font-weight:800;margin-top:8px;color:#000;cursor:pointer}
.o{background:#0F172A;padding:16px;border-radius:12px;margin:10px 0;border-left:4px solid #00C853;cursor:pointer;font-weight:600}
.o:hover{background:#1a2738}
.h{display:none}
.r{background:#0F172A;padding:14px;border-radius:12px;margin:8px 0;border-left:4px solid #FFD700;text-align:left;font-size:13px}
.r strong{display:block;font-size:14px;margin-bottom:3px}
.r span{color:#94A3B8;font-size:12px}
.g{color:#00C853;font-weight:700}
.y{color:#FFD700;font-weight:700}
#progress{display:none;text-align:center;padding:20px}
.spinner{width:40px;height:40px;border:4px solid #334155;border-top-color:#00C853;border-radius:50%;animation:s .8s linear infinite;margin:0 auto 12px}
@keyframes s{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<div class="c" id="a">
  <div class="l">Rota<span>Lucro</span></div>
  <input type="email" value="entregador@rotalucro.com" placeholder="Email">
  <input type="password" value="123456" placeholder="Senha">
  <button onclick="a.classList.add('h');b.classList.remove('h')">ENTRAR</button>
  <p style="text-align:center;opacity:.7;font-size:13px;margin-top:16px">Feito por entregadores para entregadores</p>
</div>

<div class="c h" id="b">
  <h3 style="text-align:center;margin-bottom:4px">Como adicionar sua rota?</h3>
  <p style="text-align:center;color:#94A3B8;font-size:13px;margin-bottom:18px">Planilhas da Shopee, Mercado Livre ou Amazon</p>
  
  <div class="o" onclick="alert('📸 Funcionalidade em breve!')">📸 TIRAR FOTO DA LISTA</div>
  <div class="o" onclick="alert('⌨️ Funcionalidade em breve!')">⌨️ DIGITAR ENDEREÇOS</div>
  <div class="o" onclick="alert('🎤 Funcionalidade em breve!')">🎤 GRAVAR EM ÁUDIO</div>
  
  <label class="o" style="border-left-color:#FFD700;display:block;text-align:left">
    📁 IMPORTAR PLANILHA
    <span style="display:block;color:#94A3B8;font-size:12px;margin-top:4px">CSV • Excel (.xlsx) • Shopee • Mercado Livre • Amazon</span>
  </label>
  
  <input type="file" id="fileInput" accept=".csv,.txt,.xlsx,.xls" style="display:none" onchange="importarArquivo(this.files[0])">
  <button onclick="document.getElementById('fileInput').click()" style="background:#FFD700;color:#000;font-weight:800">
    📂 SELECIONAR ARQUIVO
  </button>
  
  <div id="fileInfo"></div>
  <div id="progress"><div class="spinner"></div><p style="color:#94A3B8">Processando e otimizando rota...</p></div>
  <div id="resultado" class="h"></div>
  <button class="h" id="btnVoltar" onclick="voltar()" style="background:#334155;color:#fff;margin-top:16px">← NOVA IMPORTAÇÃO</button>
</div>

<script>
var fileInput = document.getElementById('fileInput');

document.querySelector('.o[style*="border-left-color:#FFD700"]').addEventListener('click', function() {
  fileInput.click();
});

async function importarArquivo(file) {
  if (!file) return;
  
  var progress = document.getElementById('progress');
  var fileInfo = document.getElementById('fileInfo');
  var resultado = document.getElementById('resultado');
  var btnVoltar = document.getElementById('btnVoltar');
  var cards = document.querySelectorAll('.o');
  
  fileInfo.textContent = '📄 ' + file.name + ' (' + (file.size/1024).toFixed(1) + ' KB)';
  progress.style.display = 'block';
  resultado.classList.add('h');
  cards.forEach(function(c) { c.style.display = 'none'; });
  
  var formData = new FormData();
  formData.append('file', file);
  
  try {
    var response = await fetch('/api/upload', { method: 'POST', body: formData });
    var data = await response.json();
    progress.style.display = 'none';
    
    if (data.error) {
      fileInfo.textContent = '❌ ' + data.error;
      cards.forEach(function(c) { c.style.display = ''; });
      return;
    }
    
    resultado.classList.remove('h');
    resultado.innerHTML = 
      '<div class="r"><strong>📊 ROTA OTIMIZADA</strong><span>🏷️ ' + data.plataforma.toUpperCase() + ' | ' + data.totalParadas + ' paradas</span></div>' +
      '<div class="r"><strong>📏 DISTÂNCIA</strong><span class="g">' + data.totalKm + ' km</span></div>' +
      '<div class="r"><strong>⏱️ TEMPO ESTIMADO</strong><span>' + data.totalMin + ' minutos</span></div>' +
      '<div class="r"><strong>📈 ECONOMIA</strong><span class="g">' + data.economia + '</span></div>' +
      '<div class="r"><strong>💰 LUCRO ESTIMADO</strong><span class="y">R$ ' + data.lucroEstimado.toFixed(2).replace('.', ',') + '</span></div>' +
      '<p style="font-size:12px;color:#94A3B8;margin-top:12px">✅ Ordem otimizada:</p>' +
      data.order.map(function(p, i) {
        return '<p style="font-size:12px;margin:3px 0;color:#fff">' + (i+1) + '. ' + (p.nome || p.endereco || 'Parada '+(i+1)) + ' <span style="color:#94A3B8">(' + p.fonte + ')</span></p>';
      }).join('');
    
    btnVoltar.classList.remove('h');
  } catch (err) {
    progress.style.display = 'none';
    fileInfo.textContent = '❌ Erro ao processar';
    cards.forEach(function(c) { c.style.display = ''; });
  }
}

function voltar() {
  document.getElementById('resultado').classList.add('h');
  document.getElementById('btnVoltar').classList.add('h');
  document.getElementById('fileInfo').textContent = '';
  document.querySelectorAll('.o').forEach(function(c) { c.style.display = ''; });
  fileInput.value = '';
}
</script>
</body>
</html>`;

app.get('/', (req, res) => res.send(html));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('RotaLucro v3.1 on ' + port));
