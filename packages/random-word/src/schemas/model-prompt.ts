import { z } from 'zod';
import { DEFAULT_WORD_OPTIONS } from './random-word';

/**
 * Schema for the model prompt parameters
 */
export const ModelPromptParamsSchema = z.object({
  wordOptions: z.array(z.string()).default([...DEFAULT_WORD_OPTIONS]),
  randomize: z.boolean().default(true),
  includeInstructions: z.boolean().default(true),
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
  const options = [...wordOptions];
  
  // Randomize order if requested
  if (randomize) {
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
  }
  
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