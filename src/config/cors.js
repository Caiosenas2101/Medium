const cors = require('cors');

// Configuração de CORS para desenvolvimento
const developmentCors = cors({
  origin: true, // Permitir todas as origens em desenvolvimento
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

// Configuração de CORS para produção
const productionCors = cors({
  origin: function (origin, callback) {
    // Permitir requisições sem origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Lista de origens permitidas em produção
    const allowedOrigins = [
      'https://yourdomain.com',
      'https://www.yourdomain.com',
      'https://api.yourdomain.com',
      // Adicione suas origens de produção aqui
    ];
    
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

// Configuração de CORS para testes
const testCors = cors({
  origin: true,
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
});

// Função para obter configuração de CORS baseada no ambiente
const getCorsConfig = () => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return productionCors;
    case 'test':
      return testCors;
    default:
      return developmentCors;
  }
};

// Middleware de CORS customizado para APIs específicas
const apiCors = cors({
  origin: function (origin, callback) {
    // Permitir requisições sem origin
    if (!origin) return callback(null, true);
    
    // Lista de origens permitidas para APIs
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ];
    
    // Em produção, adicione suas origens reais
    if (process.env.NODE_ENV === 'production') {
      allowedOrigins.push(
        'https://yourdomain.com',
        'https://www.yourdomain.com',
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

// Middleware para configurar CORS dinamicamente
const dynamicCors = (req, res, next) => {
  const corsConfig = getCorsConfig();
  corsConfig(req, res, next);
};

module.exports = {
  developmentCors,
  productionCors,
  testCors,
  apiCors,
  getCorsConfig,
  dynamicCors,
};

