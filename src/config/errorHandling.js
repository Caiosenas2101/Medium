const logger = require('./logger');

/**
 * Configuração de tratamento de erros
 */
class ErrorHandlingConfig {
  /**
   * Configura tratamento de erros para a aplicação
   * @param {Express} app - Instância do Express
   */
  static setupErrorHandling(app) {
    // Middleware para capturar erros assíncronos
    app.use((err, req, res, next) => {
      if (err.name === 'ValidationError') {
        return res.status(400).json({
          status: 'error',
          type_error: 'VALIDATION_ERROR',
          message: 'Dados de entrada inválidos',
          errors: err.errors || [err.message],
          requestId: req.requestId,
        });
      }

      if (err.name === 'CastError') {
        return res.status(400).json({
          status: 'error',
          type_error: 'VALIDATION_ERROR',
          message: 'Formato de ID inválido',
          requestId: req.requestId,
        });
      }

      if (err.name === 'MongoError' && err.code === 11000) {
        return res.status(409).json({
          status: 'error',
          type_error: 'UNIQUE_CONSTRAINT_ERROR',
          message: 'Dados duplicados',
          requestId: req.requestId,
        });
      }

      if (err.name === 'SequelizeValidationError') {
        const errors = err.errors.map(error => ({
          field: error.path,
          message: error.message,
          value: error.value,
        }));

        return res.status(400).json({
          status: 'error',
          type_error: 'VALIDATION_ERROR',
          message: 'Erro de validação nos dados',
          errors,
          requestId: req.requestId,
        });
      }

      if (err.name === 'SequelizeUniqueConstraintError') {
        const field = err.errors[0]?.path || 'campo';
        return res.status(409).json({
          status: 'error',
          type_error: 'UNIQUE_CONSTRAINT_ERROR',
          message: `${field} já existe`,
          field,
          requestId: req.requestId,
        });
      }

      if (err.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
          status: 'error',
          type_error: 'FOREIGN_KEY_ERROR',
          message: 'Referência inválida',
          requestId: req.requestId,
        });
      }

      if (err.name === 'SequelizeConnectionError') {
        return res.status(503).json({
          status: 'error',
          type_error: 'DATABASE_ERROR',
          message: 'Erro de conexão com o banco de dados',
          requestId: req.requestId,
        });
      }

      if (err.name === 'SequelizeTimeoutError') {
        return res.status(504).json({
          status: 'error',
          type_error: 'TIMEOUT_ERROR',
          message: 'Timeout na operação',
          requestId: req.requestId,
        });
      }

      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          status: 'error',
          type_error: 'JWT_ERROR',
          message: 'Token inválido',
          requestId: req.requestId,
        });
      }

      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          type_error: 'JWT_EXPIRED',
          message: 'Token expirado',
          requestId: req.requestId,
        });
      }

      if (err.name === 'AuthorizationError') {
        return res.status(403).json({
          status: 'error',
          type_error: 'AUTHORIZATION_ERROR',
          message: err.message || 'Acesso negado',
          requestId: req.requestId,
        });
      }

      if (err.name === 'NotFoundError') {
        return res.status(404).json({
          status: 'error',
          type_error: 'NOT_FOUND',
          message: err.message || 'Recurso não encontrado',
          requestId: req.requestId,
        });
      }

      if (err.name === 'ConflictError') {
        return res.status(409).json({
          status: 'error',
          type_error: 'CONFLICT_ERROR',
          message: err.message || 'Conflito de dados',
          requestId: req.requestId,
        });
      }

      if (err.name === 'RateLimitError') {
        return res.status(429).json({
          status: 'error',
          type_error: 'RATE_LIMIT_ERROR',
          message: 'Muitas tentativas. Tente novamente mais tarde',
          requestId: req.requestId,
        });
      }

      // Log do erro
      logger.error('Erro não tratado capturado:', {
        requestId: req.requestId,
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

      // Erro interno do servidor
      const statusCode = err.statusCode || err.status || 500;
      const message = process.env.NODE_ENV === 'production' 
        ? 'Erro interno do servidor' 
        : err.message || 'Erro interno do servidor';

      res.status(statusCode).json({
        status: 'error',
        type_error: 'INTERNAL_ERROR',
        message,
        requestId: req.requestId,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
      });
    });

    // Middleware para rotas não encontradas
    app.use('*', (req, res) => {
      logger.warn('Rota não encontrada:', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.auth?.user_id || 'anonymous',
      });

      res.status(404).json({
        status: 'error',
        type_error: 'NOT_FOUND',
        message: `Rota ${req.method} ${req.originalUrl} não encontrada`,
        availableRoutes: {
          auth: '/api/auth/*',
          users: '/api/users/*',
          posts: '/api/posts/*',
          health: '/health',
          docs: '/api/docs',
        },
        requestId: req.requestId,
      });
    });

    logger.info('Tratamento de erros configurado com sucesso');
  }

  /**
   * Configura tratamento de erros para desenvolvimento
   * @param {Express} app - Instância do Express
   */
  static setupDevelopmentErrorHandling(app) {
    if (process.env.NODE_ENV === 'development') {
      // Middleware para mostrar erros detalhados em desenvolvimento
      app.use((err, req, res, next) => {
        console.error('Erro em desenvolvimento:', err);
        next(err);
      });
    }
  }

  /**
   * Configura tratamento de erros para produção
   * @param {Express} app - Instância do Express
   */
  static setupProductionErrorHandling(app) {
    if (process.env.NODE_ENV === 'production') {
      // Middleware para esconder detalhes de erro em produção
      app.use((err, req, res, next) => {
        // Log do erro em produção
        logger.error('Erro em produção:', {
          requestId: req.requestId,
          error: err.message,
          method: req.method,
          url: req.url,
          ip: req.ip,
          userId: req.auth?.user_id || 'anonymous',
        });

        // Não expor stack trace em produção
        if (err.stack) {
          delete err.stack;
        }

        next(err);
      });
    }
  }
}

module.exports = ErrorHandlingConfig;

