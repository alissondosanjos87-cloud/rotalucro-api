// otimizador/score.js
function calcularScore(opcoes) {
  var distancia = opcoes.distancia || 0;
  var tempoParada = opcoes.tempoParada || 5;
  var hora = opcoes.hora || new Date().getHours();
  var tipo = opcoes.tipo || 'casa';

  // Fator de trânsito por horário
  var fatorTransito = 1;
  if (hora >= 17 && hora <= 19) fatorTransito = 1.4;
  else if (hora >= 6 && hora <= 9) fatorTransito = 1.3;
  else if (hora >= 12 && hora <= 13) fatorTransito = 1.15;

  // Peso por tipo de parada
  var pesoTipo = tipo === 'condominio' ? 1.5 : tipo === 'apto' ? 1.2 : 1.0;

  return distancia * 0.6 + tempoParada * 0.3 * pesoTipo + distancia * fatorTransito * 0.1;
}

module.exports = calcularScore;
