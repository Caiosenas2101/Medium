# 🚀 Medium API - Green Amigo Challenge

Uma API REST completa para uma plataforma similar ao Medium, desenvolvida com Node.js, Express, PostgreSQL e Sequelize.

## 📋 Funcionalidades

- ✅ **Autenticação JWT** com registro e login
- ✅ **Gestão de Posts** (criar, editar, remover, listar)
- ✅ **Sistema de Likes** com toggle
- ✅ **Agendamento de Posts** (publicação futura)
- ✅ **Paginação** em todas as listagens
- ✅ **Autorização** (apenas o autor pode editar/remover)
- ✅ **Validação de dados** com Yup
- ✅ **Testes** unitários e de integração
- ✅ **Documentação** completa

## 🛠️ Stack Tecnológica

- **Node.js 20** + Express
- **PostgreSQL** + Sequelize (migrations + seeders)
- **JWT** (jsonwebtoken) para autenticação
- **bcryptjs** para criptografia de senhas
- **Yup** para validação
- **Jest** para testes
- **ESLint + Prettier** para qualidade de código
- **helmet, cors, morgan, express-async-errors**

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js 20+
- PostgreSQL 12+
- npm ou yarn

### 1. Clone o repositório

```bash
git clone https://github.com/Caiosenas2101/Medium.git
cd Medium
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medium_api
DB_USER=postgres
DB_PASSWORD=sua_senha

# JWT
JWT_SECRET=seu_jwt_secret_super_seguro
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development
```

### 4. Configure o banco de dados

```bash
# Execute as migrations
npm run migrate

# Execute os seeders (dados de exemplo)
npm run seed
```

### 5. Execute a aplicação

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

A API estará disponível em `http://localhost:3000`

## 📚 Endpoints da API

### Autenticação

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/users` | Criar usuário | ❌ |
| POST | `/login` | Login | ❌ |

### Posts

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/posts` | Listar posts | ❌ |
| POST | `/posts` | Criar post | ✅ |
| PUT | `/posts/:id` | Editar post | ✅ |
| DELETE | `/posts/:id` | Remover post | ✅ |

### Likes

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/posts/:id/like` | Toggle like | ✅ |

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Produção
npm start

# Testes
npm test
npm run test:watch

# Lint
npm run lint
npm run lint:fix

# Database
npm run migrate
npm run seed
npm run migrate:undo
```

## 🧪 Testes

A API possui testes unitários e de integração:

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Executar testes com coverage
npm run test:coverage
```

### Estrutura dos Testes

```
src/__tests__/
├── integration/
│   └── api.test.js          # Testes de integração
├── services/
│   ├── AuthService.test.js
│   ├── LikeService.test.js
│   ├── PostService.test.js
│   └── UserService.test.js
└── setup.js                 # Configuração dos testes
```

## 📁 Estrutura do Projeto

```
src/
├── config/                  # Configurações
│   ├── cors.js
│   ├── database.js
│   ├── errorHandling.js
│   ├── logger.js
│   ├── middlewares.js
│   ├── morgan.js
│   ├── routes.js
│   └── security.js
├── database/
│   ├── migrations/          # Migrations do Sequelize
│   ├── models/             # Modelos do banco
│   ├── seeders/            # Dados iniciais
│   └── index.js
├── middlewares/
│   ├── AuthMiddleware.js
│   ├── ErrorMiddleware.js
│   └── SchemaValidator.js
├── modules/
│   ├── auth/               # Módulo de autenticação
│   ├── posts/              # Módulo de posts
│   └── users/              # Módulo de usuários
├── schemas/                # Schemas de validação Yup
├── utils/                  # Utilitários
└── server.js              # Servidor principal
```

## 🔐 Autenticação

A API utiliza JWT (JSON Web Tokens) para autenticação. Para acessar endpoints protegidos, inclua o token no header:

```
Authorization: Bearer <seu_token>
```

### Exemplo de uso:

```bash
# 1. Criar usuário
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "João Silva", "email": "joao@email.com", "password": "123456"}'

# 2. Fazer login
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email": "joao@email.com", "password": "123456"}'

# 3. Usar o token retornado
curl -X GET http://localhost:3000/posts \
  -H "Authorization: Bearer <seu_token>"
```

## 📊 Paginação

Todos os endpoints de listagem suportam paginação:

```
GET /posts?page=1&limit=10
```

Parâmetros:
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 10, máximo: 100)

## 🎯 Agendamento de Posts

Posts podem ser agendados para publicação futura usando o campo `available_at`:

```json
{
  "title": "Meu Post",
  "content": "Conteúdo do post...",
  "available_at": "2024-12-25T10:00:00Z"
}
```

## 🔄 Sistema de Likes

O sistema de likes funciona como toggle:

- Se o usuário não curtiu o post → adiciona like
- Se o usuário já curtiu o post → remove like

```bash
POST /posts/1/like
```

## 🛡️ Segurança

- **Helmet**: Headers de segurança
- **CORS**: Configuração de origem cruzada
- **bcryptjs**: Criptografia de senhas
- **JWT**: Tokens seguros
- **Validação**: Todos os inputs são validados

## 📝 Logs

A API utiliza Morgan para logging de requisições HTTP:

- Desenvolvimento: Logs coloridos
- Produção: Logs em formato comum

## 🚀 Deploy

### Variáveis de Ambiente para Produção

```env
NODE_ENV=production
PORT=3000
DB_HOST=seu_host_producao
DB_NAME=medium_api_prod
JWT_SECRET=seu_jwt_secret_super_seguro_producao
```

### Comandos de Deploy

```bash
# Instalar dependências
npm ci

# Executar migrations
npm run migrate

# Iniciar aplicação
npm start
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor

Desenvolvido para o Green Amigo Medium Challenge.

---

## 📞 Suporte

Para dúvidas ou suporte, abra uma issue no repositório.