/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Transpile local packages in the monorepo
  transpilePackages: ['@agentfactory/types'],
  
  webpack: (config) => {
    // Ensure TypeScript files from local packages are processed
    config.resolve.extensions.push('.ts', '.tsx');
    return config;
  },
  // Configure for GitHub Pages deployment at https://ndsweeney.github.io/agentvisualiser/
  basePath: '/agentvisualiser',
  assetPrefix: '/agentvisualiser/',
}

module.exports = nextConfig