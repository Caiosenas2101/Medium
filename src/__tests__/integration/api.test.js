const request = require('supertest');
const app = require('../../server');

describe('API Integration Tests', () => {
  let authToken;
  let userId;
  let postId;

  beforeAll(async () => {
    // Aguardar inicialização do servidor
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  describe('Health Check', () => {
    it('deve retornar status da API', async () => {
      const response = await request(app)
          .get('/health')
          .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message', 'API está funcionando');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('API Info', () => {
    it('deve retornar informações da API', async () => {
      const response = await request(app)
          .get('/api')
          .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message', 'Green Amigo Medium Challenge API');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('Authentication Flow', () => {
    it('deve criar usuário com sucesso', async () => {
      const userData = {
          name: 'Teste Usuário',
          email: 'teste@example.com',
          password: '123456',
      };

      const response = await request(app)
          .post('/api/auth/users')
          .send(userData)
          .expect(201);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      
      authToken = response.body.data.token;
      userId = response.body.data.user.id;
    });

    it('deve falhar ao criar usuário com email duplicado', async () => {
      const userData = {
          name: 'Outro Usuário',
          email: 'teste@example.com',
          password: '123456',
      };

      const response = await request(app)
          .post('/api/auth/users')
          .send(userData)
          .expect(409);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('type_error', 'CONFLICT_ERROR');
    });

    it('deve fazer login com sucesso', async () => {
      const loginData = {
          email: 'teste@example.com',
          password: '123456',
      };

      const response = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
    });

    it('deve falhar login com credenciais inválidas', async () => {
      const loginData = {
          email: 'teste@example.com',
          password: 'senhaerrada',
      };

      const response = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(401);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('type_error', 'AUTHENTICATION_ERROR');
    });
  });

  describe('Posts Flow', () => {
    it('deve criar post com sucesso', async () => {
      const postData = {
          title: 'Post de Teste',
          summary: 'Resumo do post de teste',
          content: 'Conteúdo completo do post de teste para verificar se está funcionando corretamente.',
          available_at: new Date().toISOString(),
      };

      const response = await request(app)
          .post('/api/posts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(postData)
          .expect(201);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('post');
      
      postId = response.body.data.post.id;
    });

    it('deve listar posts sem autenticação', async () => {
      const response = await request(app)
          .get('/api/posts')
          .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('posts');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.posts)).toBe(true);
    });

    it('deve buscar post por ID', async () => {
      const response = await request(app)
          .get(`/api/posts/${postId}`)
          .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('post');
      expect(response.body.data.post).toHaveProperty('id', postId);
    });

    it('deve atualizar post com sucesso', async () => {
      const updateData = {
          title: 'Post Atualizado',
          summary: 'Resumo atualizado',
      };

      const response = await request(app)
          .put(`/api/posts/${postId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('post');
      expect(response.body.data.post).toHaveProperty('title', 'Post Atualizado');
    });

    it('deve falhar ao atualizar post de outro usuário', async () => {
      // Criar outro usuário
      const anotherUserData = {
          name: 'Outro Usuário',
          email: 'outro@example.com',
          password: '123456',
      };

      const userResponse = await request(app)
          .post('/api/auth/users')
          .send(anotherUserData)
          .expect(201);

      const anotherToken = userResponse.body.data.token;

      const updateData = {
          title: 'Tentativa de Atualização',
      };

      const response = await request(app)
          .put(`/api/posts/${postId}`)
          .set('Authorization', `Bearer ${anotherToken}`)
          .send(updateData)
          .expect(403);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('type_error', 'AUTHORIZATION_ERROR');
    });
  });

  describe('Likes Flow', () => {
    it('deve fazer like em post com sucesso', async () => {
      const response = await request(app)
          .post(`/api/posts/${postId}/like`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('liked', true);
      expect(response.body.data).toHaveProperty('total_likes');
    });

    it('deve fazer toggle de like (remover)', async () => {
      const response = await request(app)
          .post(`/api/posts/${postId}/like`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('liked', false);
    });

    it('deve listar likes de um post', async () => {
      const response = await request(app)
          .get(`/api/posts/${postId}/likes`)
          .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('likes');
      expect(Array.isArray(response.body.data.likes)).toBe(true);
    });

    it('deve verificar se usuário curtiu o post', async () => {
      const response = await request(app)
          .get(`/api/posts/${postId}/liked`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('liked');
    });
  });

  describe('Users Flow', () => {
    it('deve listar usuários sem autenticação', async () => {
      const response = await request(app)
          .get('/api/users')
          .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('users');
      expect(Array.isArray(response.body.data.users)).toBe(true);
    });

    it('deve buscar usuário por ID', async () => {
      const response = await request(app)
          .get(`/api/users/${userId}`)
          .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('id', userId);
    });

    it('deve listar posts de um usuário', async () => {
      const response = await request(app)
          .get(`/api/users/${userId}/posts`)
          .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('posts');
      expect(Array.isArray(response.body.data.posts)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('deve retornar 404 para rota não encontrada', async () => {
      const response = await request(app)
          .get('/api/rota-inexistente')
          .expect(404);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('type_error', 'NOT_FOUND');
    });

    it('deve retornar 401 para endpoint protegido sem token', async () => {
      const response = await request(app)
          .get('/api/auth/me')
          .expect(401);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('type_error', 'AUTHENTICATION_ERROR');
    });

    it('deve retornar 400 para dados inválidos', async () => {
      const invalidData = {
          name: '', // Nome vazio
          email: 'email-invalido', // Email inválido
          password: '123', // Senha muito curta
      };

      const response = await request(app)
          .post('/api/auth/users')
          .send(invalidData)
          .expect(400);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('type_error', 'VALIDATION_ERROR');
    });
  });

  describe('Pagination', () => {
    it('deve funcionar paginação em posts', async () => {
      const response = await request(app)
          .get('/api/posts?limit=1&offset=0')
          .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('limit', 1);
      expect(response.body.data.pagination).toHaveProperty('offset', 0);
    });
  });

  describe('Cleanup', () => {
    it('deve remover post criado', async () => {
      const response = await request(app)
          .delete(`/api/posts/${postId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
    });
  });
});

