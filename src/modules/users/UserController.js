const UserService = require('./UserService');
const logger = require('../../config/logger');

class UserController {
  /**
   * Lista usuários com paginação
   * GET /users
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async listUsers(req, res) {
    try {
      const filters = req.filter || {};
      const pagination = {
        limit: parseInt(req.query.limit) || 10,
        offset: parseInt(req.query.offset) || 0,
      };

      // Listar usuários
      const result = await UserService.listUsers(filters, pagination);

      logger.debug('Usuários listados via API', {
        total: result.total,
        returned: result.users.length,
        filters,
        pagination,
        ip: req.ip,
      });

      res.status(200).json({
        status: 'success',
        message: 'Usuários listados com sucesso',
        data: {
          users: result.users,
          pagination: {
            total: result.total,
            limit: result.limit,
            offset: result.offset,
            pages: result.pages,
          },
        },
      });
    } catch (error) {
      logger.error('Erro ao listar usuários via API:', {
        error: error.message,
        filters: req.filter,
        pagination: req.query,
        ip: req.ip,
      });

      res.status(500).json({
        status: 'error',
        type_error: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor',
      });
    }
  }

  /**
   * Busca um usuário por ID
   * GET /users/:id
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getUserById(req, res) {
    try {
      const { id } = req.params;

      // Buscar usuário
      const user = await UserService.getUserById(parseInt(id));

      logger.debug('Usuário encontrado via API', {
        userId: id,
        ip: req.ip,
      });

      res.status(200).json({
        status: 'success',
        message: 'Usuário encontrado com sucesso',
        data: {
          user: user.toJSON(),
        },
      });
    } catch (error) {
      logger.error('Erro ao buscar usuário via API:', {
        error: error.message,
        userId: req.params.id,
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
   * Atualiza um usuário
   * PUT /users/:id
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.data;

      // Atualizar usuário
      const updatedUser = await UserService.updateUser(parseInt(id), updateData);

      logger.info('Usuário atualizado via API', {
        userId: id,
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
        userId: req.params.id,
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
   * Remove um usuário
   * DELETE /users/:id
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Remover usuário
      await UserService.deleteUser(parseInt(id));

      logger.info('Usuário removido via API', {
        userId: id,
        ip: req.ip,
      });

      res.status(200).json({
        status: 'success',
        message: 'Usuário removido com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao remover usuário via API:', {
        error: error.message,
        userId: req.params.id,
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
   * Busca usuário com posts
   * GET /users/:id/posts
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getUserWithPosts(req, res) {
    try {
      const { id } = req.params;
      const options = {
        postsOptions: {
          limit: parseInt(req.query.posts_limit) || 10,
          offset: parseInt(req.query.posts_offset) || 0,
        },
      };

      // Buscar usuário com posts
      const user = await UserService.getUserWithPosts(parseInt(id), options);

      logger.debug('Usuário com posts encontrado via API', {
        userId: id,
        postsCount: user.posts?.length || 0,
        ip: req.ip,
      });

      res.status(200).json({
        status: 'success',
        message: 'Usuário com posts encontrado com sucesso',
        data: {
          user: user.toJSON(),
        },
      });
    } catch (error) {
      logger.error('Erro ao buscar usuário com posts via API:', {
        error: error.message,
        userId: req.params.id,
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
   * Conta o número de usuários
   * GET /users/count
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async countUsers(req, res) {
    try {
      const filters = req.filter || {};

      // Contar usuários
      const count = await UserService.countUsers(filters);

      logger.debug('Contagem de usuários realizada via API', {
        count,
        filters,
        ip: req.ip,
      });

      res.status(200).json({
        status: 'success',
        message: 'Contagem de usuários realizada com sucesso',
        data: {
          count,
        },
      });
    } catch (error) {
      logger.error('Erro ao contar usuários via API:', {
        error: error.message,
        filters: req.filter,
        ip: req.ip,
      });

      res.status(500).json({
        status: 'error',
        type_error: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor',
      });
    }
  }
}

module.exports = UserController;

