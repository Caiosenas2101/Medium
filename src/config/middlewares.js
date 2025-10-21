const express = require('express');
const rateLimit = require('express-rate-limit');
const logger = require('./logger');

/**
 * Configuração de middlewares globais
 */
class MiddlewareConfig {
  /**
   * Middleware para adicionar informações de request
   */
  static requestInfo() {
    return (req, res, next) => {
      req.timestamp = new Date().toISOString();
      req.requestId = Math.random().toString(36).substring(2, 15);
      res.set('X-Request-ID', req.requestId);
      res.set('X-Timestamp', req.timestamp);
      next();
    };
  }

  /**
   * Middleware para adicionar headers de segurança
   */
  static securityHeaders() {
    return (req, res, next) => {
      // Remover header X-Powered-By
      res.removeHeader('X-Powered-By');
      
      // Adicionar headers de segurança
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('X-API-Version', '1.0.0');
      
      next();
    };
  }

  /**
   * Middleware para log de requisições
   */
  static requestLogger() {
    return (req, res, next) => {
      const start = Date.now();
      
      // Log da requisição
      logger.info('Requisição recebida', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.auth?.user_id || 'anonymous',
        timestamp: req.timestamp,
      });

      // Interceptar resposta
      const originalSend = res.send;
      res.send = function (body) {
        const duration = Date.now() - start;
        
        // Adicionar headers de resposta
        res.set('X-Response-Time', `${duration}ms`);
        res.set('X-Request-ID', req.requestId);
        
        // Log da resposta
        logger.info('Resposta enviada', {
          requestId: req.requestId,
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
            requestId: req.requestId,
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
  }

  /**
   * Middleware para log de performance
   */
  static performanceLogger() {
    return (req, res, next) => {
      const start = process.hrtime();
      
      res.on('finish', () => {
        const [seconds, nanoseconds] = process.hrtime(start);
        const duration = seconds * 1000 + nanoseconds / 1e6;
        
        if (duration > 1000) { // Log apenas se demorar mais de 1 segundo
          logger.warn('Requisição lenta detectada', {
            requestId: req.requestId,
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
  }

  /**
   * Middleware para log de rate limiting
   */
  static rateLimitLogger() {
    return (req, res, next) => {
      const rateLimitRemaining = res.get('X-Rate-Limit-Remaining');
      const rateLimitReset = res.get('X-Rate-Limit-Reset');
      
      if (rateLimitRemaining && parseInt(rateLimitRemaining) < 10) {
        logger.warn('Rate limit próximo do limite', {
          requestId: req.requestId,
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
  }

  /**
   * Middleware para validação de JSON
   */
  static jsonValidator() {
    return (req, res, next) => {
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        if (req.get('Content-Type') && !req.get('Content-Type').includes('application/json')) {
          return res.status(400).json({
            status: 'error',
            type_error: 'VALIDATION_ERROR',
            message: 'Content-Type deve ser application/json',
          });
        }
      }
      next();
    };
  }

  /**
   * Middleware para compressão (se disponível)
   */
  static compression() {
    try {
      const compression = require('compression');
      return compression({
        filter: (req, res) => {
          if (req.headers['x-no-compression']) {
            return false;
          }
          return compression.filter(req, res);
        },
        level: 6,
        threshold: 1024,
      });
    } catch (error) {
      logger.warn('Compression middleware não disponível');
      return (req, res, next) => next();
    }
  }

  /**
   * Middleware para CORS customizado
   */
  static customCors() {
    return (req, res, next) => {
      // Adicionar headers CORS customizados
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400');
      
      // Responder a requisições OPTIONS
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }
      
      next();
    };
  }

  /**
   * Middleware para adicionar informações da API
   */
  static apiInfo() {
    return (req, res, next) => {
      res.set('X-API-Name', 'Green Amigo Medium Challenge API');
      res.set('X-API-Version', '1.0.0');
      res.set('X-API-Environment', process.env.NODE_ENV || 'development');
      next();
    };
  }

  /**
   * Middleware para log de erros
   */
  static errorLogger() {
    return (err, req, res, next) => {
      logger.error('Erro capturado pelo middleware', {
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

      next(err);
    };
  }

  /**
   * Middleware para health check
   */
  static healthCheck() {
    return (req, res, next) => {
      if (req.url === '/health' || req.url === '/api/health') {
        return res.status(200).json({
          status: 'success',
          message: 'API está funcionando',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: process.env.NODE_ENV || 'development',
          requestId: req.requestId,
        });
      }
      next();
    };
  }
}

module.exports = MiddlewareConfig;

