const PostService = require('./PostService');
const logger = require('../../config/logger');

class PostController {
  /**
   * Lista posts com paginação
   * GET /posts
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async listPosts(req, res) {
    try {
      const filters = req.filter || {};
      const pagination = {
        limit: parseInt(req.query.limit) || 5,
        offset: parseInt(req.query.offset) || 0,
      };

      // Listar posts
      const result = await PostService.listPosts(filters, pagination);

      // Adicionar flags de permissão se usuário estiver autenticado
      const posts = result.posts.map(post => {
        const postData = { ...post };
        
        if (req.auth) {
          postData.allowEdit = post.user_id === req.auth.user_id;
          postData.allowRemove = post.user_id === req.auth.user_id;
        } else {
          postData.allowEdit = false;
          postData.allowRemove = false;
        }

        return postData;
      });

      logger.debug('Posts listados via API', {
        total: result.total,
        returned: posts.length,
        filters,
        pagination,
        authenticated: !!req.auth,
        ip: req.ip,
      });

      res.status(200).json({
        status: 'success',
        message: 'Posts listados com sucesso',
        data: {
          posts,
          pagination: {
            total: result.total,
            limit: result.limit,
            offset: result.offset,
            pages: result.pages,
          },
        },
      });
    } catch (error) {
      logger.error('Erro ao listar posts via API:', {
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
   * Busca um post por ID
   * GET /posts/:id
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getPostById(req, res) {
    try {
      const { id } = req.params;

      // Buscar post
      const post = await PostService.getPostById(parseInt(id));

      // Adicionar flags de permissão se usuário estiver autenticado
      const postData = { ...post };
      
      if (req.auth) {
        postData.allowEdit = post.user_id === req.auth.user_id;
        postData.allowRemove = post.user_id === req.auth.user_id;
      } else {
        postData.allowEdit = false;
        postData.allowRemove = false;
      }

      logger.debug('Post encontrado via API', {
        postId: id,
        authenticated: !!req.auth,
        ip: req.ip,
      });

      res.status(200).json({
        status: 'success',
        message: 'Post encontrado com sucesso',
        data: {
          post: postData,
        },
      });
    } catch (error) {
      logger.error('Erro ao buscar post via API:', {
        error: error.message,
        postId: req.params.id,
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
   * Cria um novo post
   * POST /posts
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async createPost(req, res) {
    try {
      const postData = req.data;
      const userId = req.auth.user_id;

      // Criar post
      const post = await PostService.createPost(postData, userId);

      logger.info('Post criado via API', {
        postId: post.id,
        userId,
        title: post.title,
        availableAt: post.available_at,
        ip: req.ip,
      });

      res.status(201).json({
        status: 'success',
        message: 'Post criado com sucesso',
        data: {
          post: post.toJSON(),
        },
      });
    } catch (error) {
      logger.error('Erro ao criar post via API:', {
        error: error.message,
        userId: req.auth?.user_id,
        postData: req.data,
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
   * Atualiza um post
   * PUT /posts/:id
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async updatePost(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.data;
      const userId = req.auth.user_id;

      // Atualizar post
      const updatedPost = await PostService.updatePost(parseInt(id), updateData, userId);

      logger.info('Post atualizado via API', {
        postId: id,
        userId,
        updatedFields: Object.keys(updateData),
        ip: req.ip,
      });

      res.status(200).json({
        status: 'success',
        message: 'Post atualizado com sucesso',
        data: {
          post: updatedPost.toJSON(),
        },
      });
    } catch (error) {
      logger.error('Erro ao atualizar post via API:', {
        error: error.message,
        postId: req.params.id,
        userId: req.auth?.user_id,
        updateData: req.data,
        ip: req.ip,
      });

      if (error.message === 'Post não encontrado') {
        return res.status(404).json({
          status: 'error',
          type_error: 'NOT_FOUND',
          message: 'Post não encontrado',
        });
      }

      if (error.message.includes('Acesso negado')) {
        return res.status(403).json({
          status: 'error',
          type_error: 'AUTHORIZATION_ERROR',
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
   * Remove um post
   * DELETE /posts/:id
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async deletePost(req, res) {
    try {
      const { id } = req.params;
      const userId = req.auth.user_id;

      // Remover post
      await PostService.deletePost(parseInt(id), userId);

      logger.info('Post removido via API', {
        postId: id,
        userId,
        ip: req.ip,
      });

      res.status(200).json({
        status: 'success',
        message: 'Post removido com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao remover post via API:', {
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

      if (error.message.includes('Acesso negado')) {
        return res.status(403).json({
          status: 'error',
          type_error: 'AUTHORIZATION_ERROR',
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
   * Lista posts de um usuário específico
   * GET /users/:id/posts
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getUserPosts(req, res) {
    try {
      const { id } = req.params;
      const filters = req.filter || {};
      const pagination = {
        limit: parseInt(req.query.limit) || 10,
        offset: parseInt(req.query.offset) || 0,
      };

      // Listar posts do usuário
      const result = await PostService.getUserPosts(parseInt(id), filters, pagination);

      logger.debug('Posts do usuário listados via API', {
        userId: id,
        total: result.total,
        returned: result.posts.length,
        filters,
        pagination,
        ip: req.ip,
      });

      res.status(200).json({
        status: 'success',
        message: 'Posts do usuário listados com sucesso',
        data: {
          posts: result.posts,
          pagination: {
            total: result.total,
            limit: result.limit,
            offset: result.offset,
            pages: result.pages,
          },
        },
      });
    } catch (error) {
      logger.error('Erro ao listar posts do usuário via API:', {
        error: error.message,
        userId: req.params.id,
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
   * Agenda um post para o futuro
   * PUT /posts/:id/schedule
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async schedulePost(req, res) {
    try {
      const { id } = req.params;
      const { available_at } = req.data;
      const userId = req.auth.user_id;

      // Agendar post
      const scheduledPost = await PostService.schedulePost(parseInt(id), available_at, userId);

      logger.info('Post agendado via API', {
        postId: id,
        userId,
        availableAt: available_at,
        ip: req.ip,
      });

      res.status(200).json({
        status: 'success',
        message: 'Post agendado com sucesso',
        data: {
          post: scheduledPost.toJSON(),
        },
      });
    } catch (error) {
      logger.error('Erro ao agendar post via API:', {
        error: error.message,
        postId: req.params.id,
        userId: req.auth?.user_id,
        available_at: req.data?.available_at,
        ip: req.ip,
      });

      if (error.message === 'Post não encontrado') {
        return res.status(404).json({
          status: 'error',
          type_error: 'NOT_FOUND',
          message: 'Post não encontrado',
        });
      }

      if (error.message.includes('Acesso negado')) {
        return res.status(403).json({
          status: 'error',
          type_error: 'AUTHORIZATION_ERROR',
          message: error.message,
        });
      }

      if (error.message === 'Data de disponibilidade deve ser no futuro') {
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
   * Conta o número de posts
   * GET /posts/count
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async countPosts(req, res) {
    try {
      const filters = req.filter || {};

      // Contar posts
      const count = await PostService.countPosts(filters);

      logger.debug('Contagem de posts realizada via API', {
        count,
        filters,
        ip: req.ip,
      });

      res.status(200).json({
        status: 'success',
        message: 'Contagem de posts realizada com sucesso',
        data: {
          count,
        },
      });
    } catch (error) {
      logger.error('Erro ao contar posts via API:', {
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

module.exports = PostController;

