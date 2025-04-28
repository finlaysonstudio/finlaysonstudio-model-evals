import { z } from 'zod';
import { RandomWordSchema, DEFAULT_WORD_OPTIONS } from '../schemas/random-word';

/**
 * Type definitions for the random word package
 */

export type RandomWordResponse = z.infer<typeof RandomWordSchema>;

export type CardSuit = typeof DEFAULT_WORD_OPTIONS[number];

/**
 * Represents a single selection run with information about
 * which word was selected and its position in the original prompt
 */
export interface SelectionRun {
  word: string;
  position: number;
  originalOrder: string[];
}

/**
 * Aggregated results from multiple evaluation runs
 */
export interface EvaluationResult {
  selectedWords: Record<string, number>; // Count of each word selected
  positionBias: Record<number, number>; // Count of each position selected
  totalRuns: number;
  rawSelections: SelectionRun[];
}
