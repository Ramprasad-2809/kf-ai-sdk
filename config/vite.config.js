import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname, '..'),
  resolve: {
    alias: {
      '@sdk': path.resolve(__dirname, '../sdk'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../dist'),
    lib: {
      entry: path.resolve(__dirname, '../sdk/index.ts'),
      name: 'KfAiSdk',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', '@tanstack/react-query', 'react-hook-form'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@tanstack/react-query': 'ReactQuery',
          'react-hook-form': 'ReactHookForm',
        },
      },
    },
  },
  server: {
    port: 3000,
  },
});