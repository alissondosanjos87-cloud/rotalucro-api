function calcularScore({ distancia, tempoParada = 5, hora = 12, tipo = 'casa' }) {
  let fator = 1;

  if (hora >= 17 && hora <= 19) fator = 1.4;
  else if (hora >= 6 && hora <= 9) fator = 1.2;

  const pesoTipo =
    tipo === 'condominio'
      ? 1.5
      : tipo === 'apto'
      ? 1.2
      : 1;

  return (
    distancia * 0.65 +
    tempoParada * 0.25 * pesoTipo +
    distancia * fator * 0.1
  );
}

module.exports = calcularScore;
