const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/jwt');
const logger = require('../config/logger');

class AuthUtils {
  /**
   * Gera um token JWT para um usuário
   * @param {Object} payload - Dados do usuário (id, email, etc.)
   * @param {string} expiresIn - Tempo de expiração (opcional)
   * @returns {string} Token JWT
   */
  static generateToken(payload, expiresIn = null) {
    try {
      const options = {
        expiresIn: expiresIn || config.expiresIn,
      };

      const token = jwt.sign(payload, config.secret, options);
      
      logger.debug('Token JWT gerado com sucesso', {
        userId: payload.id,
        expiresIn: options.expiresIn,
      });

      return token;
    } catch (error) {
      logger.error('Erro ao gerar token JWT:', error);
      throw new Error('Erro interno ao gerar token');
    }
  }

  /**
   * Verifica e decodifica um token JWT
   * @param {string} token - Token JWT
   * @returns {Object} Payload decodificado
   */
  static verifyToken(token) {
    try {
      const decoded = jwt.verify(token, config.secret);
      
      logger.debug('Token JWT verificado com sucesso', {
        userId: decoded.id,
        exp: decoded.exp,
      });

      return decoded;
    } catch (error) {
      logger.warn('Erro ao verificar token JWT:', {
        error: error.message,
        token: token ? 'presente' : 'ausente',
      });

      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expirado');
      }
      
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Token inválido');
      }

      throw new Error('Erro ao verificar token');
    }
  }

  /**
   * Extrai o token do header Authorization
   * @param {string} authHeader - Header Authorization
   * @returns {string|null} Token extraído ou null
   */
  static extractTokenFromHeader(authHeader) {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Criptografa uma senha usando bcrypt
   * @param {string} password - Senha em texto plano
   * @param {number} saltRounds - Número de rounds de salt (padrão: 12)
   * @returns {Promise<string>} Hash da senha
   */
  static async hashPassword(password, saltRounds = 12) {
    try {
      const hash = await bcrypt.hash(password, saltRounds);
      
      logger.debug('Senha criptografada com sucesso', {
        saltRounds,
      });

      return hash;
    } catch (error) {
      logger.error('Erro ao criptografar senha:', error);
      throw new Error('Erro interno ao criptografar senha');
    }
  }

  /**
   * Compara uma senha com seu hash
   * @param {string} password - Senha em texto plano
   * @param {string} hash - Hash da senha
   * @returns {Promise<boolean>} True se a senha confere
   */
  static async comparePassword(password, hash) {
    try {
      const isMatch = await bcrypt.compare(password, hash);
      
      logger.debug('Comparação de senha realizada', {
        match: isMatch,
      });

      return isMatch;
    } catch (error) {
      logger.error('Erro ao comparar senha:', error);
      throw new Error('Erro interno ao verificar senha');
    }
  }

  /**
   * Gera um payload padrão para JWT
   * @param {Object} user - Objeto do usuário
   * @returns {Object} Payload para JWT
   */
  static generatePayload(user) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      iat: Math.floor(Date.now() / 1000),
    };
  }

  /**
   * Verifica se um token está próximo do vencimento
   * @param {string} token - Token JWT
   * @param {number} thresholdMinutes - Minutos antes do vencimento (padrão: 30)
   * @returns {boolean} True se está próximo do vencimento
   */
  static isTokenNearExpiry(token, thresholdMinutes = 30) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) {
        return false;
      }

      const now = Math.floor(Date.now() / 1000);
      const expiryTime = decoded.exp;
      const thresholdSeconds = thresholdMinutes * 60;

      return (expiryTime - now) <= thresholdSeconds;
    } catch (error) {
      logger.warn('Erro ao verificar vencimento do token:', error);
      return false;
    }
  }

  /**
   * Gera um token de refresh (opcional)
   * @param {Object} payload - Dados do usuário
   * @returns {string} Token de refresh
   */
  static generateRefreshToken(payload) {
    try {
      const refreshPayload = {
        ...payload,
        type: 'refresh',
      };

      const token = jwt.sign(refreshPayload, config.secret, {
        expiresIn: '30d', // Refresh token válido por 30 dias
      });

      logger.debug('Token de refresh gerado', {
        userId: payload.id,
      });

      return token;
    } catch (error) {
      logger.error('Erro ao gerar token de refresh:', error);
      throw new Error('Erro interno ao gerar token de refresh');
    }
  }

  /**
   * Valida a força de uma senha
   * @param {string} password - Senha para validar
   * @returns {Object} Resultado da validação
   */
  static validatePasswordStrength(password) {
    const result = {
      isValid: true,
      score: 0,
      feedback: [],
    };

    // Comprimento mínimo
    if (password.length < 6) {
      result.isValid = false;
      result.feedback.push('Senha deve ter pelo menos 6 caracteres');
    } else {
      result.score += 1;
    }

    // Comprimento adequado
    if (password.length >= 8) {
      result.score += 1;
    }

    // Contém letras minúsculas
    if (/[a-z]/.test(password)) {
      result.score += 1;
    } else {
      result.feedback.push('Adicione letras minúsculas');
    }

    // Contém letras maiúsculas
    if (/[A-Z]/.test(password)) {
      result.score += 1;
    } else {
      result.feedback.push('Adicione letras maiúsculas');
    }

    // Contém números
    if (/\d/.test(password)) {
      result.score += 1;
    } else {
      result.feedback.push('Adicione números');
    }

    // Contém caracteres especiais
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      result.score += 1;
    } else {
      result.feedback.push('Adicione caracteres especiais');
    }

    // Senha muito comum
    const commonPasswords = ['123456', 'password', '123456789', '12345678', '12345'];
    if (commonPasswords.includes(password.toLowerCase())) {
      result.isValid = false;
      result.feedback.push('Senha muito comum');
    }

    return result;
  }
}

module.exports = AuthUtils;

