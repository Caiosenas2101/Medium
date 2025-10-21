const LikeService = require('../../modules/posts/LikeService');
const { Post, PostLike, User } = require('../../database/models');

// Mock das dependências
jest.mock('../../database/models', () => ({
  Post: {
    findByPk: jest.fn(),
  },
  User: {
    findByPk: jest.fn(),
  },
  PostLike: {
    findOne: jest.fn(),
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    count: jest.fn(),
    findAll: jest.fn(),
  },
}));

jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe('LikeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('toggleLike', () => {
    it('deve criar novo like se não existe', async () => {
      const postId = 1;
      const userId = 1;

      const mockPost = { id: 1, title: 'Post Teste' };
      const mockUser = { id: 1, name: 'João Silva' };
      const mockLike = {
        id: 1,
        post_id: 1,
        user_id: 1,
        liked_at: new Date(),
        is_deleted: false,
        toggle: jest.fn(),
      };

      Post.findByPk.mockResolvedValue(mockPost);
      User.findByPk.mockResolvedValue(mockUser);
      PostLike.findOne.mockResolvedValue(null);
      PostLike.create.mockResolvedValue(mockLike);
      PostLike.count.mockResolvedValue(1);

      const result = await LikeService.toggleLike(postId, userId);

      expect(Post.findByPk).toHaveBeenCalledWith(postId);
      expect(User.findByPk).toHaveBeenCalledWith(userId);
      expect(PostLike.findOne).toHaveBeenCalledWith({
        where: { post_id: postId, user_id: userId },
      });
      expect(PostLike.create).toHaveBeenCalledWith({
        post_id: postId,
        user_id: userId,
        liked_at: expect.any(Date),
        is_deleted: false,
      });
      expect(result).toEqual({
        liked: true,
        total_likes: 1,
      });
    });

    it('deve fazer toggle de like existente', async () => {
      const postId = 1;
      const userId = 1;

      const mockPost = { id: 1, title: 'Post Teste' };
      const mockUser = { id: 1, name: 'João Silva' };
      const mockLike = {
        id: 1,
        post_id: 1,
        user_id: 1,
        is_deleted: false,
        toggle: jest.fn().mockResolvedValue(),
      };

      Post.findByPk.mockResolvedValue(mockPost);
      User.findByPk.mockResolvedValue(mockUser);
      PostLike.findOne.mockResolvedValue(mockLike);
      PostLike.count.mockResolvedValue(0);

      const result = await LikeService.toggleLike(postId, userId);

      expect(mockLike.toggle).toHaveBeenCalled();
      expect(result).toEqual({
        liked: false,
        total_likes: 0,
      });
    });

    it('deve falhar se post não existe', async () => {
      const postId = 999;
      const userId = 1;

      Post.findByPk.mockResolvedValue(null);

      await expect(LikeService.toggleLike(postId, userId)).rejects.toThrow('Post não encontrado');
    });

    it('deve falhar se usuário não existe', async () => {
      const postId = 1;
      const userId = 999;

      const mockPost = { id: 1, title: 'Post Teste' };

      Post.findByPk.mockResolvedValue(mockPost);
      User.findByPk.mockResolvedValue(null);

      await expect(LikeService.toggleLike(postId, userId)).rejects.toThrow('Usuário não encontrado');
    });
  });

  describe('getPostLikes', () => {
    it('deve listar likes de um post', async () => {
      const postId = 1;
      const filters = {};
      const pagination = { limit: 20, offset: 0 };

      const mockPost = { id: 1, title: 'Post Teste' };
      const mockLikes = [
        {
          id: 1,
          post_id: 1,
          user_id: 1,
          liked_at: new Date(),
          is_deleted: false,
          User: { id: 1, name: 'João Silva' },
        },
        {
          id: 2,
          post_id: 1,
          user_id: 2,
          liked_at: new Date(),
          is_deleted: false,
          User: { id: 2, name: 'Maria Santos' },
        },
      ];

      const mockResult = {
        count: 2,
        rows: mockLikes,
      };

      Post.findByPk.mockResolvedValue(mockPost);
      PostLike.findAndCountAll.mockResolvedValue(mockResult);

      const result = await LikeService.getPostLikes(postId, filters, pagination);

      expect(Post.findByPk).toHaveBeenCalledWith(postId);
      expect(PostLike.findAndCountAll).toHaveBeenCalled();
      expect(result.likes).toHaveLength(2);
      expect(result.likes[0].is_active).toBe(true);
      expect(result.likes[1].is_active).toBe(true);
    });

    it('deve falhar se post não existe', async () => {
      const postId = 999;
      const filters = {};
      const pagination = { limit: 20, offset: 0 };

      Post.findByPk.mockResolvedValue(null);

      await expect(LikeService.getPostLikes(postId, filters, pagination)).rejects.toThrow('Post não encontrado');
    });
  });

  describe('getUserLikes', () => {
    it('deve listar likes de um usuário', async () => {
      const userId = 1;
      const filters = {};
      const pagination = { limit: 20, offset: 0 };

      const mockUser = { id: 1, name: 'João Silva' };
      const mockLikes = [
        {
          id: 1,
          user_id: 1,
          post_id: 1,
          liked_at: new Date(),
          is_deleted: false,
          Post: {
            id: 1,
            title: 'Post Curtido 1',
            summary: 'Resumo 1',
            available_at: new Date(),
            User: { id: 2, name: 'Maria Santos' },
          },
        },
      ];

      const mockResult = {
        count: 1,
        rows: mockLikes,
      };

      User.findByPk.mockResolvedValue(mockUser);
      PostLike.findAndCountAll.mockResolvedValue(mockResult);

      const result = await LikeService.getUserLikes(userId, filters, pagination);

      expect(User.findByPk).toHaveBeenCalledWith(userId);
      expect(PostLike.findAndCountAll).toHaveBeenCalled();
      expect(result.likes).toHaveLength(1);
      expect(result.likes[0].is_active).toBe(true);
    });

    it('deve falhar se usuário não existe', async () => {
      const userId = 999;
      const filters = {};
      const pagination = { limit: 20, offset: 0 };

      User.findByPk.mockResolvedValue(null);

      await expect(LikeService.getUserLikes(userId, filters, pagination)).rejects.toThrow('Usuário não encontrado');
    });
  });

  describe('hasUserLiked', () => {
    it('deve retornar true se usuário curtiu o post', async () => {
      const postId = 1;
      const userId = 1;

      const mockLike = {
        id: 1,
        post_id: 1,
        user_id: 1,
        is_deleted: false,
      };

      PostLike.findOne.mockResolvedValue(mockLike);

      const result = await LikeService.hasUserLiked(postId, userId);

      expect(PostLike.findOne).toHaveBeenCalledWith({
        where: {
          post_id: postId,
          user_id: userId,
          is_deleted: false,
        },
      });
      expect(result).toBe(true);
    });

    it('deve retornar false se usuário não curtiu o post', async () => {
      const postId = 1;
      const userId = 1;

      PostLike.findOne.mockResolvedValue(null);

      const result = await LikeService.hasUserLiked(postId, userId);

      expect(result).toBe(false);
    });
  });

  describe('countPostLikes', () => {
    it('deve contar likes de um post', async () => {
      const postId = 1;
      const filters = {};

      PostLike.count.mockResolvedValue(5);

      const result = await LikeService.countPostLikes(postId, filters);

      expect(PostLike.count).toHaveBeenCalledWith({
        where: {
          post_id: postId,
          is_deleted: false,
        },
      });
      expect(result).toBe(5);
    });

    it('deve incluir likes deletados quando solicitado', async () => {
      const postId = 1;
      const filters = { include_deleted: true };

      PostLike.count.mockResolvedValue(8);

      const result = await LikeService.countPostLikes(postId, filters);

      expect(PostLike.count).toHaveBeenCalledWith({
        where: {
          post_id: postId,
        },
      });
      expect(result).toBe(8);
    });
  });

  describe('countUserLikes', () => {
    it('deve contar likes de um usuário', async () => {
      const userId = 1;
      const filters = {};

      PostLike.count.mockResolvedValue(3);

      const result = await LikeService.countUserLikes(userId, filters);

      expect(PostLike.count).toHaveBeenCalledWith({
        where: {
          user_id: userId,
          is_deleted: false,
        },
      });
      expect(result).toBe(3);
    });
  });

  describe('removeLike', () => {
    it('deve remover like específico', async () => {
      const likeId = 1;
      const userId = 1;

      const mockLike = {
        id: 1,
        user_id: 1,
        post_id: 1,
        update: jest.fn().mockResolvedValue(),
      };

      PostLike.findOne.mockResolvedValue(mockLike);

      const result = await LikeService.removeLike(likeId, userId);

      expect(PostLike.findOne).toHaveBeenCalledWith({
        where: {
          id: likeId,
          user_id: userId,
        },
      });
      expect(mockLike.update).toHaveBeenCalledWith({ is_deleted: true });
      expect(result).toBe(true);
    });

    it('deve falhar se like não encontrado', async () => {
      const likeId = 999;
      const userId = 1;

      PostLike.findOne.mockResolvedValue(null);

      await expect(LikeService.removeLike(likeId, userId)).rejects.toThrow('Like não encontrado ou você não tem permissão para removê-lo');
    });
  });

  describe('getMostLikedPosts', () => {
    it('deve listar posts mais curtidos', async () => {
      const filters = {};
      const pagination = { limit: 10, offset: 0 };

      const mockPosts = [
        {
          id: 1,
          title: 'Post Mais Curtido',
          summary: 'Resumo',
          content: 'Conteúdo',
          available_at: new Date(),
          user_id: 1,
          User: { id: 1, name: 'João Silva' },
          PostLikes: [{ id: 1 }, { id: 2 }, { id: 3 }],
        },
        {
          id: 2,
          title: 'Post Menos Curtido',
          summary: 'Resumo',
          content: 'Conteúdo',
          available_at: new Date(),
          user_id: 2,
          User: { id: 2, name: 'Maria Santos' },
          PostLikes: [{ id: 4 }],
        },
      ];

      Post.findAll.mockResolvedValue(mockPosts);

      const result = await LikeService.getMostLikedPosts(filters, pagination);

      expect(Post.findAll).toHaveBeenCalled();
      expect(result.posts).toHaveLength(2);
      expect(result.posts[0].total_likes).toBe(3);
      expect(result.posts[1].total_likes).toBe(1);
    });
  });
});

