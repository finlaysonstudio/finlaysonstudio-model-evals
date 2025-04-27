import { z } from 'zod';
import { ModelClient } from '@finlaysonstudio/eval-models';

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function getPromptWithRandomizedOptions(options: string[]): string {
  const shuffledOptions = shuffleArray(options);
  return `Choose a random word from the following list: ${shuffledOptions.join(', ')}`;
}

// Define the output schema for random word selection
export const RandomWordSchema = z.object({
  selectedWord: z.string(),
  reason: z.string().optional(),
});

export type RandomWordResponse = z.infer<typeof RandomWordSchema>;

// Function to get random word selection from a model
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