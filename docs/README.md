# AgentFactory

A production-ready platform for building and deploying multi-agent systems with TypeScript.

## Quickstart

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

```bash
npm install
```

### Development

Start the API server:
```bash
npm run dev:api
```

Start the web interface:
```bash
npm run dev:web
```

### CLI Usage

Compile and deploy via CLI:

```bash
# Generate a blueprint
npx af blueprint multi-agent | tee tmp.project.json

# Compile the project
npx af compile -f tmp.project.json | tee tmp.compiled.json

# Deploy to development environment
npx af deploy -f tmp.compiled.json -e dev
```

### Build & Test

```bash
# Build all workspaces
npm run build

# Run all tests
npm run test

# Lint all code
npm run lint
```

## Architecture

AgentFactory consists of several npm workspaces:

- **@agentfactory/types** - Shared TypeScript types and Zod schemas
- **@agentfactory/compiler** - Agent graph compilation and validation
- **@agentfactory/api** - NestJS REST API with OpenAPI docs
- **@agentfactory/adapters** - Tool adapters for external systems
- **@agentfactory/sdk** - CLI and client SDK
- **@agentfactory/web** - Next.js web interface with visual composer

## License

MIT