// services/cluster.js
// Agrupa paradas próximas (mesmo prédio, mesma rua)
var { distancia } = require('../otimizador/utils');

/**
 * Agrupa paradas que estão muito próximas
 * Ex: várias entregas no mesmo condomínio viram 1 parada
 * 
 * @param {Array} paradas - Array de paradas
 * @param {number} raioKm - Raio em km para considerar mesma parada (default 0.03 = 30m)
 * @returns {Array} Paradas agrupadas
 */
function agruparProximos(paradas, raioKm) {
  if (!paradas || paradas.length < 2) return paradas || [];

  var raio = raioKm || 0.03; // 30 metros padrão
  var grupos = [];
  var visitados = new Set();

  // Agrupa por proximidade
  for (var i = 0; i < paradas.length; i++) {
    if (visitados.has(i)) continue;

    var grupo = [paradas[i]];
    visitados.add(i);

    for (var j = i + 1; j < paradas.length; j++) {
      if (visitados.has(j)) continue;

      var d = distancia(paradas[i], paradas[j]);
      if (d <= raio) {
        grupo.push(paradas[j]);
        visitados.add(j);
      }
    }

    grupos.push(grupo);
  }

  // Combina cada grupo em uma única parada
  var resultado = grupos.map(function(grupo) {
    // Se só tem 1, retorna ela mesma
    if (grupo.length === 1) {
      var p = grupo[0];
      p.subparadas = 1;
      return p;
    }

    // Calcula média das coordenadas
    var soma_lat = 0, soma_lng = 0;
    grupo.forEach(function(p) {
      soma_lat += p.lat;
      soma_lng += p.lng;
    });

    // Determina o tipo mais restritivo
    var tipos = grupo.map(function(p) { return p.tipo; });
    var tipoFinal = 'casa';
    if (tipos.includes('condominio')) tipoFinal = 'condominio';
    else if (tipos.includes('apto')) tipoFinal = 'apto';

    // Usa o nome da primeira parada como principal
    var nomePrincipal = grupo[0].nome || grupo[0].endereco || 'Parada';

    return {
      nome: nomePrincipal,
      lat: soma_lat / grupo.length,
      lng: soma_lng / grupo.length,
      bairro: grupo[0].bairro || '',
      tipo: tipoFinal,
      subparadas: grupo.length,
      detalhes: grupo.map(function(p) {
        return { nome: p.nome, tipo: p.tipo };
      })
    };
  });

  return resultado;
}

module.exports = agruparProximos;
