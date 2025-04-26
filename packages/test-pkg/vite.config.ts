import { defineConfig } from 'vite';
import { resolve } from 'path';
import { mergeConfig } from 'vite';
import baseConfig from '../../packages/vite-base.config';

// Package-specific configuration extending the base config
export default mergeConfig(
  baseConfig, 
  defineConfig({
    // Override base name
    build: {
      lib: {
        entry: resolve(__dirname, 'index.js'),
        name: 'testPkg',
        fileName: (format) => `index.${format}.js`,
      },
    },
  })
);