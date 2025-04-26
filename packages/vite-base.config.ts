import { defineConfig } from 'vite';
import { resolve } from 'path';

// Base Vite configuration for packages to extend
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'packageName', // Should be overridden by package config
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      // Make sure to externalize deps that shouldn't be bundled
      external: ['react', 'react-dom'],
      output: {
        // Global variables to use in UMD build for externalized deps
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});