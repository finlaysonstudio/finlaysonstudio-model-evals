import mongoose from 'mongoose';
import { ModelResponse, IModelResponse } from './schemas/model-response';
import { EvaluationRun, IEvaluationRun, EvaluationRunStatus } from './schemas/evaluation-run';

/**
 * Response tracking options
 */
export interface ResponseTrackingOptions {
  promptIndex: number;
  prompt: string;
  rawResponse: string;
  parsedResponse?: Record<string, any>;
  responseTime: number;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Service for tracking model responses and evaluation runs
 */
export class ResponseTracker {
  /**
   * Creates a new evaluation run
   * @param name Name of the evaluation run
   * @param options Configuration options for the evaluation run
   * @returns Created evaluation run document
   */
  static async createEvaluationRun(
    name: string,
    options: Partial<IEvaluationRun>
  ): Promise<IEvaluationRun> {
    const evaluationRun = new EvaluationRun({
      name,
      ...options,
      status: EvaluationRunStatus.PENDING,
    });

    return await evaluationRun.save();
  }

  /**
   * Updates the status of an evaluation run
   * @param evaluationRunId ID of the evaluation run
   * @param status New status
   * @returns Updated evaluation run document
   */
  static async updateEvaluationRunStatus(
    evaluationRunId: string | mongoose.Types.ObjectId,
    status: EvaluationRunStatus
  ): Promise<IEvaluationRun | null> {
    const updates: Partial<IEvaluationRun> = { status };

    // Add timestamps based on status
    if (status === EvaluationRunStatus.RUNNING) {
      updates.startTime = new Date();
    } else if (status === EvaluationRunStatus.COMPLETED || status === EvaluationRunStatus.FAILED) {
      updates.endTime = new Date();
    }

    return await EvaluationRun.findByIdAndUpdate(
      evaluationRunId,
      updates,
      { new: true }
    );
  }

  /**
   * Records a model response for an evaluation run
   * @param evaluationRunId ID of the evaluation run
   * @param options Response tracking options
   * @returns Created model response document
   */
  static async recordResponse(
    evaluationRunId: string | mongoose.Types.ObjectId,
    options: ResponseTrackingOptions
  ): Promise<IModelResponse> {
    // Create and save the model response
    const modelResponse = new ModelResponse({
      evaluationRunId,
      ...options
    });

    return await modelResponse.save();
  }

  /**
   * Gets all responses for an evaluation run
   * @param evaluationRunId ID of the evaluation run
   * @returns Array of model response documents
   */
  static async getResponsesForRun(
    evaluationRunId: string | mongoose.Types.ObjectId
  ): Promise<IModelResponse[]> {
    return await ModelResponse.find({ evaluationRunId }).sort({ promptIndex: 1 });
  }

  /**
   * Gets a single evaluation run by ID
   * @param evaluationRunId ID of the evaluation run
   * @returns Evaluation run document or null if not found
   */
  static async getEvaluationRun(
    evaluationRunId: string | mongoose.Types.ObjectId
  ): Promise<IEvaluationRun | null> {
    return await EvaluationRun.findById(evaluationRunId);
  }

  /**
   * Gets all evaluation runs matching the filter criteria
   * @param filter Filter criteria
   * @returns Array of evaluation run documents
   */
  static async getEvaluationRuns(
    filter: Partial<IEvaluationRun> = {}
  ): Promise<IEvaluationRun[]> {
    // Convert to FilterQuery to satisfy Mongoose typing
    const filterQuery = filter as mongoose.FilterQuery<IEvaluationRun>;
    return await EvaluationRun.find(filterQuery).sort({ createdAt: -1 });
  }

  /**
   * Deletes an evaluation run and all associated responses
   * @param evaluationRunId ID of the evaluation run
   * @returns True if successful, false otherwise
   */
  static async deleteEvaluationRun(
    evaluationRunId: string | mongoose.Types.ObjectId
  ): Promise<boolean> {
    // Delete all associated responses
    await ModelResponse.deleteMany({ evaluationRunId });
    
    // Delete the evaluation run
    const result = await EvaluationRun.deleteOne({ _id: evaluationRunId });
    
    return result.deletedCount === 1;
  }
}