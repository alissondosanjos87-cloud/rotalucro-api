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

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ============================================================
// UTILITÁRIOS
// ============================================================
function toRad(d){ return d * Math.PI / 180; }

function haversine(a, b) {
  var R = 6371;
  var dLat = toRad(b.lat - a.lat);
  var dLng = toRad(b.lng - a.lng);
  var h = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)*Math.sin(dLng/2);
  return R * 2 * Math.asin(Math.sqrt(h));
}

function twoOpt(p) {
  var r = p.slice(), imp = true, iter = 0;
  while (imp && iter < 500) {
    imp = false; iter++;
    for (var i = 1; i < r.length - 2; i++) {
      for (var j = i + 1; j < r.length - 1; j++) {
        if (haversine(r[i-1],r[i]) + haversine(r[j],r[j+1]) > haversine(r[i-1],r[j]) + haversine(r[i],r[j+1])) {
          var t = r.slice(i, j+1).reverse();
          r = r.slice(0, i).concat(t, r.slice(j+1));
          imp = true;
        }
      }
    }
  }
  return r;
}

function detectarTipo(endereco) {
  if (!endereco) return 'casa';
  var e = endereco.toLowerCase();
  // Condomínio
  if (/condominio|condomínio|residencial|bloco\s*\d|torre\s*\d|conjunto|parque|cdhu|predio|prédio|portaria|ap\s*\d|apto\s*\d|apartamento\s*\d/i.test(e)) {
    if (/ap\s*\d|apto\s*\d|apartamento|bloco\s*\d|torre\s*\d/i.test(e)) return 'apto';
    return 'condominio';
  }
  // Apartamento
  if (/apto|apartamento|ap\s*\d|andar|sala\s*\d|loja\s*\d|conj\s*\d/i.test(e)) return 'apto';
  // Casa
  if (/casa|sobrado|viela|beco|fundo/i.test(e)) return 'casa';
  return 'casa';
}

function agruparProximos(paradas, raioKm) {
  if (paradas.length < 2) return paradas;
  var grupos = [];
  var visitados = new Set();
  
  for (var i = 0; i < paradas.length; i++) {
    if (visitados.has(i)) continue;
    var grupo = [paradas[i]];
    visitados.add(i);
    
    for (var j = i + 1; j < paradas.length; j++) {
      if (visitados.has(j)) continue;
      var d = haversine(paradas[i], paradas[j]);
      if (d <= raioKm) {
        grupo.push(paradas[j]);
        visitados.add(j);
      }
    }
    grupos.push(grupo);
  }
  
  // Para cada grupo, cria uma parada combinada
  return grupos.map(function(g) {
    if (g.length === 1) return g[0];
    // Média das coordenadas
    var lat = 0, lng = 0;
    g.forEach(function(p) { lat += p.lat; lng += p.lng; });
    lat /= g.length; lng /= g.length;
    
    // Junta informações
    var nomes = g.map(function(p) { return p.nome; });
    var tipos = g.map(function(p) { return p.tipo; });
    var tipoFinal = tipos.includes('condominio') ? 'condominio' : tipos.includes('apto') ? 'apto' : 'casa';
    
    return {
      nome: nomes[0],
      lat: lat,
      lng: lng,
      bairro: g[0].bairro || '',
      tipo: tipoFinal,
      subparadas: g.length,
      subdetalhes: nomes
    };
  });
}

