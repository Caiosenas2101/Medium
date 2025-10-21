const express = require('express');
const PostController = require('./PostController');
const LikeController = require('./LikeController');
const SchemaValidator = require('../../middlewares/SchemaValidator');
const AuthMiddleware = require('../../middlewares/AuthMiddleware');
const { 
  createPostSchema, 
  updatePostSchema, 
  postIdParamSchema, 
  listPostsQuerySchema,
  schedulePostSchema,
  likePostIdParamSchema,
  listLikesQuerySchema,
  userLikesQuerySchema,
  postLikesQuerySchema
} = require('../../schemas');

const router = express.Router();

// ==================== POST ROUTES ====================

/**
 * @route GET /posts
 * @desc Listar posts com paginação
 * @access Public
 */
router.get('/posts',
  SchemaValidator.validate(listPostsQuerySchema, 'query'),
  PostController.listPosts
);

/**
 * @route GET /posts/count
 * @desc Contar número de posts
 * @access Public
 */
router.get('/posts/count',
  PostController.countPosts
);

/**
 * @route GET /posts/most-liked
 * @desc Listar posts mais curtidos
 * @access Public
 */
router.get('/posts/most-liked',
  LikeController.getMostLikedPosts
);

/**
 * @route GET /posts/:id
 * @desc Buscar post por ID
 * @access Public
 */
router.get('/posts/:id',
  SchemaValidator.validate(postIdParamSchema, 'params'),
  PostController.getPostById
);

/**
 * @route POST /posts
 * @desc Criar novo post
 * @access Private
 */
router.post('/posts',
  AuthMiddleware.isAuthenticated,
  SchemaValidator.validate(createPostSchema, 'body'),
  PostController.createPost
);

/**
 * @route PUT /posts/:id
 * @desc Atualizar post
 * @access Private (Apenas autor)
 */
router.put('/posts/:id',
  AuthMiddleware.isAuthenticated,
  SchemaValidator.validate(postIdParamSchema, 'params'),
  SchemaValidator.validate(updatePostSchema, 'body'),
  PostController.updatePost
);

/**
 * @route DELETE /posts/:id
 * @desc Remover post
 * @access Private (Apenas autor)
 */
router.delete('/posts/:id',
  AuthMiddleware.isAuthenticated,
  SchemaValidator.validate(postIdParamSchema, 'params'),
  PostController.deletePost
);

/**
 * @route PUT /posts/:id/schedule
 * @desc Agendar post
 * @access Private (Apenas autor)
 */
router.put('/posts/:id/schedule',
  AuthMiddleware.isAuthenticated,
  SchemaValidator.validate(postIdParamSchema, 'params'),
  SchemaValidator.validate(schedulePostSchema, 'body'),
  PostController.schedulePost
);

// ==================== LIKE ROUTES ====================

/**
 * @route POST /posts/:id/like
 * @desc Toggle like em post
 * @access Private
 */
router.post('/posts/:id/like',
  AuthMiddleware.isAuthenticated,
  SchemaValidator.validate(likePostIdParamSchema, 'params'),
  LikeController.toggleLike
);

/**
 * @route GET /posts/:id/likes
 * @desc Listar likes de um post
 * @access Public
 */
router.get('/posts/:id/likes',
  SchemaValidator.validate(likePostIdParamSchema, 'params'),
  SchemaValidator.validate(listLikesQuerySchema, 'query'),
  LikeController.getPostLikes
);

/**
 * @route GET /posts/:id/likes/count
 * @desc Contar likes de um post
 * @access Public
 */
router.get('/posts/:id/likes/count',
  SchemaValidator.validate(likePostIdParamSchema, 'params'),
  LikeController.countPostLikes
);

/**
 * @route GET /posts/:id/liked
 * @desc Verificar se usuário curtiu o post
 * @access Private
 */
router.get('/posts/:id/liked',
  AuthMiddleware.isAuthenticated,
  SchemaValidator.validate(likePostIdParamSchema, 'params'),
  LikeController.hasUserLiked
);

// ==================== USER POST ROUTES ====================

/**
 * @route GET /users/:id/posts
 * @desc Listar posts de um usuário
 * @access Public
 */
router.get('/users/:id/posts',
  SchemaValidator.validate({ id: require('../../schemas/user.schema').idParamSchema.fields.id }, 'params'),
  SchemaValidator.validate(listPostsQuerySchema, 'query'),
  PostController.getUserPosts
);

// ==================== USER LIKE ROUTES ====================

/**
 * @route GET /users/:id/likes
 * @desc Listar likes de um usuário
 * @access Public
 */
router.get('/users/:id/likes',
  SchemaValidator.validate({ id: require('../../schemas/user.schema').idParamSchema.fields.id }, 'params'),
  SchemaValidator.validate(userLikesQuerySchema, 'query'),
  LikeController.getUserLikes
);

/**
 * @route GET /users/:id/likes/count
 * @desc Contar likes de um usuário
 * @access Public
 */
router.get('/users/:id/likes/count',
  SchemaValidator.validate({ id: require('../../schemas/user.schema').idParamSchema.fields.id }, 'params'),
  LikeController.countUserLikes
);

// ==================== LIKE MANAGEMENT ROUTES ====================

/**
 * @route DELETE /likes/:id
 * @desc Remover like específico
 * @access Private (Apenas dono do like)
 */
router.delete('/likes/:id',
  AuthMiddleware.isAuthenticated,
  SchemaValidator.validate({ id: require('../../schemas/like.schema').likeIdParamSchema.fields.id }, 'params'),
  LikeController.removeLike
);

module.exports = router;

