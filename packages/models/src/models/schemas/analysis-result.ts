import mongoose, { Schema, Document } from 'mongoose';

/**
 * Analysis result type
 */
export enum AnalysisResultType {
  FREQUENCY_DISTRIBUTION = 'frequency-distribution',
  POSITION_BIAS = 'position-bias',
  STATISTICAL_TEST = 'statistical-test',
}

/**
 * Analysis result document interface
 */
export interface IAnalysisResult extends Document {
  evaluationRunId: mongoose.Types.ObjectId;
  type: AnalysisResultType;
  name: string;
  description?: string;
  result: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Analysis result schema
 */
const AnalysisResultSchema = new Schema<IAnalysisResult>(
  {
    evaluationRunId: {
      type: Schema.Types.ObjectId,
      ref: 'EvaluationRun',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(AnalysisResultType),
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    result: {
      type: Schema.Types.Mixed,
      required: true,
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
AnalysisResultSchema.index({ evaluationRunId: 1, type: 1, name: 1 }, { unique: true });

// Create and export the model
export const AnalysisResult = mongoose.model<IAnalysisResult>('AnalysisResult', AnalysisResultSchema);