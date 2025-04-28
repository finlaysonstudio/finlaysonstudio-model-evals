import { z } from 'zod';
import { RandomWordSchema } from '../schemas/random-word';

/**
 * Type definitions for the random word package
 */

export type RandomWordResponse = z.infer<typeof RandomWordSchema>;

export interface EvaluationResult {
  selectedWords: Record<string, number>; // Count of each word selected
  positionBias: Record<number, number>; // Count of each position selected
  totalRuns: number;
}
