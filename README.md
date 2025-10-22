# AgentFactory Visual Builder

A modern visual agent blueprint creator with drag-and-drop workflow management. Build, visualize, and export multi-agent systems with an intuitive node-based interface.

## 🌐 Live Demo

**[View Live Demo](https://ndsweeney.github.io/agentvisualiser/)**

## 🚀 Features

- **Visual Agent Builder**: Drag-and-drop interface for creating agent workflows
- **Blueprint Management**: Create, edit, and manage agent blueprints locally
- **Real-time Validation**: Instant feedback on your agent configurations
- **Export Options**: Save as PNG, JPG, or JSON
- **Built-in Examples**: Sample blueprints to get you started
- **No Backend Required**: Works completely in your browser with localStorage

## ✨ What You Can Do

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

## 🛠️ Local Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/ndsweeney/agentvisualiser.git
cd agentvisualiser

# Install dependencies
npm install

# Build the types package
npm run build --workspace=@agentfactory/types

# Start development server
npm run dev:web
```

Visit `http://localhost:3000`

### Build for Production

```bash
# Build static site
npm run build:gh-pages

# Test locally
npx serve packages/web/out
```

## 📦 Project Structure

```
packages/
├── web/          # Next.js frontend application  
└── types/        # Shared TypeScript types and Zod schemas
```

## 💾 Data Storage

All blueprints are stored in your browser's localStorage:
- ✅ No server required
- ✅ Works completely offline after initial load
- ✅ Fast and instant saves
- ⚠️ Data is browser/device specific
- ⚠️ Export JSON to backup your blueprints

## 🚀 Deployment

This project is configured for automatic deployment to GitHub Pages.

When you push to the `main` branch:
1. GitHub Actions automatically builds the static site
2. Deploys to GitHub Pages
3. Your site is live at `https://ndsweeney.github.io/agentvisualiser/`

## 🎯 Technology Stack

- **Frontend**: Next.js 14 with TypeScript
- **UI**: React Flow, Tailwind CSS, Radix UI
- **Validation**: Zod schemas
- **Storage**: Browser localStorage
- **Deployment**: GitHub Pages with GitHub Actions

## 📝 License

MIT License

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 🔗 Links

- [Live Demo](https://ndsweeney.github.io/agentvisualiser/)
- [GitHub Repository](https://github.com/ndsweeney/agentvisualiser)
- [Documentation](./GITHUB_PAGES_DEPLOYMENT.md)