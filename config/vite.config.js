import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: '..',
  resolve: {
    alias: {
      '@sdk': path.resolve(__dirname, '../sdk'),
      '@app': path.resolve(__dirname, '../app'),
    },
  },
  build: {
    outDir: 'dist',
    lib: {
      entry: {
        sdk: path.resolve(__dirname, '../sdk/index.ts'),
        app: path.resolve(__dirname, '../app/index.ts'),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.${format}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
    },
  },
  server: {
    port: 3000,
  },
});