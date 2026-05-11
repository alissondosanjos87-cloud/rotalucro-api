// aprendizado/transito.js
// Aprendizado de trânsito por horário e bairro

var velocidadesPorHorario = {
  0: 40, 1: 42, 2: 44, 3: 45, 4: 44, 5: 40,
  6: 25, 7: 22, 8: 20, 9: 22, 10: 32, 11: 35,
  12: 28, 13: 30, 14: 36, 15: 38, 16: 35,
  17: 18, 18: 15, 19: 20, 20: 28, 21: 32, 22: 35, 23: 38
};

var transitoPorBairro = {};

function getVelocidadePorHorario(hora) {
  return velocidadesPorHorario[hora] || 35;
}

function registrarTempoTrecho(bairro, hora, tempoMin, distanciaKm) {
  if (!bairro || tempoMin <= 0 || distanciaKm <= 0) return;

  var chave = bairro + '_' + hora;
  if (!transitoPorBairro[chave]) {
    transitoPorBairro[chave] = { velocidades: [], media: 35, amostras: 0 };
  }

  var velocidadeReal = (distanciaKm / tempoMin) * 60;
  if (velocidadeReal < 5 || velocidadeReal > 100) return;

  var dados = transitoPorBairro[chave];
  dados.velocidades.push(velocidadeReal);
  if (dados.velocidades.length > 20) dados.velocidades.shift();

  var soma = 0;
  dados.velocidades.forEach(function(v) { soma += v; });
  dados.media = soma / dados.velocidades.length;
  dados.amostras = dados.velocidades.length;
}

function getVelocidadeBairro(bairro, hora) {
  var chave = bairro + '_' + hora;
  if (transitoPorBairro[chave] && transitoPorBairro[chave].amostras >= 3) {
    return transitoPorBairro[chave].media;
  }
  return getVelocidadePorHorario(hora);
}

function estimarTempoDeslocamento(a, b, hora) {
  var { distancia } = require('../otimizador/utils');
  var d = distancia(a, b);
  var vel = getVelocidadeBairro(b.bairro || a.bairro, hora || new Date().getHours());
  return (d / vel) * 60;
}

function getStatusTransito() {
  return {
    bairrosMapeados: Object.keys(transitoPorBairro).length,
    amostrasTotal: Object.values(transitoPorBairro).reduce(function(s, d) { return s + d.amostras; }, 0)
  };
}

module.exports = {
  getVelocidadePorHorario,
  getVelocidadeBairro,
  registrarTempoTrecho,
  estimarTempoDeslocamento,
  getStatusTransito
};
