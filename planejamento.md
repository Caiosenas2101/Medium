# 📋 PLANEJAMENTO DA IMPLEMENTAÇÃO - Green Amigo Medium Challenge

## **FASE 1: Configuração Inicial**
1. **Estrutura de pastas** - Criar toda a arquitetura de pastas conforme especificado
2. **package.json** - Configurar dependências (Node.js 20, Express, Sequelize, JWT, bcryptjs, Yup, etc.)
3. **Configurações base** - .env.example, ESLint, Prettier, Jest
4. **Configuração do banco** - Sequelize config, conexão PostgreSQL

## **FASE 2: Modelos e Banco de Dados**
5. **Migrations** - User, Post, PostLike com todos os campos e relacionamentos
6. **Models** - User.model.js, Post.model.js, PostLike.model.js com hooks e métodos
7. **Seeders** - Dados iniciais para teste
8. **Relacionamentos** - hasMany/belongsTo entre User, Post e PostLike

## **FASE 3: Validações e Schemas**
9. **Schemas Yup** - auth.schema.js, user.schema.js, post.schema.js, like.schema.js
10. **SchemaValidator middleware** - Validação de body/query/params
11. **ErrorMiddleware** - Tratamento global de erros

## **FASE 4: Autenticação e Segurança**
12. **AuthUtils** - Funções de JWT e bcrypt
13. **AuthMiddleware** - Verificação de token JWT
14. **Configurações de segurança** - helmet, cors

## **FASE 5: Repositórios e Serviços**
15. **UserRepository** - Operações de banco para usuários
16. **UserService** - Lógica de negócio para usuários
17. **PostService** - Lógica de negócio para posts (criação, listagem, edição, remoção)
18. **LikeService** - Lógica de toggle de likes

## **FASE 6: Controllers**
19. **AuthController** - POST /users, POST /login
20. **UserController** - Operações de usuário
21. **PostController** - GET/POST/PUT/DELETE /posts
22. **LikeController** - POST /posts/:id/like

## **FASE 7: Rotas e Utilitários**
23. **Rotas** - AuthRoutes, UserRoutes, PostRoutes
24. **Pagination utility** - Sistema de paginação
25. **Logger** - Sistema de logs com morgan

## **FASE 8: Servidor Principal**
26. **server.js** - Configuração do Express, middlewares, rotas
27. **Configurações finais** - CORS, helmet, morgan, express-async-errors

## **FASE 9: Testes**
28. **Testes unitários** - UserService, AuthService, PostService, LikeService
29. **Testes de integração** - Endpoints principais
30. **Configuração Jest** - Setup de testes

## **FASE 10: Documentação e Finalização**
31. **README.md** - Instruções completas de instalação e uso
32. **Coleção Postman** - Endpoints para teste
33. **Scripts npm** - dev, start, lint, test
34. **Verificação final** - Lint, testes, documentação

## 🎯 **CARACTERÍSTICAS PRINCIPAIS QUE VOU IMPLEMENTAR:**

- ✅ **Arquitetura em camadas** (Controller → Service → Repository)
- ✅ **Autenticação JWT** com middleware
- ✅ **Validação Yup** em todos os endpoints
- ✅ **Soft delete** para likes (toggle)
- ✅ **Agendamento de posts** (available_at)
- ✅ **Paginação** com limit/offset
- ✅ **Autorização** (só autor edita/remove)
- ✅ **Segurança** (helmet, cors, bcrypt)
- ✅ **Testes** unitários e integração
- ✅ **Documentação** completa

## 📁 **ESTRUTURA FINAL:**
```
/src
  /config          # db, jwt, logger
  /database
    /migrations
    /seeders
    /models
    index.js
  /modules
    /auth
      AuthController.js
      AuthService.js
      AuthRoutes.js
    /users
      UserController.js
      UserService.js
      UserRepository.js
      UserRoutes.js
      User.model.js
    /posts
      PostController.js
      PostService.js
      PostRepository.js
      PostRoutes.js
      Post.model.js
      PostLike.model.js
  /middlewares
    SchemaValidator.js
    AuthMiddleware.js
    ErrorMiddleware.js
  /schemas          # yup schemas (body/query/params)
    auth.schema.js
    user.schema.js
    post.schema.js
    like.schema.js
  /utils
    AuthUtils.js
    Pagination.js
  server.js
.env.example
README.md
```

## 🔧 **STACK TECNOLÓGICA:**
- **Node.js 20** + Express
- **PostgreSQL** + Sequelize (migrations + seeders)
- **JWT** (jsonwebtoken) para autenticação
- **bcryptjs** para criptografia de senhas
- **Yup** para validação + middleware SchemaValidator
- **Jest** para testes
- **ESLint + Prettier** para qualidade de código
- **helmet, cors, morgan, express-async-errors**

## 📝 **ENDPOINTS PRINCIPAIS:**
- `POST /users` - Criar usuário
- `POST /login` - Login
- `GET /posts` - Listar posts (público)
- `POST /posts` - Criar post (auth)
- `PUT /posts/:id` - Editar post (auth + autor)
- `DELETE /posts/:id` - Remover post (auth + autor)
- `POST /posts/:id/like` - Toggle like (auth)

## 🚀 **PRÓXIMOS PASSOS:**
Aguardando confirmação para iniciar a implementação seguindo exatamente este planejamento!