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

/**
 * Schema for a single selection run
 */
export const SelectionRunSchema = z.object({
  word: z.string(),
  position: z.number().int().min(0),
  originalOrder: z.array(z.string()),
});

/**
 * Schema for word frequency statistics
 */
export const WordFrequencySchema = z.record(z.string(), z.number().int().min(0));

/**
 * Schema for position bias statistics
 */
export const PositionBiasSchema = z.record(z.string(), z.number().int().min(0));

/**
 * Schema for the complete evaluation result
 */
export const EvaluationResultSchema = z.object({
  selectedWords: WordFrequencySchema,
  positionBias: PositionBiasSchema, 
  totalRuns: z.number().int().positive(),
  rawSelections: z.array(SelectionRunSchema),
});
