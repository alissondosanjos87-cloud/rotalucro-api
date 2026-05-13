// otimizador/twoOpt.js
const { distancia } = require('./utils');

function twoOpt(rota, maxIter = 3, timeLimitMs = 3000) {
  if (!rota || rota.length < 4) return { rota: rota ? [...rota] : [], melhorias: 0 };

  let melhor = [...rota], melhorias = 0, iter = 0;
  const inicio = Date.now();
  const iterLimit = rota.length > 80 ? 1 : rota.length > 40 ? 2 : maxIter;

  while (iter < iterLimit) {
    if (Date.now() - inicio > timeLimitMs) break;
    let melhorou = false;
    for (let i = 1; i < melhor.length - 2; i++) {
      if (Date.now() - inicio > timeLimitMs) { melhorou = false; break; }
      for (let j = i + 1; j < melhor.length - 1; j++) {
        const antes = distancia(melhor[i-1], melhor[i]) + distancia(melhor[j], melhor[j+1]);
        const depois = distancia(melhor[i-1], melhor[j]) + distancia(melhor[i], melhor[j+1]);
        if (depois - antes < -0.0001) {
          melhor = [...melhor.slice(0,i), ...melhor.slice(i,j+1).reverse(), ...melhor.slice(j+1)];
          melhorias++; melhorou = true;
        }
      }
    }
    if (!melhorou) break;
    iter++;
  }
  return { rota: melhor, melhorias, iteracoes: iter };
}

module.exports = twoOpt;
