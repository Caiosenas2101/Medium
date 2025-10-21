require('dotenv').config();
require('express-async-errors');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Importações de configuração
const { sequelize, testConnection } = require('./database');
const logger = require('./config/logger');
const { getMorganConfig, customLogger, errorLogger, performanceLogger, rateLimitLogger } = require('./config/morgan');
const { helmetConfig, corsConfig, rateLimitConfig, authRateLimitConfig, securityHeaders } = require('./config/security');

// Importações de middlewares
const ErrorMiddleware = require('./middlewares/ErrorMiddleware');
const AuthMiddleware = require('./middlewares/AuthMiddleware');

// Importações de rotas
const authRoutes = require('./modules/auth/AuthRoutes');
const userRoutes = require('./modules/users/UserRoutes');
const postRoutes = require('./modules/posts/PostRoutes');

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Configura middlewares globais
   */
  setupMiddlewares() {
    // Trust proxy para rate limiting e IPs corretos
    this.app.set('trust proxy', 1);

    // Middlewares de segurança
    this.app.use(helmetConfig);
    this.app.use(corsConfig);
    this.app.use(securityHeaders);

    // Middlewares de logging
    this.app.use(getMorganConfig());
    this.app.use(customLogger);
    this.app.use(performanceLogger);
    this.app.use(rateLimitLogger);

    // Rate limiting geral
    this.app.use(rateLimit(rateLimitConfig));

    // Rate limiting para autenticação
    this.app.use('/api/auth/login', rateLimit(authRateLimitConfig));
    this.app.use('/api/users', rateLimit(authRateLimitConfig));

    // Middlewares de parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Middleware para adicionar timestamp
    this.app.use((req, res, next) => {
      req.timestamp = new Date().toISOString();
      next();
    });

    // Middleware para adicionar request ID
    this.app.use((req, res, next) => {
      req.requestId = Math.random().toString(36).substring(2, 15);
      res.set('X-Request-ID', req.requestId);
      next();
    });

    logger.info('Middlewares configurados com sucesso');
  }

  /**
   * Configura rotas da aplicação
   */
  setupRoutes() {
    // Rota de health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'success',
        message: 'API está funcionando',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
      });
    });

    // Rota de informações da API
    this.app.get('/api', (req, res) => {
      res.status(200).json({
        status: 'success',
        message: 'Green Amigo Medium Challenge API',
        version: '1.0.0',
        documentation: '/api/docs',
        endpoints: {
          auth: '/api/auth',
          users: '/api/users',
          posts: '/api/posts',
          health: '/health',
        },
      });
    });

    // Rotas da API
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api', userRoutes);
    this.app.use('/api', postRoutes);

    // Middleware para rotas não encontradas
    this.app.use(ErrorMiddleware.notFound);

    logger.info('Rotas configuradas com sucesso');
  }

  /**
   * Configura tratamento de erros
   */
  setupErrorHandling() {
    // Middleware de log de erros
    this.app.use(errorLogger);

    // Middleware global de tratamento de erros
    this.app.use(ErrorMiddleware.handle);

    logger.info('Tratamento de erros configurado com sucesso');
  }

  /**
   * Inicia o servidor
   */
  async start() {
    try {
      // Testar conexão com banco de dados
      await testConnection();

      // Iniciar servidor
      this.server = this.app.listen(this.port, () => {
        logger.info(`🚀 Servidor iniciado com sucesso!`, {
          port: this.port,
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date().toISOString(),
        });

        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    🚀 SERVIDOR INICIADO                     ║
╠══════════════════════════════════════════════════════════════╣
║  Porta: ${this.port.toString().padEnd(52)} ║
║  Ambiente: ${(process.env.NODE_ENV || 'development').padEnd(50)} ║
║  URL: http://localhost:${this.port.toString().padEnd(40)} ║
║  Health: http://localhost:${this.port}/health${' '.repeat(25)} ║
║  API: http://localhost:${this.port}/api${' '.repeat(28)} ║
╚══════════════════════════════════════════════════════════════╝
        `);
      });

      // Configurar graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Erro ao iniciar servidor:', error);
      process.exit(1);
    }
  }

  /**
   * Configura graceful shutdown
   */
  setupGracefulShutdown() {
    const gracefulShutdown = (signal) => {
      logger.info(`Recebido sinal ${signal}. Iniciando graceful shutdown...`);
      
      this.server.close(() => {
        logger.info('Servidor HTTP fechado');
        
        // Fechar conexão com banco de dados
        sequelize.close().then(() => {
          logger.info('Conexão com banco de dados fechada');
          process.exit(0);
        }).catch((error) => {
          logger.error('Erro ao fechar conexão com banco:', error);
          process.exit(1);
        });
      });

      // Forçar fechamento após 30 segundos
      setTimeout(() => {
        logger.error('Forçando fechamento do servidor...');
        process.exit(1);
      }, 30000);
    };

    // Capturar sinais de encerramento
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Capturar erros não tratados
    process.on('uncaughtException', (error) => {
      logger.error('Erro não capturado:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Promise rejeitada não tratada:', { reason, promise });
      gracefulShutdown('unhandledRejection');
    });
  }

  /**
   * Para o servidor
   */
  async stop() {
    if (this.server) {
      this.server.close();
      await sequelize.close();
      logger.info('Servidor parado com sucesso');
    }
  }
}

// Criar e iniciar servidor
const server = new Server();

// Iniciar servidor apenas se não estiver em modo de teste
if (process.env.NODE_ENV !== 'test') {
  server.start();
}

module.exports = server;