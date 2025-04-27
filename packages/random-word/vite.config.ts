import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'EvalRandomWords',
      fileName: (format) => `index.${format}.js`,
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});
