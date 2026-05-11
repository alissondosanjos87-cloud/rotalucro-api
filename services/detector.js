// services/detector.js
// Detecta o tipo de parada: casa, apartamento ou condomínio

function detectarTipo(endereco) {
  if (!endereco) return 'casa';

  var texto = endereco.toLowerCase();

  // Padrões de condomínio
  var padroesCondominio = [
    /condominio/i, /condomínio/i, /residencial/i,
    /conjunto residencial/i, /parque residencial/i,
    /cdhu/i, /predio/i, /prédio/i, /portaria/i,
    /bloco\s*\d/i, /torre\s*\d/i
  ];

  // Padrões de apartamento
  var padroesApto = [
    /apto\s*\d/i, /apartamento\s*\d/i, /ap\s*\d/i,
    /andar\s*\d/i, /sala\s*\d/i, /loja\s*\d/i,
    /conj\s*\d/i, /kj\s*\d/i
  ];

  // Padrões de casa
  var padroesCasa = [
    /casa\s*\d/i, /sobrado/i, /viela/i,
    /beco/i, /fundo/i, /fundos/i
  ];

  // Verifica primeiro condomínio
  for (var i = 0; i < padroesCondominio.length; i++) {
    if (padroesCondominio[i].test(texto)) {
      // Se dentro do condomínio tem indicação de apartamento
      for (var j = 0; j < padroesApto.length; j++) {
        if (padroesApto[j].test(texto)) return 'apto';
      }
      return 'condominio';
    }
  }

  // Verifica apartamento
  for (var i = 0; i < padroesApto.length; i++) {
    if (padroesApto[i].test(texto)) return 'apto';
  }

  // Verifica casa
  for (var i = 0; i < padroesCasa.length; i++) {
    if (padroesCasa[i].test(texto)) return 'casa';
  }

  // Se tem número mas nenhum padrão específico
  if (/\d+/.test(texto)) return 'casa';

  return 'casa';
}

// Para identificar visualmente
function getIcone(tipo) {
  var icones = {
    'casa': '🏠',
    'apto': '🏢',
    'condominio': '🏘️'
  };
  return icones[tipo] || '📍';
}

// Para cálculos de tempo
function getTempoMedio(tipo) {
  var tempos = {
    'casa': 3,
    'apto': 6,
    'condominio': 10
  };
  return tempos[tipo] || 5;
}

module.exports = detectarTipo;
module.exports.getIcone = getIcone;
module.exports.getTempoMedio = getTempoMedio;
