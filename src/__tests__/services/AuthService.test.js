const AuthController = require('../../modules/auth/AuthController');
const UserService = require('../../modules/users/UserService');
const AuthUtils = require('../../utils/AuthUtils');

// Mock das dependências
jest.mock('../../modules/users/UserService');
jest.mock('../../utils/AuthUtils');
jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe('AuthController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      data: {},
      auth: { user_id: 1 },
      ip: '127.0.0.1',
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('createUser', () => {
    it('deve criar usuário com sucesso', async () => {
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

      const mockToken = 'mock-jwt-token';

      mockReq.data = userData;
      UserService.createUser.mockResolvedValue(mockUser);
      AuthUtils.generatePayload.mockReturnValue({ id: 1, email: 'joao@example.com' });
      AuthUtils.generateToken.mockReturnValue(mockToken);

      await AuthController.createUser(mockReq, mockRes);

      expect(UserService.createUser).toHaveBeenCalledWith(userData);
      expect(AuthUtils.generateToken).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Usuário criado com sucesso',
        data: {
          user: mockUser.toJSON(),
          token: mockToken,
        },
      });
    });

    it('deve retornar erro 409 se email já existe', async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: '123456',
      };

      mockReq.data = userData;
      UserService.createUser.mockRejectedValue(new Error('Email já está em uso'));

      await AuthController.createUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        type_error: 'CONFLICT_ERROR',
        message: 'Email já está em uso',
      });
    });

    it('deve retornar erro 400 se senha é inválida', async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: '123',
      };

      mockReq.data = userData;
      UserService.createUser.mockRejectedValue(new Error('Senha inválida: Senha deve ter pelo menos 6 caracteres'));

      await AuthController.createUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        type_error: 'VALIDATION_ERROR',
        message: 'Senha inválida: Senha deve ter pelo menos 6 caracteres',
      });
    });
  });

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      const loginData = {
        email: 'joao@example.com',
        password: '123456',
      };

      const mockResult = {
        user: { id: 1, name: 'João Silva', email: 'joao@example.com' },
        token: 'mock-jwt-token',
      };

      mockReq.data = loginData;
      UserService.authenticateUser.mockResolvedValue(mockResult);

      await AuthController.login(mockReq, mockRes);

      expect(UserService.authenticateUser).toHaveBeenCalledWith('joao@example.com', '123456');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Login realizado com sucesso',
        data: mockResult,
      });
    });

    it('deve retornar erro 401 se credenciais inválidas', async () => {
      const loginData = {
        email: 'joao@example.com',
        password: 'wrongpassword',
      };

      mockReq.data = loginData;
      UserService.authenticateUser.mockRejectedValue(new Error('Credenciais inválidas'));

      await AuthController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        type_error: 'AUTHENTICATION_ERROR',
        message: 'Email ou senha incorretos',
      });
    });
  });

  describe('getMe', () => {
    it('deve retornar informações do usuário autenticado', async () => {
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

      UserService.getUserById.mockResolvedValue(mockUser);

      await AuthController.getMe(mockReq, mockRes);

      expect(UserService.getUserById).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Informações do usuário obtidas com sucesso',
        data: {
          user: mockUser.toJSON(),
        },
      });
    });

    it('deve retornar erro 404 se usuário não encontrado', async () => {
      UserService.getUserById.mockRejectedValue(new Error('Usuário não encontrado'));

      await AuthController.getMe(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        type_error: 'NOT_FOUND',
        message: 'Usuário não encontrado',
      });
    });
  });

  describe('updateMe', () => {
    it('deve atualizar usuário autenticado com sucesso', async () => {
      const updateData = {
        name: 'João Silva Atualizado',
        email: 'joao.novo@example.com',
      };

      const mockUpdatedUser = {
        id: 1,
        name: 'João Silva Atualizado',
        email: 'joao.novo@example.com',
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          name: 'João Silva Atualizado',
          email: 'joao.novo@example.com',
        }),
      };

      mockReq.data = updateData;
      UserService.updateUser.mockResolvedValue(mockUpdatedUser);

      await AuthController.updateMe(mockReq, mockRes);

      expect(UserService.updateUser).toHaveBeenCalledWith(1, updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Usuário atualizado com sucesso',
        data: {
          user: mockUpdatedUser.toJSON(),
        },
      });
    });

    it('deve retornar erro 409 se email já existe', async () => {
      const updateData = {
        name: 'João Silva',
        email: 'email.existente@example.com',
      };

      mockReq.data = updateData;
      UserService.updateUser.mockRejectedValue(new Error('Email já está em uso'));

      await AuthController.updateMe(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        type_error: 'CONFLICT_ERROR',
        message: 'Email já está em uso',
      });
    });
  });

  describe('changePassword', () => {
    it('deve alterar senha com sucesso', async () => {
      const passwordData = {
        currentPassword: '123456',
        newPassword: 'newpassword123',
      };

      mockReq.data = passwordData;
      UserService.changePassword.mockResolvedValue(true);

      await AuthController.changePassword(mockReq, mockRes);

      expect(UserService.changePassword).toHaveBeenCalledWith(1, '123456', 'newpassword123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Senha alterada com sucesso',
      });
    });

    it('deve retornar erro 400 se senha atual incorreta', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
      };

      mockReq.data = passwordData;
      UserService.changePassword.mockRejectedValue(new Error('Senha atual incorreta'));

      await AuthController.changePassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        type_error: 'VALIDATION_ERROR',
        message: 'Senha atual incorreta',
      });
    });

    it('deve retornar erro 400 se nova senha é igual à atual', async () => {
      const passwordData = {
        currentPassword: '123456',
        newPassword: '123456',
      };

      mockReq.data = passwordData;
      UserService.changePassword.mockRejectedValue(new Error('A nova senha deve ser diferente da senha atual'));

      await AuthController.changePassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        type_error: 'VALIDATION_ERROR',
        message: 'A nova senha deve ser diferente da senha atual',
      });
    });
  });

  describe('deleteMe', () => {
    it('deve remover usuário autenticado com sucesso', async () => {
      UserService.deleteUser.mockResolvedValue(true);

      await AuthController.deleteMe(mockReq, mockRes);

      expect(UserService.deleteUser).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Usuário removido com sucesso',
      });
    });

    it('deve retornar erro 404 se usuário não encontrado', async () => {
      UserService.deleteUser.mockRejectedValue(new Error('Usuário não encontrado'));

      await AuthController.deleteMe(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        type_error: 'NOT_FOUND',
        message: 'Usuário não encontrado',
      });
    });
  });
});

