import { z } from 'zod';

/**
 * Default set of cards suits for testing randomness
 */
export const DEFAULT_WORD_OPTIONS = ['clubs', 'diamonds', 'hearts', 'spades'] as const;

/**
 * Schema for random word selection response
 */
export const RandomWordSchema = z.object({
  selectedWord: z.enum(DEFAULT_WORD_OPTIONS),
  reason: z.string().optional(),
});
