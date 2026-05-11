// routes/upload.js
var express = require('express');
var router = express.Router();
var multer = require('multer');
var XLSX = require('xlsx');
var path = require('path');

var { validarParadas } = require('../otimizador/validacoes');
var { otimizarRotaAvancada } = require('../otimizador/index');
var detectarTipo = require('../services/detector');
var agruparProximos = require('../services/cluster');
var logger = require('../services/logger');

var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// ============================================================
// POST /api/upload
// ============================================================
router.post('/', upload.single('file'), async function(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    var fileName = req.file.originalname || '';
    var text = '';

    // Lê arquivo Excel ou CSV
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      var workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      var sheetName = workbook.SheetNames[0];
      text = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
    } else {
      text = req.file.buffer.toString('utf8');
    }

    // Processa planilha
    var paradas = processarPlanilha(text);
    
    logger.info('Planilha processada', {
      arquivo: fileName,
      linhasExtraidas: paradas.length
    });

    if (paradas.length < 2) {
      return res.status(400).json({
        error: 'Poucos endereços válidos. Encontrados: ' + paradas.length,
        dica: 'Verifique as colunas Latitude e Longitude'
      });
    }

    // Valida paradas
    var validacao = validarParadas(paradas);
    if (!validacao.valido) {
      return res.status(400).json({ error: validacao.error });
    }

    // Agrupa paradas próximas (mesmo prédio)
    var agrupadas = agruparProximos(paradas, 0.03); // 30 metros
    var totalOriginal = paradas.length;
    var totalAgrupado = agrupadas.length;

    logger.info('Agrupamento concluído', {
      original: totalOriginal,
      agrupado: totalAgrupado,
      economia: totalOriginal - totalAgrupado
    });

    // Otimiza rota
    var resultado = await otimizarRotaAvancada(agrupadas);

    // Lucro estimado
    var lucroEstimado = totalOriginal * 12.75;

    res.json({
      success: true,
      totalParadas: totalAgrupado,
      totalOriginal: totalOriginal,
      agrupadas: totalOriginal - totalAgrupado,
      totalKm: resultado.metricas.distanciaTotal,
      totalMin: resultado.metricas.tempoEstimado,
      economia: resultado.metricas.economia || 0,
      lucroEstimado: +lucroEstimado.toFixed(2),
      algoritmo: resultado.metricas.algoritmo,
      paradas: resultado.rota.map(function(p, i) {
        return {
          ordem: i + 1,
          nome: p.nome || ('Parada ' + (i + 1)),
          lat: p.lat,
          lng: p.lng,
          bairro: p.bairro || '',
          tipo: p.tipo || 'casa',
          subparadas: p.subparadas || 1
        };
      })
    });

  } catch (err) {
    logger.error('Erro no upload', { message: err.message });
    res.status(500).json({ error: 'Erro ao processar arquivo' });
  }
});

// ============================================================
// PARSER DE PLANILHA
// ============================================================
function processarPlanilha(texto) {
  var linhas = texto.split(/\r?\n/).filter(function(l) { return l.trim(); });
  if (linhas.length < 2) return [];

  var cabecalho = linhas[0]
    .split(',')
    .map(function(h) { return h.trim().replace(/"/g, '').toLowerCase(); });

  // Encontra colunas por nome
  var colEnd = -1, colLat = -1, colLng = -1, colBai = -1;

  for (var i = 0; i < cabecalho.length; i++) {
    var h = cabecalho[i];
    if (colEnd === -1 && /destination|address|endereco|destino|rua|logradouro/i.test(h)) colEnd = i;
    if (colLat === -1 && /latitude|lat\b|^y$/i.test(h)) colLat = i;
    if (colLng === -1 && /longitude|lng|lon|^x$/i.test(h)) colLng = i;
    if (colBai === -1 && /bairro|district/i.test(h)) colBai = i;
  }

  // Fallback: assume colunas I (8) e J (9) para lat/lng
  if (colLat === -1 && cabecalho.length >= 9) colLat = 8;
  if (colLng === -1 && cabecalho.length >= 10) colLng = 9;
  if (colEnd === -1 && cabecalho.length >= 5) colEnd = 4;

  var paradas = [];

  for (var i = 1; i < linhas.length; i++) {
    var colunas = linhas[i].split(',').map(function(c) { return c.trim().replace(/"/g, ''); });
    if (colunas.length < 3) continue;

    var lat = colLat >= 0 ? parseFloat(String(colunas[colLat]).replace(',', '.')) : NaN;
    var lng = colLng >= 0 ? parseFloat(String(colunas[colLng]).replace(',', '.')) : NaN;

    // Valida coordenadas
    if (isNaN(lat) || isNaN(lng)) continue;
    if (lat === 0 && lng === 0) continue;
    if (lat < -35 || lat > 5) continue;   // Fora do Brasil
    if (lng < -75 || lng > -30) continue; // Fora do Brasil

    var endereco = colEnd >= 0 ? colunas[colEnd] : ('Parada ' + i);
    var bairro = colBai >= 0 ? colunas[colBai] : '';

    paradas.push({
      nome: endereco,
      lat: lat,
      lng: lng,
      bairro: bairro,
      tipo: detectarTipo(endereco + ' ' + bairro)
    });
  }

  return paradas;
}

module.exports = router;
