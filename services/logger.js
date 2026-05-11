// services/logger.js
var fs = require('fs');
var path = require('path');

var LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
var currentLevel = LOG_LEVELS[process.env.LOG_LEVEL] || LOG_LEVELS.info;
var logDir = path.join(__dirname, '..', 'logs');

// Cria pasta de logs se não existir
try { if (!fs.existsSync(logDir)) fs.mkdirSync(logDir); } catch(e) {}

function formatar(nivel, mensagem, dados) {
  var ts = new Date().toISOString();
  var safe = Object.assign({}, dados);
  delete safe.token; delete safe.apiKey; delete safe.authorization;
  delete safe.password; delete safe.secret;
  
  var extra = Object.keys(safe).length ? ' ' + JSON.stringify(safe).substring(0, 500) : '';
  return '[' + ts + '] [' + nivel.toUpperCase() + '] ' + mensagem + extra;
}

function escreverArquivo(linha) {
  try {
    var data = new Date().toISOString().split('T')[0];
    var arquivo = path.join(logDir, 'rotalucro-' + data + '.log');
    fs.appendFileSync(arquivo, linha + '\n');
  } catch(e) {}
}

function log(nivel, mensagem, dados) {
  if (LOG_LEVELS[nivel] < currentLevel) return;
  
  var linha = formatar(nivel, mensagem, dados || {});
  
  if (nivel === 'error') console.error(linha);
  else if (nivel === 'warn') console.warn(linha);
  else console.log(linha);
  
  if (process.env.NODE_ENV === 'production') escreverArquivo(linha);
}

var logger = {
  debug: function(msg, data) { log('debug', msg, data); },
  info: function(msg, data) { log('info', msg, data); },
  warn: function(msg, data) { log('warn', msg, data); },
  error: function(msg, data) { log('error', msg, data); },
  getLevel: function() { return currentLevel; },
  setLevel: function(nivel) { if (LOG_LEVELS[nivel] !== undefined) currentLevel = LOG_LEVELS[nivel]; }
};

module.exports = logger;
