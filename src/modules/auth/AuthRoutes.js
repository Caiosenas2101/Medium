const express = require('express');
const AuthController = require('./AuthController');
const SchemaValidator = require('../../middlewares/SchemaValidator');
const AuthMiddleware = require('../../middlewares/AuthMiddleware');
const { createUserSchema, loginSchema, updateUserSchema, changePasswordSchema } = require('../../schemas/auth.schema');

const router = express.Router();

/**
 * @route POST /users
 * @desc Criar um novo usuário
 * @access Public
 */
router.post('/users', 
  SchemaValidator.validate(createUserSchema, 'body'),
  AuthController.createUser
);

/**
 * @route POST /login
 * @desc Autenticar usuário
 * @access Public
 */
router.post('/login',
  SchemaValidator.validate(loginSchema, 'body'),
  AuthController.login
);

/**
 * @route GET /me
 * @desc Obter informações do usuário autenticado
 * @access Private
 */
router.get('/me',
  AuthMiddleware.isAuthenticated,
  AuthController.getMe
);

/**
 * @route PUT /me
 * @desc Atualizar informações do usuário autenticado
 * @access Private
 */
router.put('/me',
  AuthMiddleware.isAuthenticated,
  SchemaValidator.validate(updateUserSchema, 'body'),
  AuthController.updateMe
);

/**
 * @route PUT /me/password
 * @desc Alterar senha do usuário autenticado
 * @access Private
 */
router.put('/me/password',
  AuthMiddleware.isAuthenticated,
  SchemaValidator.validate(changePasswordSchema, 'body'),
  AuthController.changePassword
);

/**
 * @route DELETE /me
 * @desc Remover usuário autenticado
 * @access Private
 */
router.delete('/me',
  AuthMiddleware.isAuthenticated,
  AuthController.deleteMe
);

module.exports = router;

