const { Post, PostLike, User } = require('../../database/models');
const { Op } = require('sequelize');
const logger = require('../../config/logger');

class LikeService {
  /**
   * Toggle de like em um post (cria, ativa ou desativa)
   * @param {number} postId - ID do post
   * @param {number} userId - ID do usuário
   * @returns {Promise<Object>} Resultado do toggle
   */
  static async toggleLike(postId, userId) {
    try {
      // Verificar se o post existe
      const post = await Post.findByPk(postId);
      if (!post) {
        throw new Error('Post não encontrado');
      }

      // Verificar se o usuário existe
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Buscar like existente
      let like = await PostLike.findOne({
        where: {
          post_id: postId,
          user_id: userId,
        },
      });

      let liked = false;
      let totalLikes = 0;

      if (like) {
        // Like existe - fazer toggle
        await like.toggle();
        liked = !like.is_deleted;
        
        logger.info('Like toggled', {
          postId,
          userId,
          liked,
          likeId: like.id,
        });
      } else {
        // Like não existe - criar novo
        like = await PostLike.create({
          post_id: postId,
          user_id: userId,
          liked_at: new Date(),
          is_deleted: false,
        });
        liked = true;
        
        logger.info('Like criado', {
          postId,
          userId,
          likeId: like.id,
        });
      }

      // Contar total de likes ativos
      totalLikes = await PostLike.count({
        where: {
          post_id: postId,
          is_deleted: false,
        },
      });

      logger.info('Toggle de like realizado com sucesso', {
        postId,
        userId,
        liked,
        totalLikes,
      });

      return {
        liked,
        total_likes: totalLikes,
      };
    } catch (error) {
      logger.error('Erro ao fazer toggle de like:', {
        error: error.message,
        postId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Lista likes de um post
   * @param {number} postId - ID do post
   * @param {Object} filters - Filtros de busca
   * @param {Object} pagination - Paginação
   * @returns {Promise<Object>} Lista de likes
   */
  static async getPostLikes(postId, filters = {}, pagination = {}) {
    try {
      const { limit = 20, offset = 0 } = pagination;
      const { include_deleted = false } = filters;

      // Verificar se o post existe
      const post = await Post.findByPk(postId);
      if (!post) {
        throw new Error('Post não encontrado');
      }

      const whereClause = { post_id: postId };

      if (!include_deleted) {
        whereClause.is_deleted = false;
      }

      const { count, rows } = await PostLike.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'name'],
          },
        ],
        limit,
        offset,
        order: [['liked_at', 'DESC']],
      });

      const likes = rows.map(like => ({
        id: like.id,
        user_id: like.user_id,
        post_id: like.post_id,
        liked_at: like.liked_at,
        is_active: !like.is_deleted,
        user: like.User,
      }));

      logger.debug('Likes do post listados com sucesso', {
        postId,
        total: count,
        returned: likes.length,
        filters,
        pagination,
      });

      return {
        likes,
        total: count,
        limit,
        offset,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error('Erro ao listar likes do post:', {
        error: error.message,
        postId,
        filters,
        pagination,
      });
      throw error;
    }
  }

