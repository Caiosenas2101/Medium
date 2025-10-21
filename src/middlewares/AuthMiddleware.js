const AuthUtils = require('../utils/AuthUtils');
const logger = require('../config/logger');

class AuthMiddleware {
  /**
   * Middleware para verificar autenticação JWT
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next function
   */
  static isAuthenticated(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        logger.warn('Tentativa de acesso sem token de autorização', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
        });

        return res.status(401).json({
          status: 'error',
          type_error: 'AUTHENTICATION_ERROR',
          message: 'Token de autorização não fornecido',
        });
      }

      const token = AuthUtils.extractTokenFromHeader(authHeader);
      
      if (!token) {
        logger.warn('Formato de token inválido', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
        });

        return res.status(401).json({
          status: 'error',
          type_error: 'AUTHENTICATION_ERROR',
          message: 'Formato de token inválido. Use: Bearer <token>',
        });
      }

      // Verificar e decodificar o token
      const decoded = AuthUtils.verifyToken(token);
      
      // Adicionar informações do usuário ao request
      req.auth = {
        user_id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        token: token,
      };

      logger.debug('Usuário autenticado com sucesso', {
        userId: decoded.id,
        email: decoded.email,
        path: req.path,
      });

      next();
    } catch (error) {
      logger.warn('Erro na autenticação:', {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });

      return res.status(401).json({
        status: 'error',
        type_error: 'AUTHENTICATION_ERROR',
        message: error.message || 'Token inválido ou expirado',
      });
    }
  }

  /**
   * Middleware opcional para autenticação (não falha se não houver token)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next function
   */
  static optionalAuth(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        req.auth = null;
        return next();
      }

      const token = AuthUtils.extractTokenFromHeader(authHeader);
      
      if (!token) {
        req.auth = null;
        return next();
      }

      // Verificar e decodificar o token
      const decoded = AuthUtils.verifyToken(token);
      
      // Adicionar informações do usuário ao request
      req.auth = {
        user_id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        token: token,
      };

      logger.debug('Usuário autenticado opcionalmente', {
        userId: decoded.id,
        email: decoded.email,
        path: req.path,
      });

      next();
    } catch (error) {
      // Em caso de erro, continuar sem autenticação
      req.auth = null;
      logger.debug('Token inválido em autenticação opcional:', {
        error: error.message,
        path: req.path,
      });
      next();
    }
  }

  /**
   * Middleware para verificar se o usuário é o autor de um recurso
   * @param {string} resourceIdParam - Nome do parâmetro que contém o ID do recurso
   * @param {Function} getResourceOwner - Função para obter o dono do recurso
   * @returns {Function} Middleware function
   */
  static isOwner(resourceIdParam = 'id', getResourceOwner) {
    return async (req, res, next) => {
      try {
        if (!req.auth) {
          return res.status(401).json({
            status: 'error',
            type_error: 'AUTHENTICATION_ERROR',
            message: 'Autenticação necessária',
          });
        }

        const resourceId = req.params[resourceIdParam];
        
        if (!resourceId) {
          return res.status(400).json({
            status: 'error',
            type_error: 'VALIDATION_ERROR',
            message: `Parâmetro ${resourceIdParam} é obrigatório`,
          });
        }

        // Obter o dono do recurso
        const resource = await getResourceOwner(resourceId);
        
        if (!resource) {
          return res.status(404).json({
            status: 'error',
            type_error: 'NOT_FOUND',
            message: 'Recurso não encontrado',
          });
        }

        // Verificar se o usuário é o dono
        if (resource.user_id !== req.auth.user_id) {
          logger.warn('Tentativa de acesso não autorizado', {
            userId: req.auth.user_id,
            resourceId,
            resourceOwner: resource.user_id,
            path: req.path,
          });

          return res.status(403).json({
            status: 'error',
            type_error: 'AUTHORIZATION_ERROR',
            message: 'Acesso negado. Você não tem permissão para acessar este recurso',
          });
        }

        // Adicionar o recurso ao request para uso posterior
        req.resource = resource;

        logger.debug('Acesso autorizado ao recurso', {
          userId: req.auth.user_id,
          resourceId,
          path: req.path,
        });

        next();
      } catch (error) {
        logger.error('Erro na verificação de propriedade:', {
          error: error.message,
          userId: req.auth?.user_id,
          resourceId: req.params[resourceIdParam],
          path: req.path,
        });

        return res.status(500).json({
          status: 'error',
          type_error: 'INTERNAL_ERROR',
          message: 'Erro interno do servidor',
        });
      }
    };
  }

  /**
   * Middleware para verificar se o usuário tem um papel específico
   * @param {string|Array} roles - Papel(éis) permitido(s)
   * @returns {Function} Middleware function
   */
  static hasRole(roles) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    return (req, res, next) => {
      if (!req.auth) {
        return res.status(401).json({
          status: 'error',
          type_error: 'AUTHENTICATION_ERROR',
          message: 'Autenticação necessária',
        });
      }

      // Verificar se o usuário tem o papel necessário
      const userRole = req.auth.role || 'user';
      
      if (!allowedRoles.includes(userRole)) {
        logger.warn('Tentativa de acesso com papel insuficiente', {
          userId: req.auth.user_id,
          userRole,
          requiredRoles: allowedRoles,
          path: req.path,
        });

        return res.status(403).json({
          status: 'error',
          type_error: 'AUTHORIZATION_ERROR',
          message: 'Acesso negado. Papel insuficiente',
        });
      }

      next();
    };
  }

  /**
   * Middleware para verificar se o token está próximo do vencimento
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next function
   */
  static checkTokenExpiry(req, res, next) {
    if (!req.auth || !req.auth.token) {
      return next();
    }

    try {
      const isNearExpiry = AuthUtils.isTokenNearExpiry(req.auth.token);
      
      if (isNearExpiry) {
        // Adicionar header para indicar que o token está próximo do vencimento
        res.set('X-Token-Expiry-Warning', 'true');
        
        logger.debug('Token próximo do vencimento', {
          userId: req.auth.user_id,
          path: req.path,
        });
      }

      next();
    } catch (error) {
      logger.warn('Erro ao verificar vencimento do token:', error);
      next();
    }
  }
}

module.exports = AuthMiddleware;

