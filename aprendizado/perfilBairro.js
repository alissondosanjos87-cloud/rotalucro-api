// aprendizado/perfilBairro.js
var perfil = {};

function registrar(bairro, tipo, tempoReal) {
  if (!bairro || !tipo) return;
  
  var chave = bairro + '_' + tipo;
  if (!perfil[chave]) {
    perfil[chave] = { tempos: [], media: 0, amostras: 0 };
  }
  
  perfil[chave].tempos.push(tempoReal);
  if (perfil[chave].tempos.length > 30) perfil[chave].tempos.shift();
  
  var soma = 0;
  perfil[chave].tempos.forEach(function(t) { soma += t; });
  perfil[chave].media = soma / perfil[chave].tempos.length;
  perfil[chave].amostras = perfil[chave].tempos.length;
}

function getTempo(bairro, tipo) {
  var chave = bairro + '_' + tipo;
  if (perfil[chave] && perfil[chave].amostras >= 3) {
    return perfil[chave].media;
  }
  return null;
}

function getTodos() {
  return Object.keys(perfil).map(function(k) {
    return { chave: k, media: perfil[k].media, amostras: perfil[k].amostras };
  });
}

module.exports = { registrar, getTempo, getTodos };
