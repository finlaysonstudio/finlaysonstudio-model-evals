import { defineConfig } from 'vite';
import { resolve } from 'path';
import baseConfig from './vite-base.config';
import { mergeConfig } from 'vite';

// Package-specific configuration extending the base config
export default mergeConfig(
  baseConfig, 
  defineConfig({
    // Override base name
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'packageName', // Replace with actual package name
        fileName: (format) => `index.${format}.js`,
      },
    },
    // Additional package-specific configuration here
  })
);