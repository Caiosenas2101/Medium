const { sequelize } = require('../index');
const User = require('./User.model');
const Post = require('./Post.model');
const PostLike = require('./PostLike.model');

// Initialize models
User.init(sequelize);
Post.init(sequelize);
PostLike.init(sequelize);

// Configure associations
User.associate({ User, Post, PostLike });
Post.associate({ User, Post, PostLike });
PostLike.associate({ User, Post, PostLike });

// Export models and sequelize
module.exports = {
  sequelize,
  User,
  Post,
  PostLike,
};

