const PostService = require('../../modules/posts/PostService');
const { Post, User, PostLike } = require('../../database/models');

// Mock das dependências
jest.mock('../../database/models', () => ({
  Post: {
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    findAll: jest.fn(),
  },
  User: {
    findByPk: jest.fn(),
  },
  PostLike: {
    findAndCountAll: jest.fn(),
    count: jest.fn(),
  },
}));

jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe('PostService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    it('deve criar post com sucesso', async () => {
      const postData = {
        title: 'Título do Post',
        summary: 'Resumo do post',
        content: 'Conteúdo completo do post',
        available_at: new Date(),
      };
      const userId = 1;

      const mockUser = { id: 1, name: 'João Silva' };
      const mockPost = {
        id: 1,
        title: 'Título do Post',
        summary: 'Resumo do post',
        content: 'Conteúdo completo do post',
        available_at: postData.available_at,
        user_id: userId,
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          title: 'Título do Post',
          summary: 'Resumo do post',
          content: 'Conteúdo completo do post',
          available_at: postData.available_at,
          user_id: userId,
        }),
      };

      User.findByPk.mockResolvedValue(mockUser);
      Post.create.mockResolvedValue(mockPost);

      const result = await PostService.createPost(postData, userId);

      expect(User.findByPk).toHaveBeenCalledWith(userId);
      expect(Post.create).toHaveBeenCalledWith({
        ...postData,
        user_id: userId,
      });
      expect(result).toEqual(mockPost);
    });

    it('deve falhar se usuário não existe', async () => {
      const postData = {
        title: 'Título do Post',
        summary: 'Resumo do post',
        content: 'Conteúdo completo do post',
        available_at: new Date(),
      };
      const userId = 999;

      User.findByPk.mockResolvedValue(null);

      await expect(PostService.createPost(postData, userId)).rejects.toThrow('Usuário não encontrado');
    });
  });

  describe('listPosts', () => {
    it('deve listar posts com paginação', async () => {
      const filters = {};
      const pagination = { limit: 5, offset: 0 };

      const mockPosts = [
        {
          id: 1,
          title: 'Post 1',
          summary: 'Resumo 1',
          content: 'Conteúdo 1',
          available_at: new Date(),
          user_id: 1,
          User: { id: 1, name: 'João Silva' },
          PostLikes: [{ id: 1 }, { id: 2 }],
        },
        {
          id: 2,
          title: 'Post 2',
          summary: 'Resumo 2',
          content: 'Conteúdo 2',
          available_at: new Date(),
          user_id: 2,
          User: { id: 2, name: 'Maria Santos' },
          PostLikes: [{ id: 3 }],
        },
      ];

      const mockResult = {
        count: 2,
        rows: mockPosts,
      };

      Post.findAndCountAll.mockResolvedValue(mockResult);

      const result = await PostService.listPosts(filters, pagination);

      expect(Post.findAndCountAll).toHaveBeenCalled();
      expect(result.posts).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.posts[0].total_likes).toBe(2);
      expect(result.posts[1].total_likes).toBe(1);
    });

    it('deve filtrar posts por usuário', async () => {
      const filters = { user_id: 1 };
      const pagination = { limit: 5, offset: 0 };

      const mockResult = {
        count: 1,
        rows: [{
          id: 1,
          title: 'Post do Usuário 1',
          user_id: 1,
          User: { id: 1, name: 'João Silva' },
          PostLikes: [],
        }],
      };

      Post.findAndCountAll.mockResolvedValue(mockResult);

      const result = await PostService.listPosts(filters, pagination);

      expect(Post.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user_id: 1,
          }),
        })
      );
      expect(result.posts).toHaveLength(1);
    });

    it('deve incluir posts agendados quando solicitado', async () => {
      const filters = { include_scheduled: true };
      const pagination = { limit: 5, offset: 0 };

      const mockResult = {
        count: 1,
        rows: [{
          id: 1,
          title: 'Post Agendado',
          available_at: new Date(Date.now() + 86400000), // Amanhã
          user_id: 1,
          User: { id: 1, name: 'João Silva' },
          PostLikes: [],
        }],
      };

      Post.findAndCountAll.mockResolvedValue(mockResult);

      const result = await PostService.listPosts(filters, pagination);

      expect(Post.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            available_at: expect.any(Object),
          }),
        })
      );
      expect(result.posts).toHaveLength(1);
    });
  });

  describe('getPostById', () => {
    it('deve retornar post se encontrado', async () => {
      const postId = 1;
      const mockPost = {
        id: 1,
        title: 'Post Teste',
        summary: 'Resumo',
        content: 'Conteúdo',
        available_at: new Date(),
        user_id: 1,
        User: { id: 1, name: 'João Silva' },
        PostLikes: [{ id: 1 }, { id: 2 }],
      };

      Post.findByPk.mockResolvedValue(mockPost);

      const result = await PostService.getPostById(postId);

      expect(Post.findByPk).toHaveBeenCalledWith(postId, expect.any(Object));
      expect(result.total_likes).toBe(2);
    });

    it('deve falhar se post não encontrado', async () => {
      const postId = 999;

      Post.findByPk.mockResolvedValue(null);

      await expect(PostService.getPostById(postId)).rejects.toThrow('Post não encontrado');
    });
  });

  describe('updatePost', () => {
    it('deve atualizar post com sucesso', async () => {
      const postId = 1;
      const updateData = {
        title: 'Título Atualizado',
        summary: 'Resumo Atualizado',
      };
      const userId = 1;

      const mockPost = {
        id: 1,
        title: 'Post Original',
        user_id: 1,
      };

      const mockUpdatedPost = {
        id: 1,
        title: 'Título Atualizado',
        summary: 'Resumo Atualizado',
        user_id: 1,
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          title: 'Título Atualizado',
          summary: 'Resumo Atualizado',
          user_id: 1,
        }),
      };

      Post.findByPk.mockResolvedValue(mockPost);
      Post.update.mockResolvedValue([1]);
      Post.findByPk.mockResolvedValueOnce(mockPost).mockResolvedValueOnce(mockUpdatedPost);

      const result = await PostService.updatePost(postId, updateData, userId);

      expect(Post.findByPk).toHaveBeenCalledWith(postId);
      expect(Post.update).toHaveBeenCalledWith(updateData, { where: { id: postId } });
      expect(result).toEqual(mockUpdatedPost);
    });

    it('deve falhar se post não encontrado', async () => {
      const postId = 999;
      const updateData = { title: 'Novo Título' };
      const userId = 1;

      Post.findByPk.mockResolvedValue(null);

      await expect(PostService.updatePost(postId, updateData, userId)).rejects.toThrow('Post não encontrado');
    });

    it('deve falhar se usuário não é o autor', async () => {
      const postId = 1;
      const updateData = { title: 'Novo Título' };
      const userId = 2; // Diferente do autor

      const mockPost = {
        id: 1,
        title: 'Post Original',
        user_id: 1, // Autor diferente
      };

      Post.findByPk.mockResolvedValue(mockPost);

      await expect(PostService.updatePost(postId, updateData, userId)).rejects.toThrow('Acesso negado. Você não tem permissão para editar este post');
    });
  });

  describe('deletePost', () => {
    it('deve remover post com sucesso', async () => {
      const postId = 1;
      const userId = 1;

      const mockPost = {
        id: 1,
        title: 'Post para Remover',
        user_id: 1,
      };

      Post.findByPk.mockResolvedValue(mockPost);
      Post.destroy.mockResolvedValue(1);

      const result = await PostService.deletePost(postId, userId);

      expect(Post.findByPk).toHaveBeenCalledWith(postId);
      expect(Post.destroy).toHaveBeenCalledWith({ where: { id: postId } });
      expect(result).toBe(true);
    });

    it('deve falhar se post não encontrado', async () => {
      const postId = 999;
      const userId = 1;

      Post.findByPk.mockResolvedValue(null);

      await expect(PostService.deletePost(postId, userId)).rejects.toThrow('Post não encontrado');
    });

    it('deve falhar se usuário não é o autor', async () => {
      const postId = 1;
      const userId = 2; // Diferente do autor

      const mockPost = {
        id: 1,
        title: 'Post para Remover',
        user_id: 1, // Autor diferente
      };

      Post.findByPk.mockResolvedValue(mockPost);

      await expect(PostService.deletePost(postId, userId)).rejects.toThrow('Acesso negado. Você não tem permissão para remover este post');
    });
  });

  describe('getUserPosts', () => {
    it('deve listar posts de um usuário específico', async () => {
      const userId = 1;
      const filters = {};
      const pagination = { limit: 10, offset: 0 };

      const mockResult = {
        count: 2,
        rows: [
          {
            id: 1,
            title: 'Post 1 do Usuário',
            user_id: 1,
            PostLikes: [{ id: 1 }],
          },
          {
            id: 2,
            title: 'Post 2 do Usuário',
            user_id: 1,
            PostLikes: [{ id: 2 }, { id: 3 }],
          },
        ],
      };

      Post.findAndCountAll.mockResolvedValue(mockResult);

      const result = await PostService.getUserPosts(userId, filters, pagination);

      expect(Post.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user_id: 1,
          }),
        })
      );
      expect(result.posts).toHaveLength(2);
      expect(result.posts[0].total_likes).toBe(1);
      expect(result.posts[1].total_likes).toBe(2);
    });
  });

  describe('schedulePost', () => {
    it('deve agendar post com sucesso', async () => {
      const postId = 1;
      const available_at = new Date(Date.now() + 86400000); // Amanhã
      const userId = 1;

      const mockPost = {
        id: 1,
        title: 'Post para Agendar',
        user_id: 1,
      };

      const mockScheduledPost = {
        id: 1,
        title: 'Post para Agendar',
        available_at: available_at,
        user_id: 1,
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          title: 'Post para Agendar',
          available_at: available_at,
          user_id: 1,
        }),
      };

      Post.findByPk.mockResolvedValue(mockPost);
      Post.update.mockResolvedValue([1]);
      Post.findByPk.mockResolvedValueOnce(mockPost).mockResolvedValueOnce(mockScheduledPost);

      const result = await PostService.schedulePost(postId, available_at, userId);

      expect(Post.findByPk).toHaveBeenCalledWith(postId);
      expect(Post.update).toHaveBeenCalledWith({ available_at }, { where: { id: postId } });
      expect(result).toEqual(mockScheduledPost);
    });

    it('deve falhar se data não é no futuro', async () => {
      const postId = 1;
      const available_at = new Date(Date.now() - 86400000); // Ontem
      const userId = 1;

      const mockPost = {
        id: 1,
        title: 'Post para Agendar',
        user_id: 1,
      };

      Post.findByPk.mockResolvedValue(mockPost);

      await expect(PostService.schedulePost(postId, available_at, userId)).rejects.toThrow('Data de disponibilidade deve ser no futuro');
    });
  });

  describe('countPosts', () => {
    it('deve contar posts com filtros', async () => {
      const filters = { user_id: 1 };

      Post.count.mockResolvedValue(5);

      const result = await PostService.countPosts(filters);

      expect(Post.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user_id: 1,
          }),
        })
      );
      expect(result).toBe(5);
    });
  });
});

