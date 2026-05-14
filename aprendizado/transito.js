// aprendizado/transito.js
const velocidades = {
  0:40,1:42,2:44,3:45,4:44,5:40,
  6:25,7:22,8:20,9:22,10:32,11:35,
  12:28,13:30,14:36,15:38,16:35,
  17:18,18:15,19:20,20:28,21:32,22:35,23:38
};

function getVelocidade(hora) {
  return velocidades[hora] || 35;
}

function estimarMinutos(distKm, hora) {
  const vel = getVelocidade(hora != null ? hora : new Date().getHours());
  return (distKm / vel) * 60;
}

function getNivelTransito(hora) {
  const vel = getVelocidade(hora != null ? hora : new Date().getHours());
  if (vel <= 18) return { nivel: 'pesado', emoji: '🔴', cor: '#ef4444' };
  if (vel <= 28) return { nivel: 'moderado', emoji: '🟡', cor: '#f59e0b' };
  return { nivel: 'leve', emoji: '🟢', cor: '#00C853' };
}

module.exports = { getVelocidade, estimarMinutos, getNivelTransito };
