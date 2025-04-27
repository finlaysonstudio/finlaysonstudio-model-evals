import mongoose, { Schema, Document } from 'mongoose';

/**
 * Model response document interface
 */
export interface IModelResponse extends Document {
  evaluationRunId: mongoose.Types.ObjectId;
  promptIndex: number;
  prompt: string;
  rawResponse: string;
  parsedResponse?: Record<string, any>;
  responseTime: number;
  error?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Model response schema
 */
const ModelResponseSchema = new Schema<IModelResponse>(
  {
    evaluationRunId: {
      type: Schema.Types.ObjectId,
      ref: 'EvaluationRun',
      required: true,
      index: true,
    },
    promptIndex: {
      type: Number,
      required: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    rawResponse: {
      type: String,
      required: true,
    },
    parsedResponse: {
      type: Schema.Types.Mixed,
    },
    responseTime: {
      type: Number,
      required: true,
    },
    error: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient querying
ModelResponseSchema.index({ evaluationRunId: 1, promptIndex: 1 }, { unique: true });

// Create and export the model
export const ModelResponse = mongoose.model<IModelResponse>('ModelResponse', ModelResponseSchema);