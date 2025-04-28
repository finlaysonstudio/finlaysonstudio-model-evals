import { z } from 'zod';
import { DEFAULT_WORD_OPTIONS } from './random-word';
import { shuffleArray } from '../utils/array';

/**
 * Schema for the model prompt parameters
 */
export const ModelPromptParamsSchema = z.object({
  wordOptions: z.array(z.string()).default([...DEFAULT_WORD_OPTIONS]),
  randomize: z.boolean().default(true),
  includeInstructions: z.boolean().default(true),
  promptStyle: z.enum(['simple', 'structured', 'detailed']).default('structured'),
});

export type ModelPromptParams = z.infer<typeof ModelPromptParamsSchema>;

/**
 * Schema for the structured prompt template
 */
export const StructuredPromptSchema = z.object({
  task: z.string(),
  context: z.object({
    options: z.array(z.string())
  }),
  instructions: z.string(),
  outputFormat: z.object({
    selectedWord: z.string().describe('The randomly selected word from the provided options'),
    reason: z.string().optional().describe('Optional explanation for why this word was selected randomly')
  })
});

export type StructuredPrompt = z.infer<typeof StructuredPromptSchema>;

/**
 * Styles of prompts available for random word selection
 */
export type PromptStyle = 'simple' | 'structured' | 'detailed';

/**
 * Creates a standardized structured prompt for random word selection
 * 
 * @param params Configuration options for the prompt
 * @returns A structured prompt object ready to be serialized
 */
export function createStructuredPrompt(
  params: Partial<ModelPromptParams> = {}
): StructuredPrompt {
  const validatedParams = ModelPromptParamsSchema.parse(params);
  const { wordOptions, randomize, includeInstructions } = validatedParams;
  
  // Use provided word options or defaults
  const options = randomize ? shuffleArray([...wordOptions]) : [...wordOptions];
  
  return {
    task: 'random word selection',
    context: {
      options
    },
    instructions: includeInstructions 
      ? 'Choose one word from the provided options completely at random. Do not use any pattern or preference. Your selection should be purely random.'
      : '',
    outputFormat: {
      selectedWord: '',
      reason: ''
    }
  };
}

/**
 * Creates a prompt string for simple random word selection
 * 
 * @param options Array of word options, possibly randomized
 * @returns A simple prompt string for random word selection
 */
export function createSimplePrompt(options: string[]): string {
  return `Choose a random word from the following list: ${options.join(', ')}`;
}

/**
 * Creates a detailed prompt for random word selection
 * 
 * @param options Array of word options, possibly randomized
 * @returns A detailed prompt string for random word selection
 */
export function createDetailedPrompt(options: string[]): string {
  return `
# Random Word Selection Task

Please select one word from the following options, making your choice completely at random:

${options.map((word, index) => `${index + 1}. ${word}`).join('\n')}

Do not use any pattern, preference, or bias in making your selection. Your choice should be purely random.

Respond with a JSON object containing:
{
  "selectedWord": "The word you randomly selected",
  "reason": "A brief explanation of your random selection process"
}
`.trim();
}