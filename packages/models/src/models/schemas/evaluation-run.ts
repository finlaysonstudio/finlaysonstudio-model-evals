import mongoose, { Schema, Document } from 'mongoose';
import { ModelProvider } from '../client';

/**
 * Evaluation run status
 */
export enum EvaluationRunStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Evaluation run type
 */
export enum EvaluationRunType {
  RANDOM_WORD = 'random-word',
}

/**
 * Evaluation run document interface
 */
export interface IEvaluationRun extends Document {
  name: string;
  description?: string;
  type: EvaluationRunType;
  modelProvider: ModelProvider;
  modelName: string;
  status: EvaluationRunStatus;
  config: Record<string, any>;
  startTime?: Date;
  endTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Evaluation run schema
 */
const EvaluationRunSchema = new Schema<IEvaluationRun>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(EvaluationRunType),
      required: true,
    },
    modelProvider: {
      type: String,
      enum: ['openai', 'anthropic'],
      required: true,
    },
    modelName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(EvaluationRunStatus),
      default: EvaluationRunStatus.PENDING,
    },
    config: {
      type: Schema.Types.Mixed,
      default: {},
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create and export the model
export const EvaluationRun = mongoose.model<IEvaluationRun>('EvaluationRun', EvaluationRunSchema);