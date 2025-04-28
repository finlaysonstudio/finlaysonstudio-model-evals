import { ResponseTracker, EvaluationRunStatus, EvaluationRunType } from '@finlaysonstudio/eval-models';
import { PromptStyle } from '../schemas/model-prompt';
import { ModelClient } from '../types/model-client';
import { 
  RandomWordResponse, 
  EvaluationResult, 
  SelectionRun 
} from '../types';
import { runSingleEvaluation } from '../index';

/**
 * Options for tracked evaluations
 */
export interface TrackedEvaluationOptions {
  name: string;
  description?: string;
  modelProvider: 'openai' | 'anthropic';
  modelName: string;
  wordOptions: readonly string[] | string[];
  numRuns?: number;
  promptStyle?: PromptStyle;
}

/**
 * Runs a single evaluation and tracks the response in the database
 * 
 * @param model The model client to use
 * @param evaluationRunId ID of the evaluation run to track responses for
 * @param options Word options to choose from
 * @param promptIndex Index of the prompt in the evaluation run
 * @param promptStyle Style of prompt to use
 * @returns Selection run details
 */
export async function runAndTrackSingleEvaluation(
  model: ModelClient,
  evaluationRunId: string,
  options: readonly string[] | string[],
  promptIndex: number,
  promptStyle: PromptStyle = 'simple'
): Promise<SelectionRun> {
  // Start timing the response
  const startTime = Date.now();
  
  try {
    // Run the evaluation
    const result = await runSingleEvaluation(model, options, promptStyle);
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Construct the tracking data
    const trackingData = {
      promptIndex,
      prompt: `Choose a random word from: ${result.originalOrder.join(', ')}`,
      rawResponse: JSON.stringify({ 
        selectedWord: result.word,
        position: result.position
      }),
      parsedResponse: {
        selectedWord: result.word,
        position: result.position,
        originalOrder: result.originalOrder
      },
      responseTime,
      metadata: {
        promptStyle,
        wordOptions: options
      }
    };
    
    // Record the response in the database
    await ResponseTracker.recordResponse(evaluationRunId, trackingData);
    
    return result;
  } catch (error) {
    // Calculate response time even for errors
    const responseTime = Date.now() - startTime;
    
    // Construct error tracking data
    const errorMessage = error instanceof Error ? error.message : String(error);
    const trackingData = {
      promptIndex,
      prompt: `Choose a random word from: ${Array.isArray(options) ? options.join(', ') : 'unknown'}`,
      rawResponse: JSON.stringify({ error: errorMessage }),
      responseTime,
      error: errorMessage,
      metadata: {
        promptStyle,
        wordOptions: options
      }
    };
    
    // Record the error in the database
    await ResponseTracker.recordResponse(evaluationRunId, trackingData);
    
    // Re-throw to allow caller to handle
    throw error;
  }
}

/**
 * Runs multiple evaluations with tracking and collects statistics
 * 
 * @param model The model client to use
 * @param options Configuration for the tracked evaluation
 * @returns Evaluation results with statistics
 */
export async function runTrackedEvaluation(
  model: ModelClient,
  options: TrackedEvaluationOptions
): Promise<{ evaluationRunId: string, results: EvaluationResult }> {
  const { 
    name, 
    description, 
    modelProvider, 
    modelName, 
    wordOptions, 
    numRuns = 100, 
    promptStyle = 'simple' 
  } = options;
  
  // Create a new evaluation run in the database
  const evaluationRun = await ResponseTracker.createEvaluationRun(name, {
    description,
    type: EvaluationRunType.RANDOM_WORD,
    modelProvider,
    modelName,
    config: {
      wordOptions,
      numRuns,
      promptStyle
    }
  });
  
  // Update the status to running
  await ResponseTracker.updateEvaluationRunStatus(
    evaluationRun._id.toString(),
    EvaluationRunStatus.RUNNING
  );
  
  const selections: SelectionRun[] = [];
  
  try {
    // Run the specified number of evaluations with tracking
    for (let i = 0; i < numRuns; i++) {
      const result = await runAndTrackSingleEvaluation(
        model,
        evaluationRun._id.toString(),
        wordOptions,
        i,
        promptStyle
      );
      selections.push(result);
    }
    
    // Calculate statistics (handled by the caller using existing analytics)
    
    // Update the status to completed
    await ResponseTracker.updateEvaluationRunStatus(
      evaluationRun._id.toString(),
      EvaluationRunStatus.COMPLETED
    );
    
    return {
      evaluationRunId: evaluationRun._id.toString(),
      results: {
        selectedWords: {}, // These will be calculated by the caller
        positionBias: {}, // These will be calculated by the caller
        totalRuns: numRuns,
        rawSelections: selections
      }
    };
  } catch (error) {
    // Update the status to failed
    await ResponseTracker.updateEvaluationRunStatus(
      evaluationRun._id.toString(),
      EvaluationRunStatus.FAILED
    );
    
    // Re-throw the error to allow proper handling
    throw error;
  }
}