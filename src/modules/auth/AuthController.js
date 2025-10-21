const UserService = require('../users/UserService');
const AuthUtils = require('../../utils/AuthUtils');
const logger = require('../../config/logger');

class AuthController {
  /**
   * Cria um novo usuário
   * POST /users
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async createUser(req, res) {
    try {
      const { name, email, password } = req.data;

      // Criar usuário
      const user = await UserService.createUser({
        name,
        email,
        password,
      });

      // Gerar token
      const payload = AuthUtils.generatePayload(user);
      const token = AuthUtils.generateToken(payload);

      logger.info('Usuário criado com sucesso via API', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
      });

      res.status(201).json({
        status: 'success',
        message: 'Usuário criado com sucesso',
        data: {
          user: user.toJSON(),
          token,
        },
      });
    } catch (error) {
      logger.error('Erro ao criar usuário via API:', {
        error: error.message,
        email: req.data?.email,
        ip: req.ip,
      });

      // Tratar erros específicos
      if (error.message === 'Email já está em uso') {
        return res.status(409).json({
          status: 'error',
          type_error: 'CONFLICT_ERROR',
          message: 'Email já está em uso',
        });
      }

      if (error.message.includes('Senha inválida')) {
        return res.status(400).json({
          status: 'error',
          type_error: 'VALIDATION_ERROR',
          message: error.message,
        });
      }

      // Erro genérico
      res.status(500).json({
        status: 'error',
        type_error: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor',
      });
    }
  }

  /**
   * Autentica um usuário
   * POST /login
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async login(req, res) {
    try {
      const { email, password } = req.data;

      // Autenticar usuário
      const result = await UserService.authenticateUser(email, password);

      logger.info('Login realizado com sucesso via API', {
        userId: result.user.id,
        email: result.user.email,
        ip: req.ip,
      });

      res.status(200).json({
        status: 'success',
        message: 'Login realizado com sucesso',
        data: result,
      });
    } catch (error) {
      logger.warn('Falha no login via API:', {
        error: error.message,
        email: req.data?.email,
        ip: req.ip,
      });

      // Tratar erros específicos
      if (error.message === 'Credenciais inválidas') {
        return res.status(401).json({
          status: 'error',
          type_error: 'AUTHENTICATION_ERROR',
          message: 'Email ou senha incorretos',
        });
      }

      // Erro genérico
      res.status(500).json({
        status: 'error',
        type_error: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor',
      });
    }
  }

  /**
   * Obtém informações do usuário autenticado
   * GET /me
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getMe(req, res) {
    try {
      const userId = req.auth.user_id;

      // Buscar usuário
      const user = await UserService.getUserById(userId);

      logger.debug('Informações do usuário obtidas via API', {
        userId,
        ip: req.ip,
      });

      res.status(200).json({
        status: 'success',
        message: 'Informações do usuário obtidas com sucesso',
        data: {
          user: user.toJSON(),
        },
      });
    } catch (error) {
      logger.error('Erro ao obter informações do usuário via API:', {
        error: error.message,
        userId: req.auth?.user_id,
        ip: req.ip,
      });

      if (error.message === 'Usuário não encontrado') {
        return res.status(404).json({
          status: 'error',
          type_error: 'NOT_FOUND',
          message: 'Usuário não encontrado',
        });
      }

      res.status(500).json({
        status: 'error',
        type_error: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor',
      });
    }
  }

  /**
   * Atualiza informações do usuário autenticado
   * PUT /me
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async updateMe(req, res) {
    try {
      const userId = req.auth.user_id;
      const updateData = req.data;

      // Atualizar usuário
      const updatedUser = await UserService.updateUser(userId, updateData);

      logger.info('Usuário atualizado com sucesso via API', {
        userId,
        updatedFields: Object.keys(updateData),
        ip: req.ip,
      });

      res.status(200).json({
        status: 'success',
        message: 'Usuário atualizado com sucesso',
        data: {
          user: updatedUser.toJSON(),
        },
      });
    } catch (error) {
      logger.error('Erro ao atualizar usuário via API:', {
        error: error.message,
        userId: req.auth?.user_id,
        updateData: req.data,
        ip: req.ip,
      });

      if (error.message === 'Usuário não encontrado') {
        return res.status(404).json({
          status: 'error',
          type_error: 'NOT_FOUND',
          message: 'Usuário não encontrado',
        });
      }

      if (error.message === 'Email já está em uso') {
        return res.status(409).json({
          status: 'error',
          type_error: 'CONFLICT_ERROR',
          message: 'Email já está em uso',
        });
      }

      if (error.message.includes('Senha inválida')) {
        return res.status(400).json({
          status: 'error',
          type_error: 'VALIDATION_ERROR',
          message: error.message,
        });
      }

      res.status(500).json({
        status: 'error',
        type_error: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor',
      });
    }
  }

  /**
   * Altera a senha do usuário autenticado
   * PUT /me/password
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async changePassword(req, res) {
    try {
      const userId = req.auth.user_id;
      const { currentPassword, newPassword } = req.data;

      // Alterar senha
      await UserService.changePassword(userId, currentPassword, newPassword);

      logger.info('Senha alterada com sucesso via API', {
        userId,
        ip: req.ip,
      });

      res.status(200).json({
        status: 'success',
        message: 'Senha alterada com sucesso',
      });
    } catch (error) {
      logger.warn('Erro ao alterar senha via API:', {
        error: error.message,
        userId: req.auth?.user_id,
        ip: req.ip,
      });

      if (error.message === 'Usuário não encontrado') {
        return res.status(404).json({
          status: 'error',
          type_error: 'NOT_FOUND',
          message: 'Usuário não encontrado',
        });
      }

      if (error.message === 'Senha atual incorreta') {
        return res.status(400).json({
          status: 'error',
          type_error: 'VALIDATION_ERROR',
          message: 'Senha atual incorreta',
        });
      }

      if (error.message.includes('Nova senha inválida')) {
        return res.status(400).json({
          status: 'error',
          type_error: 'VALIDATION_ERROR',
          message: error.message,
        });
      }

      if (error.message === 'A nova senha deve ser diferente da senha atual') {
        return res.status(400).json({
          status: 'error',
          type_error: 'VALIDATION_ERROR',
          message: error.message,
        });
      }

      res.status(500).json({
        status: 'error',
        type_error: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor',
      });
    }
  }

  /**
   * Remove o usuário autenticado
   * DELETE /me
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async deleteMe(req, res) {
    try {
      const userId = req.auth.user_id;

      // Remover usuário
      await UserService.deleteUser(userId);

      logger.info('Usuário removido com sucesso via API', {
        userId,
        ip: req.ip,
      });

      res.status(200).json({
        status: 'success',
        message: 'Usuário removido com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao remover usuário via API:', {
        error: error.message,
        userId: req.auth?.user_id,
        ip: req.ip,
      });

      if (error.message === 'Usuário não encontrado') {
        return res.status(404).json({
          status: 'error',
          type_error: 'NOT_FOUND',
          message: 'Usuário não encontrado',
        });
      }

      res.status(500).json({
        status: 'error',
        type_error: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor',
      });
    }
  }
}

module.exports = AuthController;

