// tests/optimize.test.js
console.log('🧪 Teste de Otimização');
console.log('======================\n');

var nearestNeighbor = require('../otimizador/nearestNeighbor');
var twoOpt = require('../otimizador/twoOpt');
var { calcularDistanciaTotal } = require('../otimizador/utils');

var paradas = [
  { nome: 'P1', lat: -23.5505, lng: -46.6333, tipo: 'casa', tempoParada: 3 },
  { nome: 'P2', lat: -23.5614, lng: -46.6560, tipo: 'apto', tempoParada: 6 },
  { nome: 'P3', lat: -23.5815, lng: -46.6418, tipo: 'casa', tempoParada: 3 },
  { nome: 'P4', lat: -23.5330, lng: -46.6170, tipo: 'condominio', tempoParada: 10 },
  { nome: 'P5', lat: -23.5438, lng: -46.6387, tipo: 'apto', tempoParada: 6 }
];

console.log('📊 Paradas de teste: ' + paradas.length);

// Teste Nearest Neighbor
var rotaNN = nearestNeighbor(paradas, 0);
var distNN = calcularDistanciaTotal(rotaNN);
console.log('✅ Nearest Neighbor: ' + distNN.toFixed(2) + ' km');

// Teste 2-Opt
var resultado2Opt = twoOpt(rotaNN, 3);
var dist2Opt = calcularDistanciaTotal(resultado2Opt.rota);
console.log('✅ 2-Opt: ' + dist2Opt.toFixed(2) + ' km (' + resultado2Opt.melhorias + ' melhorias)');

// Resultado
if (dist2Opt <= distNN) {
  console.log('\n✅ TESTE APROVADO! 2-Opt melhorou ou manteve a rota.');
  process.exit(0);
} else {
  console.log('\n❌ TESTE FALHOU! 2-Opt piorou a rota.');
  process.exit(1);
}
