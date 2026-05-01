javascript
const { distancia } = require('./utils');

function twoOpt(rota, maxIter = 3) {
  if (!rota || rota.length < 4) return { rota: rota ? [...rota] : [], melhorias: 0 };

  let melhor = [...rota], melhorias = 0, iter = 0;

  while (iter < maxIter) {
    let melhorou = false;
    for (let i = 1; i < melhor.length - 2; i++) {
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
