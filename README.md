# AgentFactory

A modern monorepo for building, compiling, and deploying AI agents with visual workflow management.

## 🚀 Features

- **Visual Agent Builder**: Drag-and-drop interface for creating agent workflows
- **Blueprint Management**: Create, edit, and delete agent blueprints with full CRUD operations
- **Graph Compilation**: Validate and compile agent graphs with comprehensive error checking
- **Deployment Pipeline**: Deploy compiled agents with release management
- **Type-Safe Development**: Full TypeScript support across all packages
- **Monorepo Architecture**: Organized workspace with shared dependencies

## 📦 Package Structure

```
packages/
├── api/          # NestJS REST API server
├── web/          # Next.js frontend application  
├── compiler/     # Agent graph compiler and validator
├── types/        # Shared TypeScript types and Zod schemas
├── sdk/          # Client SDK and CLI tools
└── adapters/     # External service adapters
```

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd AgentFactorySonnet

# Install dependencies
npm install

# Build all packages
npm run build
```

### Development

Start both servers for development:

```bash
# Terminal 1: Start API server (port 3001)
npm run start --workspace=@agentfactory/api

# Terminal 2: Start web server (port 3000)  
npm run start --workspace=@agentfactory/web
```

### Access Points

- **Web Application**: http://localhost:3000
- **API Server**: http://localhost:3001
- **API Documentation**: http://localhost:3001/docs

## 🏗️ Development Commands

```bash
# Build all packages
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Type check
npm run typecheck

# Clean build artifacts
npm run clean
```

## 📚 API Endpoints

### Blueprints
- `GET /blueprints` - List all blueprints
- `POST /blueprints` - Create new blueprint
- `GET /blueprints/:id` - Get blueprint by ID
- `PUT /blueprints/:id` - Update blueprint
- `DELETE /blueprints/:id` - Delete blueprint ✨
- `POST /blueprints/:id/materialize` - Materialize blueprint

### Compilation & Deployment
- `POST /compile` - Compile agent graph
- `GET /compiled` - List compiled projects
- `POST /compiled` - Create compiled project
- `DELETE /compiled/:id` - Delete compiled project
- `POST /deploy` - Deploy agent
- `GET /deploy` - List deployments
- `DELETE /deploy/:releaseId` - Delete deployment

## 🔧 Architecture

- **Frontend**: Next.js with TypeScript, Tailwind CSS
- **Backend**: NestJS with Express, OpenAPI documentation
- **Validation**: Zod schemas with TypeScript integration
- **Build System**: TypeScript with composite projects
- **Storage**: File-based JSON storage (development)

## 🚀 Recent Updates

- ✅ Fixed TypeScript compilation across all packages
- ✅ Resolved ES/CommonJS module compatibility issues  
- ✅ Implemented complete blueprint CRUD operations
- ✅ Added working delete functionality for blueprints
- ✅ Both API and web servers running successfully

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions, please open an issue in the GitHub repository.