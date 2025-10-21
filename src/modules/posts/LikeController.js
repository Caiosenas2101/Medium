const LikeService = require('./LikeService');
const logger = require('../../config/logger');

class LikeController {
  /**
   * Toggle de like em um post
   * POST /posts/:id/like
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async toggleLike(req, res) {
    try {
      const { id } = req.params;
      const userId = req.auth.user_id;

      // Fazer toggle do like
      const result = await LikeService.toggleLike(parseInt(id), userId);

      logger.info('Like toggled via API', {
        postId: id,
        userId,
        liked: result.liked,
        totalLikes: result.total_likes,
        ip: req.ip,
      });

      res.status(200).json({
        status: 'success',
        message: result.liked ? 'Post curtido com sucesso' : 'Like removido com sucesso',
        data: result,
      });
    } catch (error) {
      logger.error('Erro ao fazer toggle de like via API:', {
        error: error.message,
        postId: req.params.id,
        userId: req.auth?.user_id,
        ip: req.ip,
      });

      if (error.message === 'Post não encontrado') {
        return res.status(404).json({
          status: 'error',
          type_error: 'NOT_FOUND',
          message: 'Post não encontrado',
        });
      }

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
   * Lista likes de um post
   * GET /posts/:id/likes
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getPostLikes(req, res) {
    try {
      const { id } = req.params;
      const filters = req.filter || {};
      const pagination = {
        limit: parseInt(req.query.limit) || 20,
        offset: parseInt(req.query.offset) || 0,
      };

      // Listar likes do post
      const result = await LikeService.getPostLikes(parseInt(id), filters, pagination);

      logger.debug('Likes do post listados via API', {
        postId: id,
        total: result.total,
        returned: result.likes.length,
        filters,
        pagination,
        ip: req.ip,
      });

      res.status(200).json({
        status: 'success',
        message: 'Likes do post listados com sucesso',
        data: {
          likes: result.likes,
          pagination: {
            total: result.total,
            limit: result.limit,
            offset: result.offset,
            pages: result.pages,
          },
        },
      });
    } catch (error) {
      logger.error('Erro ao listar likes do post via API:', {
        error: error.message,
        postId: req.params.id,
        filters: req.filter,
        pagination: req.query,
        ip: req.ip,
      });

      if (error.message === 'Post não encontrado') {
        return res.status(404).json({
          status: 'error',
          type_error: 'NOT_FOUND',
          message: 'Post não encontrado',
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
   * Lista likes de um usuário
   * GET /users/:id/likes
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getUserLikes(req, res) {
    try {
      const { id } = req.params;
      const filters = req.filter || {};
      const pagination = {
        limit: parseInt(req.query.limit) || 20,
        offset: parseInt(req.query.offset) || 0,
      };

      // Listar likes do usuário
      const result = await LikeService.getUserLikes(parseInt(id), filters, pagination);

      logger.debug('Likes do usuário listados via API', {
        userId: id,
        total: result.total,
        returned: result.likes.length,
        filters,
        pagination,
        ip: req.ip,
      });

      res.status(200).json({
        status: 'success',
        message: 'Likes do usuário listados com sucesso',
        data: {
          likes: result.likes,
          pagination: {
            total: result.total,
            limit: result.limit,
            offset: result.offset,
            pages: result.pages,
          },
        },
      });
    } catch (error) {
      logger.error('Erro ao listar likes do usuário via API:', {
        error: error.message,
        userId: req.params.id,
        filters: req.filter,
        pagination: req.query,
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
   * Verifica se um usuário curtiu um post
   * GET /posts/:id/liked
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async hasUserLiked(req, res) {
    try {
      const { id } = req.params;
      const userId = req.auth.user_id;

      // Verificar se usuário curtiu o post
      const hasLiked = await LikeService.hasUserLiked(parseInt(id), userId);

      logger.debug('Verificação de like realizada via API', {
        postId: id,
        userId,
        hasLiked,
        ip: req.ip,
      });

      res.status(200).json({
        status: 'success',
        message: 'Verificação de like realizada com sucesso',
        data: {
          liked: hasLiked,
        },
      });
    } catch (error) {
      logger.error('Erro ao verificar like via API:', {
        error: error.message,
        postId: req.params.id,
        userId: req.auth?.user_id,
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
   * Conta o número de likes de um post
   * GET /posts/:id/likes/count
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async countPostLikes(req, res) {
    try {
      const { id } = req.params;
      const filters = req.filter || {};

      // Contar likes do post
      const count = await LikeService.countPostLikes(parseInt(id), filters);

      logger.debug('Contagem de likes do post realizada via API', {
        postId: id,
        count,
        filters,
        ip: req.ip,
      });

      res.status(200).json({
        status: 'success',
        message: 'Contagem de likes realizada com sucesso',
        data: {
          count,
        },
      });
    } catch (error) {
      logger.error('Erro ao contar likes do post via API:', {
        error: error.message,
        postId: req.params.id,
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

  /**
   * Conta o número de likes de um usuário
   * GET /users/:id/likes/count
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async countUserLikes(req, res) {
    try {
      const { id } = req.params;
      const filters = req.filter || {};

      // Contar likes do usuário
      const count = await LikeService.countUserLikes(parseInt(id), filters);

      logger.debug('Contagem de likes do usuário realizada via API', {
        userId: id,
        count,
        filters,
        ip: req.ip,
      });

      res.status(200).json({
        status: 'success',
        message: 'Contagem de likes do usuário realizada com sucesso',
        data: {
          count,
        },
      });
    } catch (error) {
      logger.error('Erro ao contar likes do usuário via API:', {
        error: error.message,
        userId: req.params.id,
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

  /**
   * Remove um like específico
   * DELETE /likes/:id
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async removeLike(req, res) {
    try {
      const { id } = req.params;
      const userId = req.auth.user_id;

      // Remover like
      await LikeService.removeLike(parseInt(id), userId);

      logger.info('Like removido via API', {
        likeId: id,
        userId,
        ip: req.ip,
      });

      res.status(200).json({
        status: 'success',
        message: 'Like removido com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao remover like via API:', {
        error: error.message,
        likeId: req.params.id,
        userId: req.auth?.user_id,
        ip: req.ip,
      });

      if (error.message.includes('não encontrado') || error.message.includes('permissão')) {
        return res.status(404).json({
          status: 'error',
          type_error: 'NOT_FOUND',
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
   * Lista posts mais curtidos
   * GET /posts/most-liked
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getMostLikedPosts(req, res) {
    try {
      const filters = req.filter || {};
      const pagination = {
        limit: parseInt(req.query.limit) || 10,
        offset: parseInt(req.query.offset) || 0,
      };

      // Listar posts mais curtidos
      const result = await LikeService.getMostLikedPosts(filters, pagination);

      logger.debug('Posts mais curtidos listados via API', {
        total: result.total,
        returned: result.posts.length,
        filters,
        pagination,
        ip: req.ip,
      });

      res.status(200).json({
        status: 'success',
        message: 'Posts mais curtidos listados com sucesso',
        data: {
          posts: result.posts,
          pagination: {
            total: result.total,
            limit: result.limit,
            offset: result.offset,
          },
        },
      });
    } catch (error) {
      logger.error('Erro ao listar posts mais curtidos via API:', {
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
}

module.exports = LikeController;