  /**
   * Lista likes de um usuário
   * @param {number} userId - ID do usuário
   * @param {Object} filters - Filtros de busca
   * @param {Object} pagination - Paginação
   * @returns {Promise<Object>} Lista de likes do usuário
   */
  static async getUserLikes(userId, filters = {}, pagination = {}) {
    try {
      const { limit = 20, offset = 0 } = pagination;
      const { include_deleted = false } = filters;

      // Verificar se o usuário existe
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      const whereClause = { user_id: userId };

      if (!include_deleted) {
        whereClause.is_deleted = false;
      }

      const { count, rows } = await PostLike.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Post,
            as: 'Post',
            attributes: ['id', 'title', 'summary', 'available_at'],
            include: [
              {
                model: User,
                as: 'User',
                attributes: ['id', 'name'],
              },
            ],
          },
        ],
        limit,
        offset,
        order: [['liked_at', 'DESC']],
      });

      const likes = rows.map(like => ({
        id: like.id,
        user_id: like.user_id,
        post_id: like.post_id,
        liked_at: like.liked_at,
        is_active: !like.is_deleted,
        post: like.Post,
      }));

      logger.debug('Likes do usuário listados com sucesso', {
        userId,
        total: count,
        returned: likes.length,
        filters,
        pagination,
      });

      return {
        likes,
        total: count,
        limit,
        offset,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error('Erro ao listar likes do usuário:', {
        error: error.message,
        userId,
        filters,
        pagination,
      });
      throw error;
    }
  }

  /**
   * Verifica se um usuário curtiu um post
   * @param {number} postId - ID do post
   * @param {number} userId - ID do usuário
   * @returns {Promise<boolean>} True se o usuário curtiu o post
   */
  static async hasUserLiked(postId, userId) {
    try {
      const like = await PostLike.findOne({
        where: {
          post_id: postId,
          user_id: userId,
          is_deleted: false,
        },
      });

      const hasLiked = !!like;

      logger.debug('Verificação de like realizada', {
        postId,
        userId,
        hasLiked,
      });

      return hasLiked;
    } catch (error) {
      logger.error('Erro ao verificar like do usuário:', {
        error: error.message,
        postId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Conta o número de likes de um post
   * @param {number} postId - ID do post
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<number>} Número de likes
   */
  static async countPostLikes(postId, filters = {}) {
    try {
      const { include_deleted = false } = filters;

      const whereClause = { post_id: postId };

      if (!include_deleted) {
        whereClause.is_deleted = false;
      }

      const count = await PostLike.count({ where: whereClause });

      logger.debug('Contagem de likes do post realizada', {
        postId,
        count,
        filters,
      });

      return count;
    } catch (error) {
      logger.error('Erro ao contar likes do post:', {
        error: error.message,
        postId,
        filters,
      });
      throw error;
    }
  }

  /**
   * Conta o número de likes de um usuário
   * @param {number} userId - ID do usuário
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<number>} Número de likes do usuário
   */
  static async countUserLikes(userId, filters = {}) {
    try {
      const { include_deleted = false } = filters;

      const whereClause = { user_id: userId };

      if (!include_deleted) {
        whereClause.is_deleted = false;
      }

      const count = await PostLike.count({ where: whereClause });

      logger.debug('Contagem de likes do usuário realizada', {
        userId,
        count,
        filters,
      });

      return count;
    } catch (error) {
      logger.error('Erro ao contar likes do usuário:', {
        error: error.message,
        userId,
        filters,
      });
      throw error;
    }
  }

  /**
   * Remove um like específico
   * @param {number} likeId - ID do like
   * @param {number} userId - ID do usuário
   * @returns {Promise<boolean>} True se removido com sucesso
   */
  static async removeLike(likeId, userId) {
    try {
      const like = await PostLike.findOne({
        where: {
          id: likeId,
          user_id: userId,
        },
      });

      if (!like) {
        throw new Error('Like não encontrado ou você não tem permissão para removê-lo');
      }

      await like.update({ is_deleted: true });

      logger.info('Like removido com sucesso', {
        likeId,
        userId,
        postId: like.post_id,
      });

      return true;
    } catch (error) {
      logger.error('Erro ao remover like:', {
        error: error.message,
        likeId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Lista posts mais curtidos
   * @param {Object} filters - Filtros de busca
   * @param {Object} pagination - Paginação
   * @returns {Promise<Object>} Lista de posts mais curtidos
   */
  static async getMostLikedPosts(filters = {}, pagination = {}) {
    try {
      const { limit = 10, offset = 0 } = pagination;
      const { days = 30 } = filters;

      const dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - days);

      const posts = await Post.findAll({
        where: {
          available_at: {
            [Op.lte]: new Date(),
            [Op.gte]: dateFilter,
          },
        },
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
        order: [
          [PostLike, 'id', 'DESC'], // Ordenar por número de likes
        ],
        group: ['Post.id'],
        having: PostLike.sequelize.where(
          PostLike.sequelize.fn('COUNT', PostLike.sequelize.col('PostLikes.id')),
          '>',
          0
        ),
      });

      const postsWithLikes = posts.map(post => {
        const postData = post.toJSON();
        const totalLikes = postData.PostLikes ? postData.PostLikes.length : 0;
        
        return {
          ...postData,
          total_likes: totalLikes,
        };
      });

      logger.debug('Posts mais curtidos listados com sucesso', {
        total: postsWithLikes.length,
        filters,
        pagination,
      });

      return {
        posts: postsWithLikes,
        total: postsWithLikes.length,
        limit,
        offset,
      };
    } catch (error) {
      logger.error('Erro ao listar posts mais curtidos:', {
        error: error.message,
        filters,
        pagination,
      });
      throw error;
    }
  }
}

module.exports = LikeService;

