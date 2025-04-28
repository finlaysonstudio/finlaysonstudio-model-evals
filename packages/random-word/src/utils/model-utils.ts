import { z } from 'zod';
import { ModelClient } from '../types/model-client';
import { 
  createStructuredPrompt, 
  ModelPromptParams, 
  StructuredPrompt 
} from '../schemas/model-prompt';
import { RandomWordSchema, DEFAULT_WORD_OPTIONS } from '../schemas/random-word';
import { RandomWordResponse } from '../types';
import { shuffleArray } from './array';

/**
 * Convert a structured prompt object to a formatted string for LLM consumption
 * 
 * @param prompt The structured prompt object
 * @returns A formatted prompt string
 */
export function formatStructuredPrompt(prompt: StructuredPrompt): string {
  let formattedPrompt = `# Task: ${prompt.task}\n\n`;
  
  // Add context
  formattedPrompt += `## Context\n`;
  formattedPrompt += `Available options: ${prompt.context.options.join(', ')}\n\n`;
  
  // Add instructions if provided
  if (prompt.instructions) {
    formattedPrompt += `## Instructions\n${prompt.instructions}\n\n`;
  }
  
  // Add output format instructions
  formattedPrompt += `## Output Format\nPlease respond with a JSON object that has the following structure:\n`;
  formattedPrompt += `{\n  "selectedWord": "The word you randomly selected",\n`;
  formattedPrompt += `  "reason": "(Optional) A brief explanation of your random selection"\n}\n`;
  
  return formattedPrompt;
}

/**
 * Generate a prompt for random word selection with customized presentation
 * 
 * @param options Array of words to choose from
 * @param promptStyle Style of prompt to generate ('simple', 'structured', 'detailed')
 * @returns A formatted prompt string with randomized word order
 */
export function generateRandomWordPrompt(
  options: readonly string[] | string[] = [...DEFAULT_WORD_OPTIONS],
  promptStyle: 'simple' | 'structured' | 'detailed' = 'simple'
): string {
  // Create a shuffled copy of the options
  const shuffledOptions = shuffleArray([...options]);
  
  switch (promptStyle) {
    case 'simple':
      return `Choose a random word from the following list: ${shuffledOptions.join(', ')}`;
      
    case 'structured':
      return formatStructuredPrompt({
        task: 'random word selection',
        context: {
          options: shuffledOptions
        },
        instructions: 'Choose one word from the provided options completely at random. Do not use any pattern or preference. Your selection should be purely random.',
        outputFormat: {
          selectedWord: '',
          reason: ''
        }
      });
      
    case 'detailed':
      return `
# Random Word Selection Task

Please select one word from the following options, making your choice completely at random:

${shuffledOptions.map((word, index) => `${index + 1}. ${word}`).join('\n')}

Do not use any pattern, preference, or bias in making your selection. Your choice should be purely random.

Respond with a JSON object containing:
{
  "selectedWord": "The word you randomly selected",
  "reason": "A brief explanation of your random selection process"
}
`.trim();
      
    default:
      return `Choose a random word from the following list: ${shuffledOptions.join(', ')}`;
  }
}

/**
 * Generate a random word selection using structured output with Zod schemas
 * 
 * @param model The model client to use
 * @param params Options for prompt construction
 * @returns A structured response from the model
 */
export async function generateRandomWordWithStructuredOutput(
  model: ModelClient, 
  params: Partial<ModelPromptParams> = {}
): Promise<RandomWordResponse> {
  // Create and format the structured prompt
  const structuredPrompt = createStructuredPrompt(params);
  const formattedPrompt = formatStructuredPrompt(structuredPrompt);
  
  // Use the model client to generate a structured response
  return await model.generateObject(RandomWordSchema, formattedPrompt);
}

/**
 * Generate a random word selection using the provided model and customized prompt
 * 
 * @param model The model client to use
 * @param options Word options to randomize and present
 * @param promptStyle Style of prompt to generate
 * @returns Promise resolving to the model's selection
 */
export async function generateRandomWordWithCustomPrompt(
  model: ModelClient,
  options: readonly string[] | string[] = [...DEFAULT_WORD_OPTIONS],
  promptStyle: 'simple' | 'structured' | 'detailed' = 'simple'
): Promise<RandomWordResponse> {
  // Generate the appropriate prompt
  const prompt = generateRandomWordPrompt(options, promptStyle);
  
  // Create a schema that accepts the specific options
  const schema = createCustomRandomWordSchema(options);
  
  // Use the model client to generate a structured response
  return await model.generateObject(schema, prompt);
}

/**
 * Create a custom schema for random word selection with specific options
 * 
 * @param options Array of word options to use in the schema
 * @returns A Zod schema configured with the provided options 
 */
export function createCustomRandomWordSchema(options: readonly string[] | string[]): z.ZodObject<{
  selectedWord: z.ZodEnum<[string, ...string[]]>;
  reason: z.ZodOptional<z.ZodString>;
}> {
  // Ensure we have at least one option
  if (!options || options.length === 0) {
    throw new Error('At least one option must be provided for the schema');
  }
  
  return z.object({
    selectedWord: z.enum([options[0], ...options.slice(1)] as [string, ...string[]]),
    reason: z.string().optional(),
  });
}