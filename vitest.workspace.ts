import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  "./vite.config.ts",
  "./packages/models/vite.config.ts",
  "./packages/random-word/vite.config.ts",
  "./packages/cli/vite.config.ts"
])
