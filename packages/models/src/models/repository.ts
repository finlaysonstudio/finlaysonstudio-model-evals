import mongoose from 'mongoose';
import { 
  EvaluationRun, 
  IEvaluationRun, 
  EvaluationRunStatus, 
  EvaluationRunType,
  ModelResponse, 
  IModelResponse,
  AnalysisResult, 
  IAnalysisResult, 
  AnalysisResultType
} from './schemas';

/**
 * Options for creating an evaluation run
 */
export interface CreateEvaluationRunOptions {
  name: string;
  description?: string;
  type: EvaluationRunType;
  modelProvider: string;
  modelName: string;
  config?: Record<string, any>;
}

/**
 * Options for saving a model response
 */
export interface SaveModelResponseOptions {
  evaluationRunId: string | mongoose.Types.ObjectId;
  promptIndex: number;
  prompt: string;
  rawResponse: string;
  parsedResponse?: Record<string, any>;
  responseTime: number;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Options for saving an analysis result
 */
export interface SaveAnalysisResultOptions {
  evaluationRunId: string | mongoose.Types.ObjectId;
  type: AnalysisResultType;
  name: string;
  description?: string;
  result: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Repository class for handling evaluation data
 */
export class EvaluationRepository {
  /**
   * Creates a new evaluation run
   * @param options CreateEvaluationRunOptions
   * @returns Promise<IEvaluationRun>
   */
  async createEvaluationRun(options: CreateEvaluationRunOptions): Promise<IEvaluationRun> {
    try {
      const evaluationRun = new EvaluationRun({
        name: options.name,
        description: options.description,
        type: options.type,
        modelProvider: options.modelProvider,
        modelName: options.modelName,
        status: EvaluationRunStatus.PENDING,
        config: options.config || {},
      });

      return await evaluationRun.save();
    } catch (error) {
      console.error('Failed to create evaluation run:', error);
      throw error;
    }
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
    try {
      const updates: Partial<IEvaluationRun> = { status };
      
      // Set start time if status is changed to running
      if (status === EvaluationRunStatus.RUNNING) {
        updates.startTime = new Date();
      }
      
      // Set end time if status is changed to completed or failed
      if (status === EvaluationRunStatus.COMPLETED || status === EvaluationRunStatus.FAILED) {
        updates.endTime = new Date();
      }

      return await EvaluationRun.findByIdAndUpdate(
        id,
        updates,
        { new: true }
      );
    } catch (error) {
      console.error('Failed to update evaluation run status:', error);
      throw error;
    }
  }

  /**
   * Gets an evaluation run by ID
   * @param id Evaluation run ID
   * @returns Promise<IEvaluationRun | null>
   */
  async getEvaluationRun(id: string | mongoose.Types.ObjectId): Promise<IEvaluationRun | null> {
    try {
      return await EvaluationRun.findById(id);
    } catch (error) {
      console.error('Failed to get evaluation run:', error);
      throw error;
    }
  }

  /**
   * Gets all evaluation runs with optional filtering
   * @param filter Filter object
   * @returns Promise<IEvaluationRun[]>
   */
  async getEvaluationRuns(filter: Partial<IEvaluationRun> = {}): Promise<IEvaluationRun[]> {
    try {
      // Create a safe filter object that won't cause Mongoose typing issues
      const safeFilter: Record<string, any> = {};
      
      // Copy fields to the safe filter
      if (filter.name) safeFilter.name = filter.name;
      if (filter.type) safeFilter.type = filter.type;
      if (filter.modelProvider) safeFilter.modelProvider = filter.modelProvider;
      if (filter.modelName) safeFilter.modelName = filter.modelName;
      if (filter.status) safeFilter.status = filter.status;
      
      return await EvaluationRun.find(safeFilter).sort({ createdAt: -1 });
    } catch (error) {
      console.error('Failed to get evaluation runs:', error);
      throw error;
    }
  }

  /**
   * Saves a model response
   * @param options SaveModelResponseOptions
   * @returns Promise<IModelResponse>
   */
  async saveModelResponse(options: SaveModelResponseOptions): Promise<IModelResponse> {
    try {
      const modelResponse = new ModelResponse({
        evaluationRunId: options.evaluationRunId,
        promptIndex: options.promptIndex,
        prompt: options.prompt,
        rawResponse: options.rawResponse,
        parsedResponse: options.parsedResponse,
        responseTime: options.responseTime,
        error: options.error,
        metadata: options.metadata,
      });

      return await modelResponse.save();
    } catch (error) {
      console.error('Failed to save model response:', error);
      throw error;
    }
  }

  /**
   * Gets model responses for an evaluation run
   * @param evaluationRunId Evaluation run ID
   * @returns Promise<IModelResponse[]>
   */
  async getModelResponses(evaluationRunId: string | mongoose.Types.ObjectId): Promise<IModelResponse[]> {
    try {
      return await ModelResponse.find({ evaluationRunId }).sort({ promptIndex: 1 });
    } catch (error) {
      console.error('Failed to get model responses:', error);
      throw error;
    }
  }

  /**
   * Saves an analysis result
   * @param options SaveAnalysisResultOptions
   * @returns Promise<IAnalysisResult>
   */
  async saveAnalysisResult(options: SaveAnalysisResultOptions): Promise<IAnalysisResult> {
    try {
      // Check if an analysis result with the same evaluationRunId, type, and name already exists
      const existingResult = await AnalysisResult.findOne({
        evaluationRunId: options.evaluationRunId,
        type: options.type,
        name: options.name,
      });

      // If it exists, update it
      if (existingResult) {
        return await AnalysisResult.findByIdAndUpdate(
          existingResult._id,
          {
            result: options.result,
            description: options.description,
            metadata: options.metadata,
          },
          { new: true }
        ) as IAnalysisResult;
      }

      // Otherwise, create a new one
      const analysisResult = new AnalysisResult({
        evaluationRunId: options.evaluationRunId,
        type: options.type,
        name: options.name,
        description: options.description,
        result: options.result,
        metadata: options.metadata,
      });

      return await analysisResult.save();
    } catch (error) {
      console.error('Failed to save analysis result:', error);
      throw error;
    }
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
    try {
      const filter: Record<string, any> = { evaluationRunId };
      
      if (type) {
        filter.type = type;
      }
      
      return await AnalysisResult.find(filter).sort({ type: 1, name: 1 });
    } catch (error) {
      console.error('Failed to get analysis results:', error);
      throw error;
    }
  }

  /**
   * Deletes an evaluation run and all associated data
   * @param id Evaluation run ID
   * @returns Promise<boolean>
   */
  async deleteEvaluationRun(id: string | mongoose.Types.ObjectId): Promise<boolean> {
    try {
      // Delete the evaluation run
      const deleteRunResult = await EvaluationRun.deleteOne({ _id: id });
      
      // Delete all associated model responses
      await ModelResponse.deleteMany({ evaluationRunId: id });
      
      // Delete all associated analysis results
      await AnalysisResult.deleteMany({ evaluationRunId: id });
      
      return deleteRunResult.deletedCount > 0;
    } catch (error) {
      console.error('Failed to delete evaluation run and associated data:', error);
      throw error;
    }
  }
}