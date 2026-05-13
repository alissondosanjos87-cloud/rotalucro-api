// otimizador/score.js
function calcularScore({ distancia, tempoParada = 5, hora = 12, tipo = 'casa', bairro = '', bairroAtual = '' }) {
  let fator = 1;

  if (hora >= 17 && hora <= 19) fator = 1.4;
  else if (hora >= 6 && hora <= 9) fator = 1.2;

  const pesoTipo =
    tipo === 'condominio' ? 1.5 :
    tipo === 'apto' ? 1.2 : 1;

  const bonusBairro = (bairro && bairroAtual && bairro === bairroAtual) ? 0.8 : 1;

  return (
    distancia * 0.65 * bonusBairro +
    tempoParada * 0.25 * pesoTipo +
    distancia * fator * 0.1
  );
}

module.exports = calcularScore;
