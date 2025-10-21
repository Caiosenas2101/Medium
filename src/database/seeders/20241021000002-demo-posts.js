'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const posts = [
      {
        user_id: 1,
        title: 'Introdução ao Node.js',
        summary: 'Um guia completo para iniciantes em Node.js, cobrindo conceitos fundamentais e práticas recomendadas.',
        content: 'Node.js é uma plataforma de desenvolvimento que permite executar JavaScript no servidor. Neste artigo, vamos explorar os conceitos fundamentais, desde a instalação até a criação de aplicações web robustas. Vamos cobrir módulos, NPM, Express.js e muito mais.',
        available_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 2,
        title: 'Melhores Práticas de Segurança em APIs',
        summary: 'Dicas essenciais para proteger suas APIs REST contra vulnerabilidades comuns.',
        content: 'A segurança em APIs é fundamental para proteger dados sensíveis. Neste artigo, abordaremos autenticação JWT, validação de entrada, rate limiting, HTTPS, e outras práticas essenciais para manter suas APIs seguras.',
        available_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 1,
        title: 'Post Agendado - Próximas Funcionalidades',
        summary: 'Confira as novas funcionalidades que serão lançadas em breve em nossa plataforma.',
        content: 'Estamos trabalhando em várias melhorias incríveis para nossa plataforma. Em breve, teremos sistema de notificações em tempo real, chat integrado, e muito mais. Fique ligado!',
        available_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias no futuro
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 3,
        title: 'Tutorial de Sequelize ORM',
        summary: 'Aprenda a usar Sequelize para gerenciar bancos de dados de forma eficiente em Node.js.',
        content: 'Sequelize é um ORM poderoso para Node.js que facilita o trabalho com bancos de dados relacionais. Vamos aprender sobre modelos, migrações, associações e consultas avançadas.',
        available_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert('posts', posts, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('posts', null, {});
  },
};

