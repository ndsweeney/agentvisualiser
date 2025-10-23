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
  // Custom domain configuration: agentvisualiser.agentops.co.uk
  // No base path needed for custom domain deployment
}

module.exports = nextConfig