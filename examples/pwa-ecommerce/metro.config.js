const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

// Add path aliases for monorepo
config.resolver.extraNodeModules = {
  '@app': path.resolve(monorepoRoot, 'app'),
  '@sdk': path.resolve(monorepoRoot, 'sdk'),
  // Force local node_modules for React to avoid version conflicts
  'react': path.resolve(projectRoot, 'node_modules/react'),
  'react-dom': path.resolve(projectRoot, 'node_modules/react-dom'),
  'react/jsx-runtime': path.resolve(projectRoot, 'node_modules/react/jsx-runtime'),
  'react/jsx-dev-runtime': path.resolve(projectRoot, 'node_modules/react/jsx-dev-runtime'),
  // Force local React Query to share context with SDK
  '@tanstack/react-query': path.resolve(projectRoot, 'node_modules/@tanstack/react-query'),
};

// Watch root folder for SDK changes
config.watchFolders = [
  monorepoRoot,
];

// Block resolution of react and react-query from parent node_modules
config.resolver.blockList = [
  /.*\/kf-ai-sdk\/node_modules\/react\/.*/,
  /.*\/kf-ai-sdk\/node_modules\/.pnpm\/react@.*/,
  /.*\/kf-ai-sdk\/node_modules\/@tanstack\/react-query\/.*/,
  /.*\/kf-ai-sdk\/node_modules\/.pnpm\/@tanstack\+react-query@.*/,
];

// Ensure local node_modules is resolved first
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

module.exports = config;
