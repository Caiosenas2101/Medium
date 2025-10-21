const { Post, User, PostLike } = require('../../database/models');
const { Op } = require('sequelize');
const logger = require('../../config/logger');

class PostService {
  /**
   * Cria um novo post
   * @param {Object} postData - Dados do post
   * @param {number} userId - ID do usuário
   * @returns {Promise<Object>} Post criado
   */
  static async createPost(postData, userId) {
    try {
      const { title, summary, content, available_at } = postData;

      // Verificar se o usuário existe
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Criar post
      const post = await Post.create({
        title,
        summary,
        content,
        available_at,
        user_id: userId,
      });

      logger.info('Post criado com sucesso', {
        postId: post.id,
        userId,
        title: post.title,
        availableAt: post.available_at,
      });

      return post;
    } catch (error) {
      logger.error('Erro ao criar post:', {
        error: error.message,
        userId,
        postData,
      });
      throw error;
    }
  }

  /**
   * Lista posts com paginação e filtros
   * @param {Object} filters - Filtros de busca
   * @param {Object} pagination - Paginação
   * @returns {Promise<Object>} Lista de posts
   */
  static async listPosts(filters = {}, pagination = {}) {
    try {
      const { limit = 5, offset = 0 } = pagination;
      const { include_scheduled = false, user_id, search } = filters;

      const whereClause = {};

      // Filtro por disponibilidade (posts agendados)
      if (!include_scheduled) {
        whereClause.available_at = {
          [Op.lte]: new Date(),
        };
      }

      // Filtro por usuário
      if (user_id) {
        whereClause.user_id = user_id;
      }

      // Filtro por busca textual
      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { summary: { [Op.iLike]: `%${search}%` } },
          { content: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows } = await Post.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'name'],
          },
          {
            model: PostLike,
            as: 'PostLikes',
            where: { is_deleted: false },
            required: false,
            attributes: ['id'],
          },
        ],
        limit,
        offset,
        order: [['available_at', 'DESC']],
        distinct: true, // Para contar corretamente com includes
      });

      // Adicionar flags de permissão e total de likes
      const posts = rows.map(post => {
        const postData = post.toJSON();
        const totalLikes = postData.PostLikes ? postData.PostLikes.length : 0;
        
        return {
          ...postData,
          total_likes: totalLikes,
          allowEdit: false, // Será definido pelo controller
          allowRemove: false, // Será definido pelo controller
        };
      });

      logger.debug('Posts listados com sucesso', {
        total: count,
        returned: posts.length,
        filters,
        pagination,
      });

      return {
        posts,
        total: count,
        limit,
        offset,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error('Erro ao listar posts:', {
        error: error.message,
        filters,
        pagination,
      });
      throw error;
    }
  }

  /**
   * Busca um post por ID
   * @param {number} id - ID do post
   * @param {Object} options - Opções de busca
   * @returns {Promise<Object>} Post encontrado
   */
  static async getPostById(id, options = {}) {
    try {
      const post = await Post.findByPk(id, {
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'name'],
          },
          {
            model: PostLike,
            as: 'PostLikes',
            where: { is_deleted: false },
            required: false,
            attributes: ['id'],
          },
        ],
        ...options,
      });

      if (!post) {
        throw new Error('Post não encontrado');
      }

      const postData = post.toJSON();
      const totalLikes = postData.PostLikes ? postData.PostLikes.length : 0;

      return {
        ...postData,
        total_likes: totalLikes,
      };
    } catch (error) {
      logger.error('Erro ao buscar post por ID:', {
        error: error.message,
        postId: id,
      });
      throw error;
    }
  }

  /**
   * Atualiza um post
   * @param {number} id - ID do post
   * @param {Object} updateData - Dados para atualização
   * @param {number} userId - ID do usuário
   * @returns {Promise<Object>} Post atualizado
   */
  static async updatePost(id, updateData, userId) {
    try {
      // Buscar post
      const post = await Post.findByPk(id);
      if (!post) {
        throw new Error('Post não encontrado');
      }

      // Verificar se o usuário é o autor
      if (post.user_id !== userId) {
        throw new Error('Acesso negado. Você não tem permissão para editar este post');
      }

      // Atualizar post
      await Post.update(updateData, {
        where: { id },
      });

      // Buscar post atualizado
      const updatedPost = await Post.findByPk(id, {
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'name'],
          },
        ],
      });

      logger.info('Post atualizado com sucesso', {
        postId: id,
        userId,
        updatedFields: Object.keys(updateData),
      });

      return updatedPost;
    } catch (error) {
      logger.error('Erro ao atualizar post:', {
        error: error.message,
        postId: id,
        userId,
        updateData,
      });
      throw error;
    }
  }

  /**
   * Remove um post
   * @param {number} id - ID do post
   * @param {number} userId - ID do usuário
   * @returns {Promise<boolean>} True se removido com sucesso
   */
  static async deletePost(id, userId) {
    try {
      // Buscar post
      const post = await Post.findByPk(id);
      if (!post) {
        throw new Error('Post não encontrado');
      }

      // Verificar se o usuário é o autor
      if (post.user_id !== userId) {
        throw new Error('Acesso negado. Você não tem permissão para remover este post');
      }

      // Remover post (cascade vai remover os likes também)
      await Post.destroy({
        where: { id },
      });

      logger.info('Post removido com sucesso', {
        postId: id,
        userId,
      });

      return true;
    } catch (error) {
      logger.error('Erro ao remover post:', {
        error: error.message,
        postId: id,
        userId,
      });
      throw error;
    }
  }

  /**
   * Lista posts de um usuário específico
   * @param {number} userId - ID do usuário
   * @param {Object} filters - Filtros de busca
   * @param {Object} pagination - Paginação
   * @returns {Promise<Object>} Lista de posts do usuário
   */
  static async getUserPosts(userId, filters = {}, pagination = {}) {
    try {
      const { limit = 10, offset = 0 } = pagination;
      const { include_scheduled = false, search } = filters;

      const whereClause = { user_id: userId };

      // Filtro por disponibilidade
      if (!include_scheduled) {
        whereClause.available_at = {
          [Op.lte]: new Date(),
        };
      }

      // Filtro por busca textual
      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { summary: { [Op.iLike]: `%${search}%` } },
          { content: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows } = await Post.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: PostLike,
            as: 'PostLikes',
            where: { is_deleted: false },
            required: false,
            attributes: ['id'],
          },
        ],
        limit,
        offset,
        order: [['available_at', 'DESC']],
        distinct: true,
      });

      const posts = rows.map(post => {
        const postData = post.toJSON();
        const totalLikes = postData.PostLikes ? postData.PostLikes.length : 0;
        
        return {
          ...postData,
          total_likes: totalLikes,
        };
      });

      logger.debug('Posts do usuário listados com sucesso', {
        userId,
        total: count,
        returned: posts.length,
        filters,
        pagination,
      });

      return {
        posts,
        total: count,
        limit,
        offset,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error('Erro ao listar posts do usuário:', {
        error: error.message,
        userId,
        filters,
        pagination,
      });
      throw error;
    }
  }

  /**
   * Agenda um post para o futuro
   * @param {number} id - ID do post
   * @param {Date} available_at - Nova data de disponibilidade
   * @param {number} userId - ID do usuário
   * @returns {Promise<Object>} Post atualizado
   */
  static async schedulePost(id, available_at, userId) {
    try {
      // Buscar post
      const post = await Post.findByPk(id);
      if (!post) {
        throw new Error('Post não encontrado');
      }

      // Verificar se o usuário é o autor
      if (post.user_id !== userId) {
        throw new Error('Acesso negado. Você não tem permissão para agendar este post');
      }

      // Verificar se a data é no futuro
      if (new Date(available_at) <= new Date()) {
        throw new Error('Data de disponibilidade deve ser no futuro');
      }

      // Atualizar data de disponibilidade
      await Post.update({ available_at }, {
        where: { id },
      });

      const updatedPost = await Post.findByPk(id);

      logger.info('Post agendado com sucesso', {
        postId: id,
        userId,
        availableAt: available_at,
      });

      return updatedPost;
    } catch (error) {
      logger.error('Erro ao agendar post:', {
        error: error.message,
        postId: id,
        userId,
        available_at,
      });
      throw error;
    }
  }

  /**
   * Conta o número de posts
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<number>} Número de posts
   */
  static async countPosts(filters = {}) {
    try {
      const { include_scheduled = false, user_id, search } = filters;

      const whereClause = {};

      if (!include_scheduled) {
        whereClause.available_at = {
          [Op.lte]: new Date(),
        };
      }

      if (user_id) {
        whereClause.user_id = user_id;
      }

      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { summary: { [Op.iLike]: `%${search}%` } },
          { content: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const count = await Post.count({ where: whereClause });

      logger.debug('Contagem de posts realizada', {
        count,
        filters,
      });

      return count;
    } catch (error) {
      logger.error('Erro ao contar posts:', {
        error: error.message,
        filters,
      });
      throw error;
    }
  }
}

module.exports = PostService;

