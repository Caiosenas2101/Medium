const yup = require('yup');

// Schema para parâmetros de ID do post para like
const likePostIdParamSchema = yup.object().shape({
  id: yup
    .number()
    .required('ID do post é obrigatório')
    .integer('ID do post deve ser um número inteiro')
    .positive('ID do post deve ser um número positivo'),
});

// Schema para query de listagem de likes
const listLikesQuerySchema = yup.object().shape({
  limit: yup
    .number()
    .integer('Limit deve ser um número inteiro')
    .min(1, 'Limit deve ser pelo menos 1')
    .max(100, 'Limit deve ser no máximo 100')
    .default(20),
  offset: yup
    .number()
    .integer('Offset deve ser um número inteiro')
    .min(0, 'Offset deve ser pelo menos 0')
    .default(0),
  post_id: yup
    .number()
    .integer('Post ID deve ser um número inteiro')
    .positive('Post ID deve ser um número positivo'),
  user_id: yup
    .number()
    .integer('User ID deve ser um número inteiro')
    .positive('User ID deve ser um número positivo'),
  include_deleted: yup
    .boolean()
    .default(false),
});

// Schema para parâmetros de ID do like
const likeIdParamSchema = yup.object().shape({
  id: yup
    .number()
    .required('ID do like é obrigatório')
    .integer('ID do like deve ser um número inteiro')
    .positive('ID do like deve ser um número positivo'),
});

// Schema para query de likes de um usuário
const userLikesQuerySchema = yup.object().shape({
  limit: yup
    .number()
    .integer('Limit deve ser um número inteiro')
    .min(1, 'Limit deve ser pelo menos 1')
    .max(100, 'Limit deve ser no máximo 100')
    .default(20),
  offset: yup
    .number()
    .integer('Offset deve ser um número inteiro')
    .min(0, 'Offset deve ser pelo menos 0')
    .default(0),
  include_deleted: yup
    .boolean()
    .default(false),
});

// Schema para query de likes de um post
const postLikesQuerySchema = yup.object().shape({
  limit: yup
    .number()
    .integer('Limit deve ser um número inteiro')
    .min(1, 'Limit deve ser pelo menos 1')
    .max(100, 'Limit deve ser no máximo 100')
    .default(20),
  offset: yup
    .number()
    .integer('Offset deve ser um número inteiro')
    .min(0, 'Offset deve ser pelo menos 0')
    .default(0),
  include_deleted: yup
    .boolean()
    .default(false),
});

module.exports = {
  likePostIdParamSchema,
  listLikesQuerySchema,
  likeIdParamSchema,
  userLikesQuerySchema,
  postLikesQuerySchema,
};

