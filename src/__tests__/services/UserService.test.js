const UserService = require('../../modules/users/UserService');
const UserRepository = require('../../modules/users/UserRepository');
const AuthUtils = require('../../utils/AuthUtils');

// Mock das dependências
jest.mock('../../modules/users/UserRepository');
jest.mock('../../utils/AuthUtils');
jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('deve criar um usuário com sucesso', async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: '123456',
      };

      const mockUser = {
        id: 1,
        name: 'João Silva',
        email: 'joao@example.com',
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          name: 'João Silva',
          email: 'joao@example.com',
        }),
      };

      UserRepository.findByEmail.mockResolvedValue(null);
      UserRepository.create.mockResolvedValue(mockUser);
      AuthUtils.validatePasswordStrength.mockReturnValue({
        isValid: true,
        score: 5,
        feedback: [],
      });

      const result = await UserService.createUser(userData);

      expect(UserRepository.findByEmail).toHaveBeenCalledWith('joao@example.com');
      expect(UserRepository.create).toHaveBeenCalledWith(userData);
      expect(result).toEqual(mockUser);
    });

    it('deve falhar se email já existe', async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: '123456',
      };

      const existingUser = { id: 1, email: 'joao@example.com' };

      UserRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(UserService.createUser(userData)).rejects.toThrow('Email já está em uso');
    });

    it('deve falhar se senha é inválida', async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: '123',
      };

      AuthUtils.validatePasswordStrength.mockReturnValue({
        isValid: false,
        score: 1,
        feedback: ['Senha deve ter pelo menos 6 caracteres'],
      });

      await expect(UserService.createUser(userData)).rejects.toThrow('Senha inválida');
    });
  });

  describe('authenticateUser', () => {
    it('deve autenticar usuário com credenciais válidas', async () => {
      const email = 'joao@example.com';
      const password = '123456';

      const mockUser = {
        id: 1,
        name: 'João Silva',
        email: 'joao@example.com',
        checkPassword: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          name: 'João Silva',
          email: 'joao@example.com',
        }),
      };

      UserRepository.findByEmail.mockResolvedValue(mockUser);
      AuthUtils.generatePayload.mockReturnValue({
        id: 1,
        email: 'joao@example.com',
        name: 'João Silva',
      });
      AuthUtils.generateToken.mockReturnValue('mock-token');

      const result = await UserService.authenticateUser(email, password);

      expect(UserRepository.findByEmail).toHaveBeenCalledWith(email, { includePassword: true });
      expect(mockUser.checkPassword).toHaveBeenCalledWith(password);
      expect(AuthUtils.generateToken).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
    });

    it('deve falhar se usuário não existe', async () => {
      const email = 'joao@example.com';
      const password = '123456';

      UserRepository.findByEmail.mockResolvedValue(null);

      await expect(UserService.authenticateUser(email, password)).rejects.toThrow('Credenciais inválidas');
    });

    it('deve falhar se senha está incorreta', async () => {
      const email = 'joao@example.com';
      const password = 'wrongpassword';

      const mockUser = {
        id: 1,
        name: 'João Silva',
        email: 'joao@example.com',
        checkPassword: jest.fn().mockResolvedValue(false),
      };

      UserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(UserService.authenticateUser(email, password)).rejects.toThrow('Credenciais inválidas');
    });
  });

  describe('getUserById', () => {
    it('deve retornar usuário se encontrado', async () => {
      const userId = 1;
      const mockUser = {
        id: 1,
        name: 'João Silva',
        email: 'joao@example.com',
      };

      UserRepository.findById.mockResolvedValue(mockUser);

      const result = await UserService.getUserById(userId);

      expect(UserRepository.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('deve falhar se usuário não encontrado', async () => {
      const userId = 999;

      UserRepository.findById.mockResolvedValue(null);

      await expect(UserService.getUserById(userId)).rejects.toThrow('Usuário não encontrado');
    });
  });

  describe('updateUser', () => {
    it('deve atualizar usuário com sucesso', async () => {
      const userId = 1;
      const updateData = {
        name: 'João Silva Atualizado',
        email: 'joao.novo@example.com',
      };

      const existingUser = {
        id: 1,
        name: 'João Silva',
        email: 'joao@example.com',
      };

      const updatedUser = {
        id: 1,
        name: 'João Silva Atualizado',
        email: 'joao.novo@example.com',
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          name: 'João Silva Atualizado',
          email: 'joao.novo@example.com',
        }),
      };

      UserRepository.findById.mockResolvedValue(existingUser);
      UserRepository.emailExists.mockResolvedValue(false);
      UserRepository.update.mockResolvedValue(updatedUser);

      const result = await UserService.updateUser(userId, updateData);

      expect(UserRepository.findById).toHaveBeenCalledWith(userId);
      expect(UserRepository.emailExists).toHaveBeenCalledWith('joao.novo@example.com', userId);
      expect(UserRepository.update).toHaveBeenCalledWith(userId, updateData);
      expect(result).toEqual(updatedUser);
    });

    it('deve falhar se usuário não encontrado', async () => {
      const userId = 999;
      const updateData = { name: 'Novo Nome' };

      UserRepository.findById.mockResolvedValue(null);

      await expect(UserService.updateUser(userId, updateData)).rejects.toThrow('Usuário não encontrado');
    });

    it('deve falhar se email já existe', async () => {
      const userId = 1;
      const updateData = {
        name: 'João Silva',
        email: 'email.existente@example.com',
      };

      const existingUser = {
        id: 1,
        name: 'João Silva',
        email: 'joao@example.com',
      };

      UserRepository.findById.mockResolvedValue(existingUser);
      UserRepository.emailExists.mockResolvedValue(true);

      await expect(UserService.updateUser(userId, updateData)).rejects.toThrow('Email já está em uso');
    });
  });

  describe('deleteUser', () => {
    it('deve remover usuário com sucesso', async () => {
      const userId = 1;
      const existingUser = {
        id: 1,
        name: 'João Silva',
        email: 'joao@example.com',
      };

      UserRepository.findById.mockResolvedValue(existingUser);
      UserRepository.delete.mockResolvedValue(true);

      const result = await UserService.deleteUser(userId);

      expect(UserRepository.findById).toHaveBeenCalledWith(userId);
      expect(UserRepository.delete).toHaveBeenCalledWith(userId);
      expect(result).toBe(true);
    });

    it('deve falhar se usuário não encontrado', async () => {
      const userId = 999;

      UserRepository.findById.mockResolvedValue(null);

      await expect(UserService.deleteUser(userId)).rejects.toThrow('Usuário não encontrado');
    });
  });

  describe('changePassword', () => {
    it('deve alterar senha com sucesso', async () => {
      const userId = 1;
      const currentPassword = '123456';
      const newPassword = 'newpassword123';

      const user = {
        id: 1,
        name: 'João Silva',
        email: 'joao@example.com',
        checkPassword: jest.fn().mockResolvedValue(true),
      };

      UserRepository.findById.mockResolvedValue({ email: 'joao@example.com' });
      UserRepository.findByEmail.mockResolvedValue(user);
      AuthUtils.validatePasswordStrength.mockReturnValue({
        isValid: true,
        score: 5,
        feedback: [],
      });
      UserRepository.update.mockResolvedValue(true);

      const result = await UserService.changePassword(userId, currentPassword, newPassword);

      expect(user.checkPassword).toHaveBeenCalledWith(currentPassword);
      expect(AuthUtils.validatePasswordStrength).toHaveBeenCalledWith(newPassword);
      expect(UserRepository.update).toHaveBeenCalledWith(userId, { password: newPassword });
      expect(result).toBe(true);
    });

    it('deve falhar se senha atual está incorreta', async () => {
      const userId = 1;
      const currentPassword = 'wrongpassword';
      const newPassword = 'newpassword123';

      const user = {
        id: 1,
        name: 'João Silva',
        email: 'joao@example.com',
        checkPassword: jest.fn().mockResolvedValue(false),
      };

      UserRepository.findById.mockResolvedValue({ email: 'joao@example.com' });
      UserRepository.findByEmail.mockResolvedValue(user);

      await expect(UserService.changePassword(userId, currentPassword, newPassword)).rejects.toThrow('Senha atual incorreta');
    });

    it('deve falhar se nova senha é igual à atual', async () => {
      const userId = 1;
      const currentPassword = '123456';
      const newPassword = '123456';

      const user = {
        id: 1,
        name: 'João Silva',
        email: 'joao@example.com',
        checkPassword: jest.fn().mockResolvedValue(true),
      };

      UserRepository.findById.mockResolvedValue({ email: 'joao@example.com' });
      UserRepository.findByEmail.mockResolvedValue(user);
      AuthUtils.validatePasswordStrength.mockReturnValue({
        isValid: true,
        score: 5,
        feedback: [],
      });

      await expect(UserService.changePassword(userId, currentPassword, newPassword)).rejects.toThrow('A nova senha deve ser diferente da senha atual');
    });
  });
});

