const express = require('express');
const logger = require('./logger');

/**
 * Configuração de rotas da aplicação
 */
class RouteConfig {
  /**
   * Configura rotas principais da API
   * @param {Express} app - Instância do Express
   */
  static setupRoutes(app) {
    // Importar rotas
    const authRoutes = require('../modules/auth/AuthRoutes');
    const userRoutes = require('../modules/users/UserRoutes');
    const postRoutes = require('../modules/posts/PostRoutes');

    // Rota de health check
    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'success',
        message: 'API está funcionando',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        requestId: req.requestId,
        version: '1.0.0',
      });
    });

    // Rota de informações da API
    app.get('/api', (req, res) => {
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
        features: [
          'Autenticação JWT',
          'Sistema de usuários',
          'Posts com agendamento',
          'Sistema de likes',
          'Paginação',
          'Validação de dados',
          'Rate limiting',
          'Logs detalhados',
        ],
        requestId: req.requestId,
      });
    });

    // Rota de documentação da API
    app.get('/api/docs', (req, res) => {
      res.status(200).json({
        status: 'success',
        message: 'Documentação da API',
        version: '1.0.0',
        endpoints: {
          auth: {
            'POST /api/auth/users': 'Criar usuário',
            'POST /api/auth/login': 'Login',
            'GET /api/auth/me': 'Perfil do usuário',
            'PUT /api/auth/me': 'Atualizar perfil',
            'PUT /api/auth/me/password': 'Alterar senha',
            'DELETE /api/auth/me': 'Remover usuário',
          },
          users: {
            'GET /api/users': 'Listar usuários',
            'GET /api/users/count': 'Contar usuários',
            'GET /api/users/:id': 'Buscar usuário',
            'GET /api/users/:id/posts': 'Posts do usuário',
            'PUT /api/users/:id': 'Atualizar usuário',
            'DELETE /api/users/:id': 'Remover usuário',
          },
          posts: {
            'GET /api/posts': 'Listar posts',
            'GET /api/posts/count': 'Contar posts',
            'GET /api/posts/most-liked': 'Posts mais curtidos',
            'GET /api/posts/:id': 'Buscar post',
            'POST /api/posts': 'Criar post',
            'PUT /api/posts/:id': 'Atualizar post',
            'DELETE /api/posts/:id': 'Remover post',
            'PUT /api/posts/:id/schedule': 'Agendar post',
            'POST /api/posts/:id/like': 'Toggle like',
            'GET /api/posts/:id/likes': 'Likes do post',
            'GET /api/posts/:id/likes/count': 'Contar likes',
            'GET /api/posts/:id/liked': 'Verificar like',
            'GET /api/users/:id/likes': 'Likes do usuário',
            'GET /api/users/:id/likes/count': 'Contar likes do usuário',
            'DELETE /api/likes/:id': 'Remover like',
          },
        },
        authentication: {
          type: 'Bearer Token',
          header: 'Authorization: Bearer <token>',
          example: 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        pagination: {
          parameters: ['limit', 'offset', 'page'],
          example: '?limit=10&offset=0&page=1',
        },
        filtering: {
          posts: ['include_scheduled', 'user_id', 'search'],
          users: ['search', 'email'],
          likes: ['include_deleted', 'post_id', 'user_id'],
        },
        requestId: req.requestId,
      });
    });

    // Rotas da API
    app.use('/api/auth', authRoutes);
    app.use('/api', userRoutes);
    app.use('/api', postRoutes);

    // Rota para métodos não suportados
    app.all('/api/*', (req, res) => {
      res.status(405).json({
        status: 'error',
        type_error: 'METHOD_NOT_ALLOWED',
        message: `Método ${req.method} não é suportado para esta rota`,
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        requestId: req.requestId,
      });
    });

    logger.info('Rotas configuradas com sucesso');
  }

  /**
   * Configura rotas de teste (apenas em desenvolvimento)
   * @param {Express} app - Instância do Express
   */
  static setupTestRoutes(app) {
    if (process.env.NODE_ENV === 'development') {
      // Rota para testar autenticação
      app.get('/api/test/auth', (req, res) => {
        res.status(200).json({
          status: 'success',
          message: 'Rota de teste de autenticação',
          auth: req.auth || null,
          headers: req.headers,
          requestId: req.requestId,
        });
      });

      // Rota para testar validação
      app.post('/api/test/validation', (req, res) => {
        res.status(200).json({
          status: 'success',
          message: 'Rota de teste de validação',
          body: req.body,
          requestId: req.requestId,
        });
      });

      // Rota para testar paginação
      app.get('/api/test/pagination', (req, res) => {
        const { limit = 10, offset = 0, page = 1 } = req.query;
        res.status(200).json({
          status: 'success',
          message: 'Rota de teste de paginação',
          pagination: { limit, offset, page },
          requestId: req.requestId,
        });
      });

      logger.info('Rotas de teste configuradas');
    }
  }

  /**
   * Configura rotas de monitoramento
   * @param {Express} app - Instância do Express
   */
  static setupMonitoringRoutes(app) {
    // Rota de status detalhado
    app.get('/api/status', (req, res) => {
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      res.status(200).json({
        status: 'success',
        message: 'Status detalhado da API',
        server: {
          uptime: `${Math.floor(uptime / 60)} minutos`,
          memory: {
            rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
            heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
            heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
            external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
          },
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
        },
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    });

    // Rota de métricas
    app.get('/api/metrics', (req, res) => {
      res.status(200).json({
        status: 'success',
        message: 'Métricas da API',
        metrics: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          platform: process.platform,
          nodeVersion: process.version,
        },
        requestId: req.requestId,
      });
    });

    logger.info('Rotas de monitoramento configuradas');
  }
}

module.exports = RouteConfig;

