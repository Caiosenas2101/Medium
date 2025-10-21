'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const users = [
      {
        name: 'João Silva',
        email: 'joao@example.com',
        password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8J8K8K8K8K8', // password: 123456
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Maria Santos',
        email: 'maria@example.com',
        password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8J8K8K8K8K8', // password: 123456
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Pedro Oliveira',
        email: 'pedro@example.com',
        password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8J8K8K8K8K8', // password: 123456
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert('users', users, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  },
};

