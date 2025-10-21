const helmet = require('helmet');
const cors = require('cors');

// Configuração do Helmet para segurança
const helmetConfig = helmet({
  // Configurações de segurança básicas
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'same-origin' },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
});

// Configuração do CORS
const corsConfig = cors({
  origin: function (origin, callback) {
    // Permitir requisições sem origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Lista de origens permitidas
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      // Adicione outras origens conforme necessário
    ];
    
    // Em produção, adicione suas origens reais
    if (process.env.NODE_ENV === 'production') {
      allowedOrigins.push(
        'https://yourdomain.com',
        'https://www.yourdomain.com',
        // Adicione suas origens de produção aqui
      );
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
  ],
  exposedHeaders: [
    'X-Token-Expiry-Warning',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset',
  ],
  maxAge: 86400, // 24 horas
});

// Configuração de rate limiting
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requests por IP por janela
  message: {
    status: 'error',
    type_error: 'RATE_LIMIT_ERROR',
    message: 'Muitas tentativas. Tente novamente mais tarde',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Pular rate limiting para health checks
    return req.path === '/health' || req.path === '/api/health';
  },
};

// Configuração de rate limiting para autenticação
const authRateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Limite de 5 tentativas de login por IP por janela
  message: {
    status: 'error',
    type_error: 'RATE_LIMIT_ERROR',
    message: 'Muitas tentativas de login. Tente novamente mais tarde',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Não contar requests bem-sucedidos
};

// Configuração de segurança para headers customizados
const securityHeaders = (req, res, next) => {
  // Remover header X-Powered-By
  res.removeHeader('X-Powered-By');
  
  // Adicionar headers de segurança customizados
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Header para indicar que a API é uma API
  res.setHeader('X-API-Version', '1.0.0');
  
  next();
};

// Configuração de validação de IP
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (process.env.NODE_ENV === 'production' && allowedIPs.length > 0) {
      const clientIP = req.ip || req.connection.remoteAddress;
      
      if (!allowedIPs.includes(clientIP)) {
        return res.status(403).json({
          status: 'error',
          type_error: 'IP_NOT_ALLOWED',
          message: 'IP não permitido',
        });
      }
    }
    
    next();
  };
};

module.exports = {
  helmetConfig,
  corsConfig,
  rateLimitConfig,
  authRateLimitConfig,
  securityHeaders,
  ipWhitelist,
};

