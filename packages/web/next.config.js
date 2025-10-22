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
  // Uncomment these lines if deploying to GitHub Pages with a repository name
  // basePath: '/your-repo-name',
  // assetPrefix: '/your-repo-name/',
}

module.exports = nextConfig