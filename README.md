# CMS Backend API

Educational CMS API built with Express.js and TypeScript.

## 📋 Requirements

- **Node.js**: >= 24.0.0
- **npm**: >= 10.0.0

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Development

Start the development server with hot reload:

```bash
npm run dev
```

The API will be available at `http://localhost:5000`
Swagger docs at `http://localhost:5000/api-docs`

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload (ts-node-dev) |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Run the compiled server |
| `npm run lint` | Run ESLint with auto-fix |
| `npm run lint:check` | Check for linting issues without fixing |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting without changes |
| `npm run type-check` | Run TypeScript compiler without emitting files |
| `npm run clean` | Remove dist directory |
| `npm test` | Run tests (placeholder) |

## 🔧 Configuration

### Git Hooks (Husky)

This project uses Husky for automated git hooks:

- **pre-commit**: Runs `lint-staged` and TypeScript type checking
- **commit-msg**: Validates commit messages with conventional commits format

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

Examples:
- feat(auth): add login functionality
- fix(api): resolve endpoint issue
- docs: update README
- chore(deps): update dependencies
```

### Code Quality

- **Linter**: ESLint with TypeScript support
- **Formatter**: Prettier
- **Pre-commit**: Automated linting and formatting via lint-staged

## 📚 API Documentation

The API uses Swagger/OpenAPI for documentation. After starting the server, visit:
`http://localhost:5000/api-docs`

## 🏗️ Project Structure

```
src/
├── app.ts              # Express application entry point
├── config/
│   └── swagger.ts      # Swagger/OpenAPI configuration
└── utils/              # Utility functions (coming soon)
```

## 🔐 Environment Variables

See `.env.example` for available configuration options.

## 📝 License

ISC
