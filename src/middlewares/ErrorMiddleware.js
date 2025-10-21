const logger = require('../config/logger');

class ErrorMiddleware {
  /**
   * Middleware global para tratamento de erros
   * @param {Error} err - Erro capturado
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next function
   */
  static handle(err, req, res, next) {
    // Log do erro
    logger.error(`Erro capturado em ${req.method} ${req.path}:`, {
      error: err.message,
      stack: err.stack,
      body: req.body,
      query: req.query,
      params: req.params,
      user: req.auth?.user_id || 'anonymous',
    });

    // Erro de validação do Sequelize
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
      });
    }

    // Erro de chave única do Sequelize
    if (err.name === 'SequelizeUniqueConstraintError') {
      const field = err.errors[0]?.path || 'campo';
      return res.status(409).json({
        status: 'error',
        type_error: 'UNIQUE_CONSTRAINT_ERROR',
        message: `${field} já existe`,
        field,
      });
    }

    // Erro de chave estrangeira do Sequelize
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        status: 'error',
        type_error: 'FOREIGN_KEY_ERROR',
        message: 'Referência inválida',
      });
    }

    // Erro de conexão com banco de dados
    if (err.name === 'SequelizeConnectionError') {
      return res.status(503).json({
        status: 'error',
        type_error: 'DATABASE_ERROR',
        message: 'Erro de conexão com o banco de dados',
      });
    }

    // Erro de timeout
    if (err.name === 'SequelizeTimeoutError') {
      return res.status(504).json({
        status: 'error',
        type_error: 'TIMEOUT_ERROR',
        message: 'Timeout na operação',
      });
    }

    // Erro de JWT
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        type_error: 'JWT_ERROR',
        message: 'Token inválido',
      });
    }

    // Erro de JWT expirado
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        type_error: 'JWT_EXPIRED',
        message: 'Token expirado',
      });
    }

    // Erro de autorização
    if (err.name === 'AuthorizationError') {
      return res.status(403).json({
        status: 'error',
        type_error: 'AUTHORIZATION_ERROR',
        message: err.message || 'Acesso negado',
      });
    }

    // Erro de recurso não encontrado
    if (err.name === 'NotFoundError') {
      return res.status(404).json({
        status: 'error',
        type_error: 'NOT_FOUND',
        message: err.message || 'Recurso não encontrado',
      });
    }

    // Erro de validação customizado
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        type_error: 'VALIDATION_ERROR',
        message: err.message || 'Dados inválidos',
        errors: err.errors || [],
      });
    }

    // Erro de conflito
    if (err.name === 'ConflictError') {
      return res.status(409).json({
        status: 'error',
        type_error: 'CONFLICT_ERROR',
        message: err.message || 'Conflito de dados',
      });
    }

    // Erro de limite de taxa
    if (err.name === 'RateLimitError') {
      return res.status(429).json({
        status: 'error',
        type_error: 'RATE_LIMIT_ERROR',
        message: 'Muitas tentativas. Tente novamente mais tarde',
      });
    }

    // Erro interno do servidor (padrão)
    const statusCode = err.statusCode || err.status || 500;
    const message = process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : err.message || 'Erro interno do servidor';

    return res.status(statusCode).json({
      status: 'error',
      type_error: 'INTERNAL_ERROR',
      message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
  }

  /**
   * Middleware para capturar rotas não encontradas
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next function
   */
  static notFound(req, res, next) {
    const error = new Error(`Rota não encontrada: ${req.method} ${req.path}`);
    error.name = 'NotFoundError';
    error.statusCode = 404;
    next(error);
  }

  /**
   * Middleware para capturar erros assíncronos
   * @param {Function} fn - Função assíncrona
   * @returns {Function} Middleware function
   */
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

module.exports = ErrorMiddleware;

