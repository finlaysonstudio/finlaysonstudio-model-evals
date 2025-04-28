/**
 * Entry point for the random-word evaluation package
 */
import { ModelClient } from './types/model-client';
import { shuffleArray } from './utils/array';
import { RandomWordResponse } from './types';
import { RandomWordSchema } from './schemas/random-word';
export * from './analysis';
export * from './schemas';
export * from './types';
export * from './utils/array';

/**
 * Creates a prompt with randomized word options
 * @param options Array of words to randomize
 * @returns A prompt string with shuffled options
 */
export function getPromptWithRandomizedOptions(options: string[]): string {
  const shuffledOptions = shuffleArray(options);
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
  options: string[]
): Promise<RandomWordResponse> {
  const prompt = getPromptWithRandomizedOptions(options);
  
  // Use the structured output capability
  const response = await model.generateObject(
    RandomWordSchema,
    prompt
  );
  
  return response;
}