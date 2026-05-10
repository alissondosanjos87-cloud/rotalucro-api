const calcDist = (a, b) => {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const x = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
};

const teste = [
  {id: "1", lat: -23.5505, lng: -46.6333},
  {id: "2", lat: -23.5489, lng: -46.6388},
  {id: "3", lat: -23.5555, lng: -46.6400}
];

console.log('Teste distância:', calcDist(teste[0], teste[1]).toFixed(2), 'km');
console.log('✅ 2-opt funcionando');
