// services/cluster.js
var { distancia } = require('../otimizador/utils');

function agruparProximos(paradas, raioKm) {
  if (!paradas || paradas.length < 2) return paradas || [];

  var raio = raioKm || 0.03;
  var grupos = [];
  var visitados = new Set();

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

  var resultado = grupos.map(function(grupo) {
    if (grupo.length === 1) {
      grupo[0].subparadas = 1;
      return grupo[0];
    }

    var soma_lat = 0, soma_lng = 0;
    grupo.forEach(function(p) { soma_lat += p.lat; soma_lng += p.lng; });

    var tipos = grupo.map(function(p) { return p.tipo; });
    var tipoFinal = 'casa';
    if (tipos.includes('condominio')) tipoFinal = 'condominio';
    else if (tipos.includes('apto')) tipoFinal = 'apto';

    return {
      nome: grupo[0].nome || 'Parada',
      lat: soma_lat / grupo.length,
      lng: soma_lng / grupo.length,
      bairro: grupo[0].bairro || '',
      tipo: tipoFinal,
      subparadas: grupo.length
    };
  });

  return resultado;
}

module.exports = agruparProximos;
