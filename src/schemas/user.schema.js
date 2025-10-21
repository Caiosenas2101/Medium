const yup = require('yup');

// Schema para parâmetros de ID
const idParamSchema = yup.object().shape({
  id: yup
    .number()
    .required('ID é obrigatório')
    .integer('ID deve ser um número inteiro')
    .positive('ID deve ser um número positivo'),
});

// Schema para query de listagem de usuários
const listUsersQuerySchema = yup.object().shape({
  limit: yup
    .number()
    .integer('Limit deve ser um número inteiro')
    .min(1, 'Limit deve ser pelo menos 1')
    .max(100, 'Limit deve ser no máximo 100')
    .default(10),
  offset: yup
    .number()
    .integer('Offset deve ser um número inteiro')
    .min(0, 'Offset deve ser pelo menos 0')
    .default(0),
  search: yup
    .string()
    .trim()
    .max(100, 'Termo de busca deve ter no máximo 100 caracteres'),
});

// Schema para atualização de perfil
const updateProfileSchema = yup.object().shape({
  name: yup
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  email: yup
    .string()
    .email('Email deve ter um formato válido')
    .lowercase()
    .trim(),
  currentPassword: yup
    .string()
    .min(6, 'Senha atual deve ter pelo menos 6 caracteres'),
  newPassword: yup
    .string()
    .min(6, 'Nova senha deve ter pelo menos 6 caracteres')
    .max(50, 'Nova senha deve ter no máximo 50 caracteres'),
}).test('password-change-validation', 'Para alterar a senha, forneça a senha atual e a nova senha', function (value) {
  if (value.newPassword && !value.currentPassword) {
    return this.createError({ message: 'Senha atual é obrigatória para alterar a senha' });
  }
  if (value.currentPassword && !value.newPassword) {
    return this.createError({ message: 'Nova senha é obrigatória para alterar a senha' });
  }
  return true;
});

// Schema para alteração de senha
const changePasswordSchema = yup.object().shape({
  currentPassword: yup
    .string()
    .required('Senha atual é obrigatória')
    .min(6, 'Senha atual deve ter pelo menos 6 caracteres'),
  newPassword: yup
    .string()
    .required('Nova senha é obrigatória')
    .min(6, 'Nova senha deve ter pelo menos 6 caracteres')
    .max(50, 'Nova senha deve ter no máximo 50 caracteres')
    .test('different-password', 'Nova senha deve ser diferente da senha atual', function (value) {
      return value !== this.parent.currentPassword;
    }),
});

module.exports = {
  idParamSchema,
  listUsersQuerySchema,
  updateProfileSchema,
  changePasswordSchema,
};

