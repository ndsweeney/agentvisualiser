# Agent Visualiser Tool - GitHub Pages Deployment Guide

This application is now a fully client-side static app that can be deployed to GitHub Pages!

## What Changed

- ✅ All API calls replaced with localStorage
- ✅ Blueprints stored in browser's localStorage
- ✅ Built-in sample blueprints automatically loaded on first visit
- ✅ Next.js configured for static export
- ✅ No backend server required

## Deployment Steps

### 1. Build the Static Site

From the `packages/web` directory, run:

```bash
npm run build
```

This will create an `out` folder with your static site.

### 2. Deploy to GitHub Pages

#### Option A: Using GitHub Actions (Recommended)

1. Create a `.github/workflows/deploy.yml` file in your repository root:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        cd packages/web
        npm install
        
    - name: Build
      run: |
        cd packages/web
        npm run build
        
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./packages/web/out
```

2. Enable GitHub Pages in your repository settings:
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` / `root`

#### Option B: Manual Deployment

1. Build the site:
```bash
cd packages/web
npm run build
```

2. The static files will be in the `out` folder

3. Push the `out` folder contents to the `gh-pages` branch:
```bash
cd out
git init
git add -A
git commit -m 'Deploy to GitHub Pages'
git branch -M gh-pages
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -f origin gh-pages
```

### 3. Configure for Repository Subdirectory (if needed)

If your GitHub Pages URL is `https://username.github.io/repo-name/` (not a custom domain), you need to update `next.config.js`:

```javascript
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/your-repo-name',
  assetPrefix: '/your-repo-name/',
}
```

Replace `your-repo-name` with your actual repository name.

## Local Development

```bash
cd packages/web
npm run dev
```

Visit `http://localhost:3000`

## Features

- ✨ Visual blueprint creator
- 📁 Blueprints stored in browser localStorage
- 🎨 Built-in sample blueprints (Multi-Agent, Approval Chain, Data Pipeline)
- 📤 Export diagrams as PNG, JPG, or JSON
- 📥 Import diagrams from JSON
- 🗑️ Clear canvas
- 💾 Save and manage blueprints locally

## Data Storage

All blueprints are stored in your browser's localStorage. This means:
- ✅ No server or database required
- ✅ Works completely offline after initial load
- ✅ Fast and instant saves
- ⚠️ Data is specific to each browser/device
- ⚠️ Clearing browser data will delete blueprints (export to backup!)

## Backup Your Blueprints

Use the Export JSON feature to save your blueprints as files. You can then:
- Store them in cloud storage (Dropbox, Google Drive, etc.)
- Version control them with Git
- Share them with others
- Import them on different devices/browsers

## Troubleshooting

### Blueprints not loading
- Check browser console for errors
- Ensure localStorage is enabled in your browser
- Try clearing cache and reloading

### GitHub Pages shows 404
- Ensure `.nojekyll` file is in the `out` folder
- Check that `basePath` and `assetPrefix` are configured correctly
- Wait a few minutes after deployment for changes to propagate

### Build fails
- Run `npm install` to ensure all dependencies are installed
- Check for TypeScript errors: `npm run typecheck`
- Ensure Node.js version is 18 or higher

## Need Help?

The app works entirely in your browser - no backend needed! All your data stays on your device.
