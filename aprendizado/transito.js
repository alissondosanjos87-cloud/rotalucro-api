// aprendizado/transito.js
// Sistema simples de aprendizado de trânsito

const velocidadesPorHorario = {
  0: 40, 1: 42, 2: 44, 3: 45, 4: 44, 5: 40,
  6: 25, 7: 22, 8: 20, 9: 22, 10: 32, 11: 35,
  12: 28, 13: 30, 14: 36, 15: 38, 16: 35,
  17: 18, 18: 15, 19: 20, 20: 28, 21: 32, 22: 35, 23: 38
};

function getVelocidadePorHorario(hora) {
  return velocidadesPorHorario[hora] || 35;
}

function estimarTempoDeslocamento(a, b, hora) {
  const { distancia } = require('../otimizador/utils');
  const d = distancia(a, b);
  const vel = getVelocidadePorHorario(hora || new Date().getHours());
  return (d / vel) * 60;
}

function getStatusTransito() {
  return { status: 'ativo', horarios: Object.keys(velocidadesPorHorario).length };
}

module.exports = {
  getVelocidadePorHorario,
  estimarTempoDeslocamento,
  getStatusTransito,
};
