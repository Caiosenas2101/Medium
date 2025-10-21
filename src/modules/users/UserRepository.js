const { User } = require('../../database/models');
const { Op } = require('sequelize');
const logger = require('../../config/logger');

class UserRepository {
  /**
   * Cria um novo usuário
   * @param {Object} userData - Dados do usuário
   * @returns {Promise<Object>} Usuário criado
   */
  static async create(userData) {
    try {
      const user = await User.create(userData);
      
      logger.debug('Usuário criado com sucesso', {
        userId: user.id,
        email: user.email,
      });

      return user;
    } catch (error) {
      logger.error('Erro ao criar usuário:', {
        error: error.message,
        email: userData.email,
      });
      throw error;
    }
  }

  /**
   * Busca um usuário por ID
   * @param {number} id - ID do usuário
   * @param {Object} options - Opções de busca
   * @returns {Promise<Object|null>} Usuário encontrado ou null
   */
  static async findById(id, options = {}) {
    try {
      const user = await User.findByPk(id, {
        attributes: options.includePassword ? undefined : { exclude: ['password_hash'] },
        ...options,
      });

      if (user) {
        logger.debug('Usuário encontrado por ID', {
          userId: id,
          email: user.email,
        });
      }

      return user;
    } catch (error) {
      logger.error('Erro ao buscar usuário por ID:', {
        error: error.message,
        userId: id,
      });
      throw error;
    }
  }

  /**
   * Busca um usuário por email
   * @param {string} email - Email do usuário
   * @param {Object} options - Opções de busca
   * @returns {Promise<Object|null>} Usuário encontrado ou null
   */
  static async findByEmail(email, options = {}) {
    try {
      const user = await User.findOne({
        where: { email },
        attributes: options.includePassword ? undefined : { exclude: ['password_hash'] },
        ...options,
      });

      if (user) {
        logger.debug('Usuário encontrado por email', {
          userId: user.id,
          email: user.email,
        });
      }

      return user;
    } catch (error) {
      logger.error('Erro ao buscar usuário por email:', {
        error: error.message,
        email,
      });
      throw error;
    }
  }

  /**
   * Lista usuários com paginação
   * @param {Object} filters - Filtros de busca
   * @param {Object} pagination - Paginação
   * @returns {Promise<Object>} Lista de usuários e metadados
   */
  static async findAll(filters = {}, pagination = {}) {
    try {
      const { limit = 10, offset = 0 } = pagination;
      const { search, email } = filters;

      const whereClause = {};

      // Filtro por busca textual
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
        ];
      }

      // Filtro por email
      if (email) {
        whereClause.email = { [Op.iLike]: `%${email}%` };
      }

      const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        attributes: { exclude: ['password_hash'] },
        limit,
        offset,
        order: [['created_at', 'DESC']],
      });

      logger.debug('Usuários listados com sucesso', {
        total: count,
        returned: rows.length,
        filters,
        pagination,
      });

      return {
        users: rows,
        total: count,
        limit,
        offset,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error('Erro ao listar usuários:', {
        error: error.message,
        filters,
        pagination,
      });
      throw error;
    }
  }

  /**
   * Atualiza um usuário
   * @param {number} id - ID do usuário
   * @param {Object} updateData - Dados para atualização
   * @returns {Promise<Object|null>} Usuário atualizado ou null
   */
  static async update(id, updateData) {
    try {
      const [affectedRows] = await User.update(updateData, {
        where: { id },
        returning: true,
      });

      if (affectedRows === 0) {
        logger.warn('Usuário não encontrado para atualização', {
          userId: id,
        });
        return null;
      }

      const updatedUser = await User.findByPk(id, {
        attributes: { exclude: ['password_hash'] },
      });

      logger.debug('Usuário atualizado com sucesso', {
        userId: id,
        updatedFields: Object.keys(updateData),
      });

      return updatedUser;
    } catch (error) {
      logger.error('Erro ao atualizar usuário:', {
        error: error.message,
        userId: id,
        updateData,
      });
      throw error;
    }
  }

  /**
   * Remove um usuário
   * @param {number} id - ID do usuário
   * @returns {Promise<boolean>} True se removido com sucesso
   */
  static async delete(id) {
    try {
      const deletedRows = await User.destroy({
        where: { id },
      });

      if (deletedRows === 0) {
        logger.warn('Usuário não encontrado para remoção', {
          userId: id,
        });
        return false;
      }

      logger.debug('Usuário removido com sucesso', {
        userId: id,
      });

      return true;
    } catch (error) {
      logger.error('Erro ao remover usuário:', {
        error: error.message,
        userId: id,
      });
      throw error;
    }
  }

  /**
   * Verifica se um email já existe
   * @param {string} email - Email para verificar
   * @param {number} excludeId - ID do usuário a excluir da verificação
   * @returns {Promise<boolean>} True se o email já existe
   */
  static async emailExists(email, excludeId = null) {
    try {
      const whereClause = { email };
      
      if (excludeId) {
        whereClause.id = { [Op.ne]: excludeId };
      }

      const user = await User.findOne({
        where: whereClause,
        attributes: ['id'],
      });

      const exists = !!user;

      logger.debug('Verificação de email realizada', {
        email,
        exists,
        excludeId,
      });

      return exists;
    } catch (error) {
      logger.error('Erro ao verificar existência do email:', {
        error: error.message,
        email,
        excludeId,
      });
      throw error;
    }
  }

  /**
   * Busca usuários com posts
   * @param {number} id - ID do usuário
   * @param {Object} options - Opções de busca
   * @returns {Promise<Object|null>} Usuário com posts ou null
   */
  static async findWithPosts(id, options = {}) {
    try {
      const user = await User.findByPk(id, {
        attributes: { exclude: ['password_hash'] },
        include: [
          {
            association: 'posts',
            attributes: ['id', 'title', 'summary', 'available_at', 'created_at'],
            order: [['available_at', 'DESC']],
            ...options.postsOptions,
          },
        ],
        ...options,
      });

      if (user) {
        logger.debug('Usuário com posts encontrado', {
          userId: id,
          postsCount: user.posts?.length || 0,
        });
      }

      return user;
    } catch (error) {
      logger.error('Erro ao buscar usuário com posts:', {
        error: error.message,
        userId: id,
      });
      throw error;
    }
  }

  /**
   * Conta o número de usuários
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<number>} Número de usuários
   */
  static async count(filters = {}) {
    try {
      const { search, email } = filters;
      const whereClause = {};

      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (email) {
        whereClause.email = { [Op.iLike]: `%${email}%` };
      }

      const count = await User.count({ where: whereClause });

      logger.debug('Contagem de usuários realizada', {
        count,
        filters,
      });

      return count;
    } catch (error) {
      logger.error('Erro ao contar usuários:', {
        error: error.message,
        filters,
      });
      throw error;
    }
  }
}

module.exports = UserRepository;

