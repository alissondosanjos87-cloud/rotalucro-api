// routes/upload.js
var express = require('express');
var router = express.Router();
var multer = require('multer');
var XLSX = require('xlsx');
var { validarParadas } = require('../otimizador/validacoes');
var { otimizarRotaAvancada } = require('../otimizador/index');
var detectarTipo = require('../services/detector');
var agruparProximos = require('../services/cluster');
var logger = require('../services/logger');

var upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/', upload.single('file'), async function(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

    var fileName = req.file.originalname || '';
    var text = '';

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      var workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      text = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
    } else {
      text = req.file.buffer.toString('utf8');
    }

    var paradas = processarPlanilha(text);
    if (paradas.length < 2) return res.status(400).json({ error: 'Poucos endereços válidos. Encontrados: ' + paradas.length });

    var validacao = validarParadas(paradas);
    if (!validacao.valido) return res.status(400).json({ error: validacao.error });

    var raioMetros = Math.min(parseFloat(req.query.raio) || 30, 500);
    var agrupadas = agruparProximos(paradas, raioMetros / 1000);
    var resultado = await otimizarRotaAvancada(agrupadas);

    res.json({
      success: true,
      totalParadas: agrupadas.length,
      totalOriginal: paradas.length,
      agrupadas: paradas.length - agrupadas.length,
      totalKm: resultado.metricas.distanciaTotal,
      totalMin: resultado.metricas.tempoEstimado,
      lucroEstimado: +(paradas.length * 12.75).toFixed(2),
      paradas: resultado.rota.map(function(p, i) {
        return { ordem: i+1, nome: p.nome||('Parada '+(i+1)), lat: p.lat, lng: p.lng, bairro: p.bairro||'', tipo: p.tipo||'casa', subparadas: p.subparadas||1 };
      })
    });
  } catch (err) {
    logger.error('Erro no upload', { message: err.message });
    res.status(500).json({ error: 'Erro ao processar arquivo' });
  }
});

function processarPlanilha(texto) {
  var linhas = texto.split(/\r?\n/).filter(function(l){ return l.trim(); });
  if (linhas.length < 2) return [];
  var cab = linhas[0].split(',').map(function(h){ return h.trim().replace(/"/g,'').toLowerCase(); });
  var colEnd=-1, colLat=-1, colLng=-1, colBai=-1;
  for (var i=0; i<cab.length; i++) {
    var h = cab[i];
    if (colEnd===-1 && /destination|address|endereco|destino|rua|logradouro/i.test(h)) colEnd=i;
    if (colLat===-1 && /latitude|lat\b|^y$/i.test(h)) colLat=i;
    if (colLng===-1 && /longitude|lng|lon|^x$/i.test(h)) colLng=i;
    if (colBai===-1 && /bairro|district/i.test(h)) colBai=i;
  }
  if (colLat===-1 && cab.length>=9) colLat=8;
  if (colLng===-1 && cab.length>=10) colLng=9;
  if (colEnd===-1 && cab.length>=5) colEnd=4;
  var paradas = [];
  for (var i=1; i<linhas.length; i++) {
    var col = linhas[i].split(',').map(function(c){ return c.trim().replace(/"/g,''); });
    if (col.length < 3) continue;
    var lat = colLat>=0 ? parseFloat(String(col[colLat]).replace(',','.')) : NaN;
    var lng = colLng>=0 ? parseFloat(String(col[colLng]).replace(',','.')) : NaN;
    if (isNaN(lat)||isNaN(lng)||lat===0&&lng===0) continue;
    var end = colEnd>=0 ? col[colEnd] : ('Parada '+i);
    var bairro = colBai>=0 ? col[colBai] : '';
    paradas.push({ nome: end, lat, lng, bairro, tipo: detectarTipo(end+' '+bairro) });
  }
  return paradas;
}

module.exports = router;
