/**
 * Entry point for the random-word evaluation package
 */
import { ModelClient } from './types/model-client';
import { shuffleArray } from './utils/array';
import { RandomWordResponse, EvaluationResult, SelectionRun } from './types';
import { RandomWordSchema, DEFAULT_WORD_OPTIONS } from './schemas/random-word';
import { calculateWordFrequency } from './analysis/word-frequency';
import { calculatePositionBias } from './analysis/position-bias';

export * from './analysis';
export * from './schemas';
export * from './types';
export * from './utils/array';
export * from './utils/model-utils';

/**
 * Creates a prompt with randomized word options
 * @param options Array of words to randomize
 * @returns A prompt string with shuffled options
 */
export function getPromptWithRandomizedOptions(options: readonly string[] | string[]): string {
  const shuffledOptions = shuffleArray([...options]);
  return `Choose a random word from the following list: ${shuffledOptions.join(', ')}`;
}

/**
 * Function to get random word selection from a model
 * @param model The model client to use
 * @param options Array of word options to choose from
 * @returns Promise resolving to the model's selection
 */
export async function getRandomWordSelection(
  model: ModelClient, 
  options: readonly string[] | string[] = [...DEFAULT_WORD_OPTIONS]
): Promise<RandomWordResponse> {
  const prompt = getPromptWithRandomizedOptions([...options]);
  
  // Use the structured output capability
  const response = await model.generateObject(
    RandomWordSchema,
    prompt
  );
  
  return response;
}

/**
 * Runs a single evaluation and tracks the selected word and its position
 * @param model The model client to use
 * @param options Array of word options to choose from
 * @returns Promise resolving to selection details including word and position
 */
export async function runSingleEvaluation(
  model: ModelClient,
  options: readonly string[] | string[] = [...DEFAULT_WORD_OPTIONS]
): Promise<SelectionRun> {
  // Shuffle the options to randomize position
  const shuffledOptions = shuffleArray([...options]);
  const prompt = `Choose a random word from the following list: ${shuffledOptions.join(', ')}`;
  
  // Get model response
  const response = await model.generateObject(
    RandomWordSchema,
    prompt
  );
  
  // Find position of selected word in the shuffled array
  const position = shuffledOptions.indexOf(response.selectedWord);
  
  return {
    word: response.selectedWord,
    position,
    originalOrder: shuffledOptions
  };
}

/**
 * Runs multiple evaluations and collects statistics on randomness
 * @param model The model client to use
 * @param options Array of word options to choose from
 * @param numRuns Number of evaluation runs to perform
 * @returns Promise resolving to evaluation results with statistics
 */
export async function evaluateRandomWordSelection(
  model: ModelClient,
  options: readonly string[] | string[] = [...DEFAULT_WORD_OPTIONS],
  numRuns: number = 100
): Promise<EvaluationResult> {
  const selections: SelectionRun[] = [];
  
  // Run the specified number of evaluations
  for (let i = 0; i < numRuns; i++) {
    const result = await runSingleEvaluation(model, options);
    selections.push(result);
  }
  
  // Calculate statistics
  const selectedWords = calculateWordFrequency(selections);
  const positionBias = calculatePositionBias(selections);
  
  return {
    selectedWords,
    positionBias,
    totalRuns: numRuns,
    rawSelections: selections
  };
}