const UserRepository = require('./UserRepository');
const AuthUtils = require('../../utils/AuthUtils');
const logger = require('../../config/logger');

class UserService {
  /**
   * Cria um novo usuário
   * @param {Object} userData - Dados do usuário
   * @returns {Promise<Object>} Usuário criado
   */
  static async createUser(userData) {
    try {
      const { name, email, password } = userData;

      // Verificar se o email já existe
      const existingUser = await UserRepository.findByEmail(email);
      if (existingUser) {
        throw new Error('Email já está em uso');
      }

      // Validar força da senha
      const passwordValidation = AuthUtils.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw new Error(`Senha inválida: ${passwordValidation.feedback.join(', ')}`);
      }

      // Criar usuário
      const user = await UserRepository.create({
        name,
        email,
        password, // O hook do modelo vai criptografar
      });

      logger.info('Usuário criado com sucesso', {
        userId: user.id,
        email: user.email,
        name: user.name,
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
   * Autentica um usuário
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @returns {Promise<Object>} Dados do usuário e token
   */
  static async authenticateUser(email, password) {
    try {
      // Buscar usuário com senha
      const user = await UserRepository.findByEmail(email, {
        includePassword: true,
      });

      if (!user) {
        throw new Error('Credenciais inválidas');
      }

      // Verificar senha
      const isPasswordValid = await user.checkPassword(password);
      if (!isPasswordValid) {
        throw new Error('Credenciais inválidas');
      }

      // Gerar token
      const payload = AuthUtils.generatePayload(user);
      const token = AuthUtils.generateToken(payload);

      logger.info('Usuário autenticado com sucesso', {
        userId: user.id,
        email: user.email,
      });

      return {
        user: user.toJSON(),
        token,
      };
    } catch (error) {
      logger.warn('Falha na autenticação:', {
        error: error.message,
        email,
      });
      throw error;
    }
  }

  /**
   * Busca um usuário por ID
   * @param {number} id - ID do usuário
   * @returns {Promise<Object>} Usuário encontrado
   */
  static async getUserById(id) {
    try {
      const user = await UserRepository.findById(id);
      
      if (!user) {
        throw new Error('Usuário não encontrado');
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
   * Lista usuários com paginação
   * @param {Object} filters - Filtros de busca
   * @param {Object} pagination - Paginação
   * @returns {Promise<Object>} Lista de usuários
   */
  static async listUsers(filters = {}, pagination = {}) {
    try {
      const result = await UserRepository.findAll(filters, pagination);
      
      logger.debug('Usuários listados com sucesso', {
        total: result.total,
        returned: result.users.length,
        filters,
        pagination,
      });

      return result;
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
   * @returns {Promise<Object>} Usuário atualizado
   */
  static async updateUser(id, updateData) {
    try {
      const { name, email, password } = updateData;

      // Verificar se o usuário existe
      const existingUser = await UserRepository.findById(id);
      if (!existingUser) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar se o email já existe (se estiver sendo alterado)
      if (email && email !== existingUser.email) {
        const emailExists = await UserRepository.emailExists(email, id);
        if (emailExists) {
          throw new Error('Email já está em uso');
        }
      }

      // Validar nova senha (se fornecida)
      if (password) {
        const passwordValidation = AuthUtils.validatePasswordStrength(password);
        if (!passwordValidation.isValid) {
          throw new Error(`Senha inválida: ${passwordValidation.feedback.join(', ')}`);
        }
      }

      // Atualizar usuário
      const updatedUser = await UserRepository.update(id, updateData);
      
      if (!updatedUser) {
        throw new Error('Erro ao atualizar usuário');
      }

      logger.info('Usuário atualizado com sucesso', {
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
  static async deleteUser(id) {
    try {
      // Verificar se o usuário existe
      const existingUser = await UserRepository.findById(id);
      if (!existingUser) {
        throw new Error('Usuário não encontrado');
      }

      // Remover usuário
      const deleted = await UserRepository.delete(id);
      
      if (!deleted) {
        throw new Error('Erro ao remover usuário');
      }

      logger.info('Usuário removido com sucesso', {
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
   * Altera a senha de um usuário
   * @param {number} id - ID do usuário
   * @param {string} currentPassword - Senha atual
   * @param {string} newPassword - Nova senha
   * @returns {Promise<boolean>} True se alterada com sucesso
   */
  static async changePassword(id, currentPassword, newPassword) {
    try {
      // Buscar usuário com senha
      const user = await UserRepository.findByEmail(
        (await UserRepository.findById(id)).email,
        { includePassword: true }
      );

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar senha atual
      const isCurrentPasswordValid = await user.checkPassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('Senha atual incorreta');
      }

      // Validar nova senha
      const passwordValidation = AuthUtils.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(`Nova senha inválida: ${passwordValidation.feedback.join(', ')}`);
      }

      // Verificar se a nova senha é diferente da atual
      if (currentPassword === newPassword) {
        throw new Error('A nova senha deve ser diferente da senha atual');
      }

      // Atualizar senha
      await UserRepository.update(id, { password: newPassword });

      logger.info('Senha alterada com sucesso', {
        userId: id,
      });

      return true;
    } catch (error) {
      logger.error('Erro ao alterar senha:', {
        error: error.message,
        userId: id,
      });
      throw error;
    }
  }

  /**
   * Busca usuário com posts
   * @param {number} id - ID do usuário
   * @param {Object} options - Opções de busca
   * @returns {Promise<Object>} Usuário com posts
   */
  static async getUserWithPosts(id, options = {}) {
    try {
      const user = await UserRepository.findWithPosts(id, options);
      
      if (!user) {
        throw new Error('Usuário não encontrado');
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
  static async countUsers(filters = {}) {
    try {
      const count = await UserRepository.count(filters);
      
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

module.exports = UserService;

