const { Model, DataTypes } = require('sequelize');

class PostLike extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id',
          },
        },
        post_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'posts',
            key: 'id',
          },
        },
        liked_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        is_deleted: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        sequelize,
        modelName: 'PostLike',
        tableName: 'post_likes',
        timestamps: true,
        underscored: true,
        indexes: [
          {
            unique: true,
            fields: ['user_id', 'post_id'],
            name: 'post_likes_user_post_unique',
          },
        ],
        defaultScope: {
          // Por padrão, só mostra likes ativos
          where: {
            is_deleted: false,
          },
        },
        scopes: {
          // Scope para incluir likes deletados
          withDeleted: {
            where: {},
          },
          // Scope para likes de um usuário específico
          byUser(userId) {
            return {
              where: { user_id: userId },
            };
          },
          // Scope para likes de um post específico
          byPost(postId) {
            return {
              where: { post_id: postId },
            };
          },
        },
      }
    );

    return this;
  }

  // Método para verificar se o like está ativo
  isActive() {
    return !this.is_deleted;
  }

  // Método para ativar/desativar like (toggle)
  toggle() {
    this.is_deleted = !this.is_deleted;
    if (!this.is_deleted) {
      this.liked_at = new Date();
    }
    return this.save();
  }

  // Método para retornar dados públicos
  toPublicJSON() {
    const values = { ...this.get() };
    return {
      id: values.id,
      user_id: values.user_id,
      post_id: values.post_id,
      liked_at: values.liked_at,
      is_active: !values.is_deleted,
    };
  }

  static associate(models) {
    // PostLike belongsTo User
    this.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'User',
    });

    // PostLike belongsTo Post
    this.belongsTo(models.Post, {
      foreignKey: 'post_id',
      as: 'Post',
    });
  }
}

module.exports = PostLike;