// ============================================================
// API
// ============================================================
app.post('/api/upload', upload.single('file'), function(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo' });
    
    var fn = req.file.originalname || '', txt = '';
    if (fn.endsWith('.xlsx') || fn.endsWith('.xls')) {
      var wb = XLSX.read(req.file.buffer, { type: 'buffer' });
      txt = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
    } else {
      txt = req.file.buffer.toString('utf8');
    }
    
    var pts = processarPlanilha(txt);
    console.log('Paradas extraídas: ' + pts.length);
    
    if (pts.length < 2) return res.status(400).json({ error: 'Poucos endereços válidos. Encontrados: ' + pts.length + '. Verifique as colunas Latitude/Longitude.' });
    
    // Agrupa paradas muito próximas (mesmo prédio/condomínio)
    var ptsAgrupados = agruparProximos(pts, 0.03); // 30 metros
    console.log('Paradas após agrupamento: ' + ptsAgrupados.length);
    
    // Otimiza rota
    var opt = twoOpt(ptsAgrupados);
    
    // Calcula distância REAL
    var km = 0;
    for (var i = 0; i < opt.length - 1; i++) {
      km += haversine(opt[i], opt[i + 1]);
    }
    
    // Estatísticas
    var totalOriginal = pts.length;
    var totalAgrupado = ptsAgrupados.length;
    var economia = totalOriginal > 0 ? Math.round((1 - totalAgrupado / totalOriginal) * 100) : 0;
    
    // Lucro estimado (R$ 12,75 por parada original)
    var lucroEstimado = totalOriginal * 12.75;
    
    var resultado = {
      success: true,
      totalParadas: totalAgrupado,
      totalOriginal: totalOriginal,
      agrupadas: totalOriginal - totalAgrupado,
      totalKm: +km.toFixed(2),
      totalMin: Math.round(km / 0.35), // ~21 km/h em cidade
      economia: economia,
      lucroEstimado: +lucroEstimado.toFixed(2),
      paradas: opt.map(function(p, i) {
        return {
          ordem: i + 1,
          nome: p.nome || ('Parada ' + (i + 1)),
          lat: p.lat,
          lng: p.lng,
          bairro: p.bairro || '',
          tipo: p.tipo || 'casa',
          subparadas: p.subparadas || 1,
          subdetalhes: p.subdetalhes || []
        };
      })
    };
    
    res.json(resultado);
  } catch(e) {
    console.error('Erro:', e);
    res.status(500).json({ error: e.message || 'Erro interno' });
  }
});

function processarPlanilha(txt) {
  var linhas = txt.split(/\r?\n/).filter(function(l) { return l.trim(); });
  if (linhas.length < 2) return [];
  
  var cab = linhas[0].split(',').map(function(h) { return h.trim().replace(/"/g, '').toLowerCase(); });
  
  // Encontra colunas
  var cEnd = cab.findIndex(function(h) { 
    return h.includes('destination') || h.includes('address') || h.includes('endereco') || 
           h.includes('destino') || h.includes('rua') || h.includes('logradouro'); 
  });
  var cLat = cab.findIndex(function(h) { return h.includes('latitude') || h === 'lat' || h === 'y'; });
  var cLng = cab.findIndex(function(h) { return h.includes('longitude') || h === 'lng' || h === 'lon' || h === 'x'; });
  var cBai = cab.findIndex(function(h) { return h.includes('bairro') || h.includes('district'); });
  var cCid = cab.findIndex(function(h) { return h.includes('city') || h.includes('cidade'); });
  
  console.log('Colunas encontradas: End=' + cEnd + ' Lat=' + cLat + ' Lng=' + cLng + ' Bairro=' + cBai);
  
  var pts = [];
  for (var i = 1; i < linhas.length; i++) {
    // Parse CSV respeitando aspas
    var cols = [];
    var current = '', inQuotes = false;
    for (var j = 0; j < linhas[i].length; j++) {
      var ch = linhas[i][j];
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { cols.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    cols.push(current.trim());
    
    if (cols.length < 3) continue;
    
    var lat = cLat >= 0 ? parseFloat(String(cols[cLat]).replace(',', '.')) : NaN;
    var lng = cLng >= 0 ? parseFloat(String(cols[cLng]).replace(',', '.')) : NaN;
    
    // Valida coordenadas (Brasil)
    if (isNaN(lat) || isNaN(lng)) continue;
    if (lat < -35 || lat > 5 || lng < -75 || lng < -30) continue; // Fora do Brasil
    
    var end = cEnd >= 0 ? cols[cEnd] : ('Parada ' + (i + 1));
    var bairro = cBai >= 0 ? cols[cBai] : '';
    var cidade = cCid >= 0 ? cols[cCid] : '';
    
    pts.push({
      nome: end,
      lat: lat,
      lng: lng,
      bairro: bairro,
      cidade: cidade,
      tipo: detectarTipo(end + ' ' + bairro)
    });
  }
  
  return pts;
}

app.get('/api/health', function(req, res) {
  res.json({ ok: true, version: '4.1' });
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('RotaLucro Pro v4.1 on ' + port);
});
