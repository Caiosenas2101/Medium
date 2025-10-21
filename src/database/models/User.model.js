const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

class User extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notEmpty: {
              msg: 'Nome é obrigatório',
            },
            len: {
              args: [2, 100],
              msg: 'Nome deve ter entre 2 e 100 caracteres',
            },
          },
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
            isEmail: {
              msg: 'Email deve ter um formato válido',
            },
            notEmpty: {
              msg: 'Email é obrigatório',
            },
          },
        },
        password_hash: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        password: {
          type: DataTypes.VIRTUAL,
          validate: {
            len: {
              args: [6, 50],
              msg: 'Senha deve ter entre 6 e 50 caracteres',
            },
          },
        },
      },
      {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        timestamps: true,
        underscored: true,
        hooks: {
          beforeSave: async (user) => {
            if (user.password) {
              const saltRounds = 12;
              user.password_hash = await bcrypt.hash(user.password, saltRounds);
            }
          },
        },
      }
    );

    return this;
  }

  // Método para verificar senha
  async checkPassword(plainPassword) {
    return bcrypt.compare(plainPassword, this.password_hash);
  }

  // Método para retornar dados seguros (sem password_hash)
  toJSON() {
    const values = { ...this.get() };
    delete values.password_hash;
    delete values.password;
    return values;
  }

  static associate(models) {
    // User hasMany Posts
    this.hasMany(models.Post, {
      foreignKey: 'user_id',
      as: 'posts',
    });

    // User hasMany PostLikes
    this.hasMany(models.PostLike, {
      foreignKey: 'user_id',
      as: 'likes',
    });
  }
}

module.exports = User;

