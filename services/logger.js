const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../logs');

// Criar diretório de logs se não existir
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const levels = {
  INFO: 'INFO',
  ERROR: 'ERROR',
  WARN: 'WARN',
  DEBUG: 'DEBUG',
};

const logger = {
  log: (level, message, data = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data,
    };

    const logString = JSON.stringify(logEntry) + '\n';

    // Log no console
    const colors = {
      INFO: '\x1b[36m',
      ERROR: '\x1b[31m',
      WARN: '\x1b[33m',
      DEBUG: '\x1b[35m',
    };
    console.log(`${colors[level] || '\x1b[37m'}[${level}]\x1b[0m ${message}`, data);

    // Log em arquivo
    const allLogFile = path.join(logsDir, 'all.log');
    const levelLogFile = path.join(logsDir, `${level.toLowerCase()}.log`);

    fs.appendFileSync(allLogFile, logString);
    fs.appendFileSync(levelLogFile, logString);
  },

  info: (message, data) => logger.log(levels.INFO, message, data),
  error: (message, data) => logger.log(levels.ERROR, message, data),
  warn: (message, data) => logger.log(levels.WARN, message, data),
  debug: (message, data) => logger.log(levels.DEBUG, message, data),
};

module.exports = logger;