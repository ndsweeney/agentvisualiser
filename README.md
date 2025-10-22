# AgentFactory

A modern monorepo for building, compiling, and deploying AI agents with visual workflow management.

## 🚀 Features

- **Visual Agent Builder**: Drag-and-drop interface for creating agent workflows
- **Blueprint Management**: Create, edit, and delete agent blueprints with full CRUD operations
- **Graph Compilation**: Validate and compile agent graphs with comprehensive error checking
- **Deployment Pipeline**: Deploy compiled agents with release management
- **Type-Safe Development**: Full TypeScript support across all packages
- **Monorepo Architecture**: Organized workspace with shared dependencies
- **GitHub Pages Ready**: Deploy as a static site with automatic CI/CD

## 🌐 Live Demo

**[View Live Demo on GitHub Pages](https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/)**

> Update the URL above after deploying to GitHub Pages

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

Or for the web app only (static mode):

```bash
npm run dev:web
```

### Access Points

- **Web Application**: http://localhost:3000
- **API Server**: http://localhost:3001
- **API Documentation**: http://localhost:3001/docs

## 🚀 Deployment to GitHub Pages

### Automatic Deployment (Recommended)

This repository is configured for automatic deployment to GitHub Pages when you push to the `main` branch.

**Setup Steps:**

1. **Enable GitHub Pages in Repository Settings:**
   - Go to your repository on GitHub
   - Navigate to `Settings` → `Pages`
   - Under "Build and deployment", select:
     - **Source**: GitHub Actions
   - Click Save

2. **Configure Base Path (if using repository subdirectory):**
   
   If your GitHub Pages URL is `https://username.github.io/repo-name/`, update `packages/web/next.config.js`:
   
   ```javascript
   const nextConfig = {
     // ...existing config...
     basePath: '/your-repo-name',
     assetPrefix: '/your-repo-name/',
   }
   ```

3. **Push to Main Branch:**
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

4. **Wait for Deployment:**
   - Go to the `Actions` tab in your GitHub repository
   - Watch the deployment workflow complete
   - Your site will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

### Manual Deployment

Build and test locally before deploying:

```bash
# Build the static site
npm run build:gh-pages

# The static files will be in packages/web/out/
# You can test them locally with a static server:
npx serve packages/web/out
```

## 🏗️ Development Commands

```bash
# Build all packages
npm run build

# Build for GitHub Pages
npm run build:gh-pages

# Run tests
npm test

# Lint code
npm run lint

# Type check
npm run typecheck

# Clean build artifacts
npm run clean

# Format code
npm run format
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

- **Frontend**: Next.js with TypeScript, Tailwind CSS, React Flow
- **Backend**: NestJS with Express, OpenAPI documentation
- **Storage**: Browser localStorage (client-side), File-based JSON (API server)
- **Validation**: Zod schemas with TypeScript integration
- **Build System**: TypeScript with composite projects
- **Deployment**: Static export for GitHub Pages

## ✨ Features

### Visual Blueprint Creator
- 🎨 Drag-and-drop node-based interface
- 🔗 Connect agents with edges
- ⚙️ Configure agent properties
- 📊 Real-time validation
- 💾 Save blueprints locally
- 📤 Export as PNG, JPG, or JSON
- 📥 Import from JSON

### Built-in Example Blueprints
- Multi-Agent Collaboration
- Approval Chain Workflow
- Data Pipeline Processing
- Helpdesk Automation
- Maker-Checker Pattern

### Data Storage
All blueprints are stored in your browser's localStorage:
- ✅ No server required for the web app
- ✅ Works completely offline after initial load
- ✅ Fast and instant saves
- ⚠️ Data is browser/device specific
- ⚠️ Export JSON to backup your blueprints

## 🚀 Recent Updates

- ✅ Fixed TypeScript compilation across all packages
- ✅ Resolved ES/CommonJS module compatibility issues  
- ✅ Implemented complete blueprint CRUD operations
- ✅ Added working delete functionality for blueprints
- ✅ Configured for GitHub Pages deployment
- ✅ Added automatic CI/CD with GitHub Actions
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

## 🔗 Links

- [Documentation](./GITHUB_PAGES_DEPLOYMENT.md)
- [Integration Guide](./INTEGRATION_QUICKSTART.md)
- [Report Flow](./REPORT_INGESTION_FLOW.md)