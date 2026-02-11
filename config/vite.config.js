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
      entry: {
        // Main entry points
        form: path.resolve(__dirname, '../sdk/form.ts'),
        'form.types': path.resolve(__dirname, '../sdk/form.types.ts'),
        table: path.resolve(__dirname, '../sdk/table.ts'),
        'table.types': path.resolve(__dirname, '../sdk/table.types.ts'),
        kanban: path.resolve(__dirname, '../sdk/kanban.ts'),
        'kanban.types': path.resolve(__dirname, '../sdk/kanban.types.ts'),
        'kanban.ui': path.resolve(__dirname, '../sdk/kanban.ui.ts'),
        filter: path.resolve(__dirname, '../sdk/filter.ts'),
        'filter.types': path.resolve(__dirname, '../sdk/filter.types.ts'),
        auth: path.resolve(__dirname, '../sdk/auth.ts'),
        'auth.types': path.resolve(__dirname, '../sdk/auth.types.ts'),
        api: path.resolve(__dirname, '../sdk/api.ts'),
        'api.types': path.resolve(__dirname, '../sdk/api.types.ts'),
        workflow: path.resolve(__dirname, '../sdk/workflow.ts'),
        'workflow.types': path.resolve(__dirname, '../sdk/workflow.types.ts'),
        utils: path.resolve(__dirname, '../sdk/utils.ts'),
        types: path.resolve(__dirname, '../sdk/base-types.ts'),
      },
      name: 'KfAiSdk',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'mjs' : 'cjs';
        return `${entryName}.${ext}`;
      },
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@tanstack/react-query',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@tanstack/react-query': 'ReactQuery',
        },
        // Preserve module structure for proper tree-shaking
        preserveModules: false,
      },
    },
  },
  server: {
    port: 3000,
  },
});
