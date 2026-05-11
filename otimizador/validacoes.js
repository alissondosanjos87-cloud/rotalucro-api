// otimizador/validacoes.js
var logger = require('../services/logger');

var LIMITES = {
  MAX_PARADAS: 150,
  MIN_PARADAS: 2,
  LAT_MIN: -35,
  LAT_MAX: 5,
  LNG_MIN: -75,
  LNG_MAX: -30
};

function validarParadas(paradas) {
  if (!paradas || !Array.isArray(paradas)) {
    return { valido: false, error: 'Envie um array de paradas' };
  }

  if (paradas.length < LIMITES.MIN_PARADAS) {
    return { valido: false, error: 'Mínimo de ' + LIMITES.MIN_PARADAS + ' paradas. Recebido: ' + paradas.length };
  }

  if (paradas.length > LIMITES.MAX_PARADAS) {
    return { valido: false, error: 'Máximo de ' + LIMITES.MAX_PARADAS + ' paradas. Recebido: ' + paradas.length };
  }

  var invalidas = [];

  for (var i = 0; i < paradas.length; i++) {
    var p = paradas[i];

    if (!p.lat || !p.lng || isNaN(p.lat) || isNaN(p.lng)) {
      invalidas.push({ indice: i, motivo: 'Coordenadas inválidas' });
      continue;
    }

    p.lat = parseFloat(p.lat);
    p.lng = parseFloat(p.lng);

    if (p.lat < LIMITES.LAT_MIN || p.lat > LIMITES.LAT_MAX) {
      invalidas.push({ indice: i, motivo: 'Latitude fora do Brasil', valor: p.lat });
    }

    if (p.lng < LIMITES.LNG_MIN || p.lng > LIMITES.LNG_MAX) {
      invalidas.push({ indice: i, motivo: 'Longitude fora do Brasil', valor: p.lng });
    }

    if (!p.tempoParada) {
      p.tempoParada = p.tipo === 'condominio' ? 10 : p.tipo === 'apto' ? 6 : 3;
    }

    if (!p.tipo) p.tipo = 'casa';
  }

  if (invalidas.length > 0) {
    logger.warn('Paradas inválidas', { total: invalidas.length });
    return { valido: false, error: invalidas.length + ' parada(s) inválida(s)', invalidas: invalidas.slice(0, 5) };
  }

  return { valido: true, paradas: paradas };
}

function validarCoordenada(lat, lng) {
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat < LIMITES.LAT_MIN || lat > LIMITES.LAT_MAX) return false;
  if (lng < LIMITES.LNG_MIN || lng > LIMITES.LNG_MAX) return false;
  if (lat === 0 && lng === 0) return false;
  return true;
}

function getLimites() {
  return LIMITES;
}

module.exports = { validarParadas, validarCoordenada, getLimites };
