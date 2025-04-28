/**
 * Entry point for the random-word evaluation package
 */
import { ModelClient } from './types/model-client';
import { shuffleArray } from './utils/array';
import { RandomWordResponse, EvaluationResult, SelectionRun } from './types';
import { RandomWordSchema, DEFAULT_WORD_OPTIONS } from './schemas/random-word';
import { calculateWordFrequency } from './analysis/word-frequency';
import { calculatePositionBias } from './analysis/position-bias';
import { PromptStyle } from './schemas/model-prompt';
import { 
  generateRandomWordPrompt,
  generateRandomWordWithCustomPrompt,
  createCustomRandomWordSchema
} from './utils/model-utils';

export * from './analysis';
export * from './schemas';
export * from './types';
export * from './utils/array';
export * from './utils/model-utils';
import { runTrackedEvaluation } from './utils/tracking-utils';
export * from './utils/tracking-utils';

/**
 * Creates a prompt with randomized word options
 * @param options Array of words to randomize
 * @param promptStyle Style of prompt to generate
 * @returns A prompt string with shuffled options
 */
export function getPromptWithRandomizedOptions(
  options: readonly string[] | string[],
  promptStyle: PromptStyle = 'simple'
): string {
  return generateRandomWordPrompt([...options], promptStyle);
}

/**
 * Function to get random word selection from a model
 * @param model The model client to use
 * @param options Array of word options to choose from
 * @param promptStyle Style of prompt to generate
 * @returns Promise resolving to the model's selection
 */
export async function getRandomWordSelection(
  model: ModelClient, 
  options: readonly string[] | string[] = [...DEFAULT_WORD_OPTIONS],
  promptStyle: PromptStyle = 'simple'
): Promise<RandomWordResponse> {
  return generateRandomWordWithCustomPrompt(model, options, promptStyle);
}

/**
 * Runs a single evaluation and tracks the selected word and its position
 * @param model The model client to use
 * @param options Array of word options to choose from
 * @param promptStyle Style of prompt to generate
 * @returns Promise resolving to selection details including word and position
 */
export async function runSingleEvaluation(
  model: ModelClient,
  options: readonly string[] | string[] = [...DEFAULT_WORD_OPTIONS],
  promptStyle: PromptStyle = 'simple'
): Promise<SelectionRun> {
  // Shuffle the options to randomize position
  const shuffledOptions = shuffleArray([...options]);
  
  // Generate prompt with the desired style
  const prompt = getPromptWithRandomizedOptions(shuffledOptions, promptStyle);
  
  // Create a schema that matches the shuffled options
  const schema = createCustomRandomWordSchema(shuffledOptions);
  
  // Get model response using the customized schema
  const response = await model.generateObject(schema, prompt);
  
  // Find position of selected word in the shuffled array
  const position = shuffledOptions.indexOf(response.selectedWord);
  
  return {
    word: response.selectedWord,
    position,
    originalOrder: shuffledOptions
  };
}

/**
 * Options for evaluation
 */
export interface EvaluationOptions {
  options?: readonly string[] | string[];
  numRuns?: number;
  promptStyle?: PromptStyle;
  tracking?: {
    enabled: boolean;
    name: string;
    description?: string;
    modelProvider: 'openai' | 'anthropic';
    modelName: string;
  };
}

/**
 * Runs multiple evaluations and collects statistics on randomness
 * @param model The model client to use
 * @param evalOptions Configuration options for the evaluation
 * @returns Promise resolving to evaluation results with statistics
 */
export async function evaluateRandomWordSelection(
  model: ModelClient,
  evalOptions: EvaluationOptions = {}
): Promise<EvaluationResult> {
  const { 
    options = [...DEFAULT_WORD_OPTIONS],
    numRuns = 100,
    promptStyle = 'simple',
    tracking
  } = evalOptions;

  // Use tracking if enabled
  if (tracking?.enabled) {
    const { results } = await runTrackedEvaluation(model, {
      name: tracking.name,
      description: tracking.description,
      modelProvider: tracking.modelProvider,
      modelName: tracking.modelName,
      wordOptions: options,
      numRuns,
      promptStyle
    });

    // Calculate statistics using the tracked results
    const selectedWords = calculateWordFrequency(results.rawSelections);
    const positionBias = calculatePositionBias(results.rawSelections);
    
    return {
      selectedWords,
      positionBias,
      totalRuns: numRuns,
      rawSelections: results.rawSelections
    };
  }
  
  // Non-tracking implementation (original behavior)
  const selections: SelectionRun[] = [];
  
  // Run the specified number of evaluations
  for (let i = 0; i < numRuns; i++) {
    const result = await runSingleEvaluation(model, options, promptStyle);
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