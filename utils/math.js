// Fórmula Haversine para calcular distância entre dois pontos
const calcularDistancia = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Calcular lucro líquido
const calcularLucroLiquido = (totalPacotes, totalKm, custoPorKm, valorPorEntrega) => {
  const lucrosBruto = totalPacotes * valorPorEntrega;
  const custoCombustivel = totalKm * custoPorKm;
  const lucroLiquido = lucrosBruto - custoCombustivel;
  return {
    lucroBruto: parseFloat(lucrosBruto.toFixed(2)),
    custoCombustivel: parseFloat(custoCombustivel.toFixed(2)),
    lucroLiquido: parseFloat(lucroLiquido.toFixed(2)),
  };
};

// Embaralhamento Fisher-Yates
const embaralhar = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Formatar segundos para HH:MM:SS
const formatarTempo = (segundos) => {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const secs = segundos % 60;
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

module.exports = {
  calcularDistancia,
  calcularLucroLiquido,
  embaralhar,
  formatarTempo,
};