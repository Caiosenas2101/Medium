'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('post_likes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      post_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'posts',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      liked_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Add indexes for performance
    await queryInterface.addIndex('post_likes', ['user_id'], {
      name: 'post_likes_user_id_index',
    });

    await queryInterface.addIndex('post_likes', ['post_id'], {
      name: 'post_likes_post_id_index',
    });

    await queryInterface.addIndex('post_likes', ['is_deleted'], {
      name: 'post_likes_is_deleted_index',
    });

    // Unique constraint for user_id + post_id combination
    await queryInterface.addIndex('post_likes', ['user_id', 'post_id'], {
      unique: true,
      name: 'post_likes_user_post_unique',
    });

    // Composite index for efficient queries
    await queryInterface.addIndex('post_likes', ['post_id', 'is_deleted'], {
      name: 'post_likes_post_id_is_deleted_index',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('post_likes');
  },
};

