const { Model, DataTypes } = require('sequelize');

class Post extends Model {
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
        title: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notEmpty: {
              msg: 'Título é obrigatório',
            },
            len: {
              args: [1, 200],
              msg: 'Título deve ter entre 1 e 200 caracteres',
            },
          },
        },
        summary: {
          type: DataTypes.TEXT,
          allowNull: false,
          validate: {
            notEmpty: {
              msg: 'Resumo é obrigatório',
            },
            len: {
              args: [10, 500],
              msg: 'Resumo deve ter entre 10 e 500 caracteres',
            },
          },
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
          validate: {
            notEmpty: {
              msg: 'Conteúdo é obrigatório',
            },
            len: {
              args: [50, 10000],
              msg: 'Conteúdo deve ter entre 50 e 10000 caracteres',
            },
          },
        },
        available_at: {
          type: DataTypes.DATE,
          allowNull: false,
          validate: {
            notEmpty: {
              msg: 'Data de disponibilidade é obrigatória',
            },
            isDate: {
              msg: 'Data de disponibilidade deve ser uma data válida',
            },
          },
        },
        // Campo virtual para total de likes
        total_likes: {
          type: DataTypes.VIRTUAL,
          get() {
            if (this.PostLikes) {
              return this.PostLikes.filter(like => !like.is_deleted).length;
            }
            return 0;
          },
        },
      },
      {
        sequelize,
        modelName: 'Post',
        tableName: 'posts',
        timestamps: true,
        underscored: true,
        defaultScope: {
          // Por padrão, só mostra posts disponíveis
          where: {
            available_at: {
              [sequelize.Sequelize.Op.lte]: sequelize.Sequelize.fn('NOW'),
            },
          },
          order: [['available_at', 'DESC']],
        },
        scopes: {
          // Scope para incluir posts futuros (agendados)
          withScheduled: {
            order: [['available_at', 'DESC']],
          },
          // Scope para posts de um usuário específico
          byUser(userId) {
            return {
              where: { user_id: userId },
              order: [['available_at', 'DESC']],
            };
          },
        },
      }
    );

    return this;
  }

  // Método para verificar se o post está disponível
  isAvailable() {
    return new Date(this.available_at) <= new Date();
  }

  // Método para verificar se o usuário pode editar/remover
  canEdit(userId) {
    return this.user_id === userId;
  }

  // Método para retornar dados públicos
  toPublicJSON() {
    const values = { ...this.get() };
    return {
      id: values.id,
      title: values.title,
      summary: values.summary,
      content: values.content,
      available_at: values.available_at,
      total_likes: values.total_likes,
      author: values.User ? {
        id: values.User.id,
        name: values.User.name,
      } : null,
      created_at: values.created_at,
      updated_at: values.updated_at,
    };
  }

  static associate(models) {
    // Post belongsTo User
    this.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'User',
    });

    // Post hasMany PostLikes
    this.hasMany(models.PostLike, {
      foreignKey: 'post_id',
      as: 'PostLikes',
    });
  }
}

module.exports = Post;

