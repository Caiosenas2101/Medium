const morgan = require('morgan');

class Logger {
  constructor() {
    this.morgan = morgan('dev');
  }

  info(message) {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
  }

  error(message, error = null) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
    if (error) {
      console.error(error);
    }
  }

  warn(message) {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`);
  }

  debug(message) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`);
    }
  }

  getMorganMiddleware() {
    return this.morgan;
  }
}

module.exports = new Logger();

