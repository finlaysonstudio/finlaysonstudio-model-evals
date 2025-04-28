/**
 * ModelClient interface for interacting with LLM models
 * This mirrors the interface from @finlaysonstudio/eval-models
 */
import { z } from 'zod';

export interface ModelClient {
  generateResponse: (prompt: string) => Promise<string>;
  generateObject: <T extends z.ZodTypeAny>(schema: T, prompt: string) => Promise<z.infer<T>>;
}