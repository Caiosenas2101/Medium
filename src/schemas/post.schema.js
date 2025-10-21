const yup = require('yup');

// Schema para criação de post
const createPostSchema = yup.object().shape({
  title: yup
    .string()
    .required('Título é obrigatório')
    .min(1, 'Título deve ter pelo menos 1 caractere')
    .max(200, 'Título deve ter no máximo 200 caracteres')
    .trim(),
  summary: yup
    .string()
    .required('Resumo é obrigatório')
    .min(10, 'Resumo deve ter pelo menos 10 caracteres')
    .max(500, 'Resumo deve ter no máximo 500 caracteres')
    .trim(),
  content: yup
    .string()
    .required('Conteúdo é obrigatório')
    .min(50, 'Conteúdo deve ter pelo menos 50 caracteres')
    .max(10000, 'Conteúdo deve ter no máximo 10000 caracteres')
    .trim(),
  available_at: yup
    .date()
    .required('Data de disponibilidade é obrigatória')
    .min(new Date(), 'Data de disponibilidade não pode ser no passado')
    .test('not-too-far', 'Data de disponibilidade não pode ser mais de 1 ano no futuro', function (value) {
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      return value <= oneYearFromNow;
    }),
});

// Schema para atualização de post
const updatePostSchema = yup.object().shape({
  title: yup
    .string()
    .min(1, 'Título deve ter pelo menos 1 caractere')
    .max(200, 'Título deve ter no máximo 200 caracteres')
    .trim(),
  summary: yup
    .string()
    .min(10, 'Resumo deve ter pelo menos 10 caracteres')
    .max(500, 'Resumo deve ter no máximo 500 caracteres')
    .trim(),
  content: yup
    .string()
    .min(50, 'Conteúdo deve ter pelo menos 50 caracteres')
    .max(10000, 'Conteúdo deve ter no máximo 10000 caracteres')
    .trim(),
  available_at: yup
    .date()
    .min(new Date(), 'Data de disponibilidade não pode ser no passado')
    .test('not-too-far', 'Data de disponibilidade não pode ser mais de 1 ano no futuro', function (value) {
      if (!value) return true; // Campo opcional
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      return value <= oneYearFromNow;
    }),
}).test('at-least-one-field', 'Pelo menos um campo deve ser fornecido', function (value) {
  return value.title || value.summary || value.content || value.available_at;
});

// Schema para parâmetros de ID do post
const postIdParamSchema = yup.object().shape({
  id: yup
    .number()
    .required('ID do post é obrigatório')
    .integer('ID do post deve ser um número inteiro')
    .positive('ID do post deve ser um número positivo'),
});

// Schema para query de listagem de posts
const listPostsQuerySchema = yup.object().shape({
  limit: yup
    .number()
    .integer('Limit deve ser um número inteiro')
    .min(1, 'Limit deve ser pelo menos 1')
    .max(50, 'Limit deve ser no máximo 50')
    .default(5),
  offset: yup
    .number()
    .integer('Offset deve ser um número inteiro')
    .min(0, 'Offset deve ser pelo menos 0')
    .default(0),
  include_scheduled: yup
    .boolean()
    .default(false),
  user_id: yup
    .number()
    .integer('User ID deve ser um número inteiro')
    .positive('User ID deve ser um número positivo'),
  search: yup
    .string()
    .trim()
    .max(100, 'Termo de busca deve ter no máximo 100 caracteres'),
});

// Schema para agendamento de post
const schedulePostSchema = yup.object().shape({
  available_at: yup
    .date()
    .required('Data de disponibilidade é obrigatória')
    .min(new Date(), 'Data de disponibilidade não pode ser no passado')
    .test('not-too-far', 'Data de disponibilidade não pode ser mais de 1 ano no futuro', function (value) {
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      return value <= oneYearFromNow;
    }),
});

module.exports = {
  createPostSchema,
  updatePostSchema,
  postIdParamSchema,
  listPostsQuerySchema,
  schedulePostSchema,
};

