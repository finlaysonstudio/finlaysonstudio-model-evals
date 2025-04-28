import { z } from 'zod';

/**
 * Schema for random word selection response
 */
export const RandomWordSchema = z.object({
  selectedWord: z.string(),
  reason: z.string().optional(),
});
