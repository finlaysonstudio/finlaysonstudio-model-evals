# Vite Build Process Setup

This document explains how Vite is configured in this monorepo for building packages.

## Root Configuration

The root `vite.config.ts` file contains the base configuration used by the root workspace. This is primarily used for development and testing purposes.

## Package Configuration

Each package in the monorepo should have its own Vite configuration that extends the base configuration:

1. Create a `vite.config.ts` file in your package directory
2. Import and extend the base configuration using `mergeConfig`
3. Customize as needed for your package

Example:

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { mergeConfig } from 'vite';
import baseConfig from '../vite-base.config';

export default mergeConfig(
  baseConfig, 
  defineConfig({
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'yourPackageName',
        fileName: (format) => `index.${format}.js`,
      },
    },
    // Additional package-specific configuration
  })
);
```

## Package.json Configuration

Each package should include build scripts in its `package.json`:

```json
{
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch"
  }
}
```

## Running Builds

- Build all packages: `npm run build` from the root
- Build a specific package: `npm run build` from the package directory or `npm run build -w @finlaysonstudio-model-evals/your-package` from the root

## Development Mode

Run `npm run dev` from the root to start the development server for testing.

## Build Output

By default, packages will output to a `dist` directory with both ESM and UMD formats.