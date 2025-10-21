const yup = require('yup');

// Schema para criação de usuário
const createUserSchema = yup.object().shape({
  name: yup
    .string()
    .required('Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  email: yup
    .string()
    .required('Email é obrigatório')
    .email('Email deve ter um formato válido')
    .lowercase()
    .trim(),
  password: yup
    .string()
    .required('Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(50, 'Senha deve ter no máximo 50 caracteres'),
});

// Schema para login
const loginSchema = yup.object().shape({
  email: yup
    .string()
    .required('Email é obrigatório')
    .email('Email deve ter um formato válido')
    .lowercase()
    .trim(),
  password: yup
    .string()
    .required('Senha é obrigatória')
    .min(1, 'Senha é obrigatória'),
});

// Schema para atualização de usuário
const updateUserSchema = yup.object().shape({
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
  password: yup
    .string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(50, 'Senha deve ter no máximo 50 caracteres'),
}).test('at-least-one-field', 'Pelo menos um campo deve ser fornecido', function (value) {
  return value.name || value.email || value.password;
});

module.exports = {
  createUserSchema,
  loginSchema,
  updateUserSchema,
};

