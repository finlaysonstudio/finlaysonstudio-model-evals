import mongoose from 'mongoose';
import {
  EvaluationRepository,
  CreateEvaluationRunOptions,
  SaveModelResponseOptions,
  SaveAnalysisResultOptions
} from './repository';
import {
  IEvaluationRun,
  EvaluationRunStatus,
  IModelResponse,
  IAnalysisResult,
  AnalysisResultType
} from './schemas';

/**
 * Options for running an evaluation
 */
export interface RunEvaluationOptions {
  evaluationRun: CreateEvaluationRunOptions;
  onStart?: (evaluationRun: IEvaluationRun) => Promise<void>;
  onResponse?: (response: IModelResponse, index: number, total: number) => Promise<void>;
  onComplete?: (evaluationRun: IEvaluationRun, responses: IModelResponse[]) => Promise<void>;
  onError?: (error: Error, evaluationRun?: IEvaluationRun) => Promise<void>;
}

/**
 * Service class for managing evaluations
 */
export class EvaluationService {
  private repository: EvaluationRepository;

  /**
   * Constructor
   * @param repository Optional repository instance
   */
  constructor(repository?: EvaluationRepository) {
    this.repository = repository || new EvaluationRepository();
  }

  /**
   * Creates a new evaluation run
   * @param options CreateEvaluationRunOptions
   * @returns Promise<IEvaluationRun>
   */
  async createEvaluationRun(options: CreateEvaluationRunOptions): Promise<IEvaluationRun> {
    return this.repository.createEvaluationRun(options);
  }

  /**
   * Gets an evaluation run by ID
   * @param id Evaluation run ID
   * @returns Promise<IEvaluationRun | null>
   */
  async getEvaluationRun(id: string | mongoose.Types.ObjectId): Promise<IEvaluationRun | null> {
    return this.repository.getEvaluationRun(id);
  }

  /**
   * Gets all evaluation runs with optional filtering
   * @param filter Filter object
   * @returns Promise<IEvaluationRun[]>
   */
  async getEvaluationRuns(filter: Partial<IEvaluationRun> = {}): Promise<IEvaluationRun[]> {
    return this.repository.getEvaluationRuns(filter);
  }

  /**
   * Updates an evaluation run status
   * @param id Evaluation run ID
   * @param status EvaluationRunStatus
   * @returns Promise<IEvaluationRun | null>
   */
  async updateEvaluationRunStatus(
    id: string | mongoose.Types.ObjectId,
    status: EvaluationRunStatus
  ): Promise<IEvaluationRun | null> {
    return this.repository.updateEvaluationRunStatus(id, status);
  }

  /**
   * Saves a model response
   * @param options SaveModelResponseOptions
   * @returns Promise<IModelResponse>
   */
  async saveModelResponse(options: SaveModelResponseOptions): Promise<IModelResponse> {
    return this.repository.saveModelResponse(options);
  }

  /**
   * Gets model responses for an evaluation run
   * @param evaluationRunId Evaluation run ID
   * @returns Promise<IModelResponse[]>
   */
  async getModelResponses(evaluationRunId: string | mongoose.Types.ObjectId): Promise<IModelResponse[]> {
    return this.repository.getModelResponses(evaluationRunId);
  }

  /**
   * Saves an analysis result
   * @param options SaveAnalysisResultOptions
   * @returns Promise<IAnalysisResult>
   */
  async saveAnalysisResult(options: SaveAnalysisResultOptions): Promise<IAnalysisResult> {
    return this.repository.saveAnalysisResult(options);
  }

  /**
   * Gets analysis results for an evaluation run
   * @param evaluationRunId Evaluation run ID
   * @param type Optional analysis result type filter
   * @returns Promise<IAnalysisResult[]>
   */
  async getAnalysisResults(
    evaluationRunId: string | mongoose.Types.ObjectId,
    type?: AnalysisResultType
  ): Promise<IAnalysisResult[]> {
    return this.repository.getAnalysisResults(evaluationRunId, type);
  }

  /**
   * Runs a complete evaluation process
   * @param generator Function that generates model responses
   * @param options RunEvaluationOptions
   * @returns Promise<{ evaluationRun: IEvaluationRun, responses: IModelResponse[] }>
   */
  async runEvaluation<T>(
    generator: (evaluationRun: IEvaluationRun) => AsyncGenerator<{
      promptIndex: number;
      prompt: string;
      response: T;
      responseTime: number;
      metadata?: Record<string, any>;
    }>,
    options: RunEvaluationOptions
  ): Promise<{ evaluationRun: IEvaluationRun; responses: IModelResponse[] }> {
    let evaluationRun: IEvaluationRun;
    const responses: IModelResponse[] = [];

    try {
      // Create evaluation run
      evaluationRun = await this.repository.createEvaluationRun(options.evaluationRun);

      // Call onStart callback if provided
      if (options.onStart) {
        await options.onStart(evaluationRun);
      }

      // Update status to running
      const runId = (evaluationRun._id as unknown as mongoose.Types.ObjectId).toString();
      evaluationRun = (await this.repository.updateEvaluationRunStatus(
        runId,
        EvaluationRunStatus.RUNNING
      ))!;

      // Generate and save responses
      const responseGenerator = generator(evaluationRun);
      let promptCount = 0;
      let totalPrompts = evaluationRun.config.numPrompts || 100; // Default to 100 if not specified

      for await (const { promptIndex, prompt, response, responseTime, metadata } of responseGenerator) {
        promptCount++;

        // Save response
        const modelResponse = await this.repository.saveModelResponse({
          evaluationRunId: runId,
          promptIndex,
          prompt,
          rawResponse: typeof response === 'string' ? response : JSON.stringify(response),
          parsedResponse: typeof response === 'object' && response !== null ? response : undefined,
          responseTime,
          metadata,
        });

        responses.push(modelResponse);

        // Call onResponse callback if provided
        if (options.onResponse) {
          await options.onResponse(modelResponse, promptCount, totalPrompts);
        }
      }

      // Update status to completed
      evaluationRun = (await this.repository.updateEvaluationRunStatus(
        runId,
        EvaluationRunStatus.COMPLETED
      ))!;

      // Call onComplete callback if provided
      if (options.onComplete) {
        await options.onComplete(evaluationRun, responses);
      }

      return { evaluationRun, responses };
    } catch (error) {
      // Handle error
      if (evaluationRun!) {
        const evalId = (evaluationRun._id as unknown as mongoose.Types.ObjectId).toString();
        // Update status to failed
        await this.repository.updateEvaluationRunStatus(
          evalId,
          EvaluationRunStatus.FAILED
        );
      }

      // Call onError callback if provided
      if (options.onError) {
        await options.onError(error as Error, evaluationRun!);
      }

      throw error;
    }
  }

  /**
   * Deletes an evaluation run and all associated data
   * @param id Evaluation run ID
   * @returns Promise<boolean>
   */
  async deleteEvaluationRun(id: string | mongoose.Types.ObjectId): Promise<boolean> {
    return this.repository.deleteEvaluationRun(id);
  }
}