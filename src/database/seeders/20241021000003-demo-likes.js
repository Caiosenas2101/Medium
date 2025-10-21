'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const likes = [
      {
        user_id: 2,
        post_id: 1,
        liked_at: new Date(),
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 3,
        post_id: 1,
        liked_at: new Date(),
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 1,
        post_id: 2,
        liked_at: new Date(),
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 3,
        post_id: 2,
        liked_at: new Date(),
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 1,
        post_id: 4,
        liked_at: new Date(),
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: 2,
        post_id: 4,
        liked_at: new Date(),
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert('post_likes', likes, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('post_likes', null, {});
  },
};

