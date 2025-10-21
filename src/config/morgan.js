const morgan = require('morgan');
const logger = require('./logger');

// Configuração customizada do Morgan
const morganConfig = {
  // Formato para desenvolvimento
  development: morgan('dev', {
    stream: {
      write: (message) => {
        logger.info(message.trim());
      },
    },
  }),

  // Formato para produção
  production: morgan('combined', {
    stream: {
      write: (message) => {
        logger.info(message.trim());
      },
    },
    skip: (req, res) => {
      // Pular logs de health checks em produção
      return req.url === '/health' || req.url === '/api/health';
    },
  }),

  // Formato para testes
  test: morgan('tiny', {
    stream: {
      write: (message) => {
        // Em testes, não logar no console
        if (process.env.NODE_ENV !== 'test') {
          logger.debug(message.trim());
        }
      },
    },
  }),
};

// Middleware customizado para logs detalhados
const customLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log da requisição
  logger.info('Requisição recebida', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.auth?.user_id || 'anonymous',
  });

  // Interceptar resposta
  const originalSend = res.send;
  res.send = function (body) {
    const duration = Date.now() - start;
    
    // Log da resposta
    logger.info('Resposta enviada', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.auth?.user_id || 'anonymous',
      contentLength: res.get('Content-Length') || 0,
    });

    // Log de erro se status >= 400
    if (res.statusCode >= 400) {
      logger.warn('Resposta com erro', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userId: req.auth?.user_id || 'anonymous',
        body: typeof body === 'string' ? body.substring(0, 200) : body,
      });
    }

    return originalSend.call(this, body);
  };

  next();
};

// Middleware para log de erros
const errorLogger = (err, req, res, next) => {
  logger.error('Erro capturado pelo middleware', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.auth?.user_id || 'anonymous',
    body: req.body,
    query: req.query,
    params: req.params,
  });

  next(err);
};

// Middleware para log de performance
const performanceLogger = (req, res, next) => {
  const start = process.hrtime();
  
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1e6;
    
    if (duration > 1000) { // Log apenas se demorar mais de 1 segundo
      logger.warn('Requisição lenta detectada', {
        method: req.method,
        url: req.url,
        duration: `${duration.toFixed(2)}ms`,
        ip: req.ip,
        userId: req.auth?.user_id || 'anonymous',
      });
    }
  });

  next();
};

// Middleware para log de rate limiting
const rateLimitLogger = (req, res, next) => {
  const rateLimitRemaining = res.get('X-Rate-Limit-Remaining');
  const rateLimitReset = res.get('X-Rate-Limit-Reset');
  
  if (rateLimitRemaining && parseInt(rateLimitRemaining) < 10) {
    logger.warn('Rate limit próximo do limite', {
      method: req.method,
      url: req.url,
      remaining: rateLimitRemaining,
      reset: rateLimitReset,
      ip: req.ip,
      userId: req.auth?.user_id || 'anonymous',
    });
  }

  next();
};

// Função para obter configuração do Morgan baseada no ambiente
const getMorganConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return morganConfig[env] || morganConfig.development;
};

module.exports = {
  morganConfig,
  customLogger,
  errorLogger,
  performanceLogger,
  rateLimitLogger,
  getMorganConfig,
};

