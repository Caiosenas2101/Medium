const { sequelize, testConnection } = require('../database');
const logger = require('./logger');

/**
 * Configuração de banco de dados
 */
class DatabaseConfig {
  /**
   * Inicializa a conexão com o banco de dados
   */
  static async initialize() {
    try {
      // Testar conexão
      await testConnection();
      
      // Sincronizar modelos (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
        await sequelize.sync({ alter: false });
        logger.info('Modelos sincronizados com sucesso');
      }

      // Configurar hooks de conexão
      this.setupConnectionHooks();

      logger.info('Banco de dados inicializado com sucesso');
    } catch (error) {
      logger.error('Erro ao inicializar banco de dados:', error);
      throw error;
    }
  }

  /**
   * Configura hooks de conexão
   */
  static setupConnectionHooks() {
    // Hook para conexão estabelecida
    sequelize.connectionManager.on('connect', () => {
      logger.info('Conexão com banco de dados estabelecida');
    });

    // Hook para conexão perdida
    sequelize.connectionManager.on('disconnect', () => {
      logger.warn('Conexão com banco de dados perdida');
    });

    // Hook para erro de conexão
    sequelize.connectionManager.on('error', (error) => {
      logger.error('Erro de conexão com banco de dados:', error);
    });

    // Hook para timeout de conexão
    sequelize.connectionManager.on('timeout', () => {
      logger.warn('Timeout de conexão com banco de dados');
    });
  }

  /**
   * Fecha a conexão com o banco de dados
   */
  static async close() {
    try {
      await sequelize.close();
      logger.info('Conexão com banco de dados fechada');
    } catch (error) {
      logger.error('Erro ao fechar conexão com banco de dados:', error);
      throw error;
    }
  }

  /**
   * Verifica o status da conexão
   */
  static async getStatus() {
    try {
      await sequelize.authenticate();
      return {
        status: 'connected',
        message: 'Conexão ativa',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'disconnected',
        message: 'Conexão perdida',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Executa migrações
   */
  static async runMigrations() {
    try {
      const { execSync } = require('child_process');
      execSync('npx sequelize db:migrate', { stdio: 'inherit' });
      logger.info('Migrações executadas com sucesso');
    } catch (error) {
      logger.error('Erro ao executar migrações:', error);
      throw error;
    }
  }

  /**
   * Executa seeders
   */
  static async runSeeders() {
    try {
      const { execSync } = require('child_process');
      execSync('npx sequelize db:seed:all', { stdio: 'inherit' });
      logger.info('Seeders executados com sucesso');
    } catch (error) {
      logger.error('Erro ao executar seeders:', error);
      throw error;
    }
  }

  /**
   * Reseta o banco de dados
   */
  static async reset() {
    try {
      const { execSync } = require('child_process');
      execSync('npx sequelize db:migrate:undo:all', { stdio: 'inherit' });
      execSync('npx sequelize db:migrate', { stdio: 'inherit' });
      execSync('npx sequelize db:seed:all', { stdio: 'inherit' });
      logger.info('Banco de dados resetado com sucesso');
    } catch (error) {
      logger.error('Erro ao resetar banco de dados:', error);
      throw error;
    }
  }

  /**
   * Configura pool de conexões
   */
  static configurePool() {
    const poolConfig = {
      max: parseInt(process.env.DB_POOL_MAX) || 5,
      min: parseInt(process.env.DB_POOL_MIN) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000,
    };

    logger.info('Pool de conexões configurado:', poolConfig);
    return poolConfig;
  }

  /**
   * Monitora a saúde da conexão
   */
  static async healthCheck() {
    try {
      const start = Date.now();
      await sequelize.authenticate();
      const duration = Date.now() - start;

      return {
        status: 'healthy',
        responseTime: `${duration}ms`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

module.exports = DatabaseConfig;