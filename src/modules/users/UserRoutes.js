const express = require('express');
const UserController = require('./UserController');
const SchemaValidator = require('../../middlewares/SchemaValidator');
const AuthMiddleware = require('../../middlewares/AuthMiddleware');
const { 
  idParamSchema, 
  listUsersQuerySchema, 
  updateUserSchema, 
  changePasswordSchema 
} = require('../../schemas/user.schema');

const router = express.Router();

/**
 * @route GET /users
 * @desc Listar usuários com paginação
 * @access Public
 */
router.get('/users',
  SchemaValidator.validate(listUsersQuerySchema, 'query'),
  UserController.listUsers
);

/**
 * @route GET /users/count
 * @desc Contar número de usuários
 * @access Public
 */
router.get('/users/count',
  UserController.countUsers
);

/**
 * @route GET /users/:id
 * @desc Buscar usuário por ID
 * @access Public
 */
router.get('/users/:id',
  SchemaValidator.validate(idParamSchema, 'params'),
  UserController.getUserById
);

/**
 * @route GET /users/:id/posts
 * @desc Buscar usuário com posts
 * @access Public
 */
router.get('/users/:id/posts',
  SchemaValidator.validate(idParamSchema, 'params'),
  UserController.getUserWithPosts
);

/**
 * @route PUT /users/:id
 * @desc Atualizar usuário
 * @access Private (Admin ou próprio usuário)
 */
router.put('/users/:id',
  AuthMiddleware.isAuthenticated,
  SchemaValidator.validate(idParamSchema, 'params'),
  SchemaValidator.validate(updateUserSchema, 'body'),
  UserController.updateUser
);

/**
 * @route DELETE /users/:id
 * @desc Remover usuário
 * @access Private (Admin ou próprio usuário)
 */
router.delete('/users/:id',
  AuthMiddleware.isAuthenticated,
  SchemaValidator.validate(idParamSchema, 'params'),
  UserController.deleteUser
);

module.exports = router;

