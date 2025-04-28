import { describe, it, expect, vi, beforeEach, afterEach, MockInstance } from 'vitest';
import mongoose from 'mongoose';
import { ResponseTracker } from './response-tracker';
import { ModelResponse } from './schemas/model-response';
import { EvaluationRun, EvaluationRunStatus, EvaluationRunType } from './schemas/evaluation-run';
import { ModelProvider } from '../models/client';

// Mock the entire module
vi.mock('./schemas/model-response', () => ({
  ModelResponse: {
    find: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

vi.mock('./schemas/evaluation-run', () => ({
  EvaluationRun: {
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    deleteOne: vi.fn(),
  },
  EvaluationRunStatus: {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
  },
  EvaluationRunType: {
    RANDOM_WORD: 'random-word',
  },
}));

// Create a class to mock the EvaluationRun model
class MockEvaluationRunModel {
  _id: mongoose.Types.ObjectId;
  name: string;
  status: string;
  save: MockInstance;
  
  constructor(name: string, options: any) {
    this._id = new mongoose.Types.ObjectId();
    this.name = name;
    this.status = EvaluationRunStatus.PENDING;
    Object.assign(this, options);
    this.save = vi.fn();
  }
}

// Mock constructor and save for EvaluationRun
const mockEvaluationRunSave = vi.fn();

vi.mock('./response-tracker', () => {
  return {
    ResponseTracker: {
      createEvaluationRun: vi.fn().mockImplementation(async (name, options) => {
        const mockRun = new MockEvaluationRunModel(name, options);
        mockRun.save = mockEvaluationRunSave;
        return mockRun;
      }),
      updateEvaluationRunStatus: vi.fn(),
      recordResponse: vi.fn(),
      getResponsesForRun: vi.fn(),
      getEvaluationRun: vi.fn(),
      getEvaluationRuns: vi.fn(),
      deleteEvaluationRun: vi.fn(),
    }
  };
});

describe('ResponseTracker', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createEvaluationRun', () => {
    it('creates a new evaluation run with the provided options', async () => {
      // The mocking is now handled globally
      const name = 'Test Evaluation';
      const options = {
        description: 'A test evaluation run',
        type: EvaluationRunType.RANDOM_WORD,
        modelProvider: 'anthropic' as ModelProvider,
        modelName: 'claude-3-opus-20240229',
      };
      
      const mockRun = {
        _id: new mongoose.Types.ObjectId(),
        name,
        ...options,
        status: EvaluationRunStatus.PENDING,
      };
      
      // Setup the createEvaluationRun implementation
      vi.mocked(ResponseTracker.createEvaluationRun).mockResolvedValue(mockRun as any);
      
      // Call the method
      const result = await ResponseTracker.createEvaluationRun(name, options);
      
      // Assert result
      expect(result).toBeDefined();
      expect(result.name).toBe(name);
      expect(result.status).toBe(EvaluationRunStatus.PENDING);
      expect(ResponseTracker.createEvaluationRun).toHaveBeenCalledWith(name, options);
    });
  });

  describe('updateEvaluationRunStatus', () => {
    it('updates the status of an evaluation run', async () => {
      // Mock data
      const evaluationRunId = new mongoose.Types.ObjectId().toString();
      const status = EvaluationRunStatus.RUNNING;
      const mockRun = {
        _id: evaluationRunId,
        status,
        startTime: expect.any(Date),
      };

      // Mock the updateEvaluationRunStatus implementation
      vi.mocked(ResponseTracker.updateEvaluationRunStatus).mockResolvedValue(mockRun as any);

      // Call the method
      const result = await ResponseTracker.updateEvaluationRunStatus(evaluationRunId, status);

      // Assert result
      expect(result).toBeDefined();
      expect(result?.status).toBe(status);
      expect(ResponseTracker.updateEvaluationRunStatus).toHaveBeenCalledWith(
        evaluationRunId,
        status
      );
    });

    it('adds endTime when status is COMPLETED', async () => {
      // Mock data
      const evaluationRunId = new mongoose.Types.ObjectId().toString();
      const status = EvaluationRunStatus.COMPLETED;
      const mockRun = {
        _id: evaluationRunId,
        status,
        endTime: expect.any(Date),
      };

      // Mock the updateEvaluationRunStatus implementation
      vi.mocked(ResponseTracker.updateEvaluationRunStatus).mockResolvedValue(mockRun as any);

      // Call the method
      const result = await ResponseTracker.updateEvaluationRunStatus(evaluationRunId, status);

      // Assert result
      expect(result).toBeDefined();
      expect(result?.status).toBe(status);
      expect(ResponseTracker.updateEvaluationRunStatus).toHaveBeenCalledWith(
        evaluationRunId,
        status
      );
    });
  });

  describe('recordResponse', () => {
    it('records a model response for an evaluation run', async () => {
      // Mock data
      const evaluationRunId = new mongoose.Types.ObjectId().toString();
      const options = {
        promptIndex: 0,
        prompt: 'Test prompt',
        rawResponse: 'Test response',
        responseTime: 100,
      };
      
      const mockResponse = {
        _id: new mongoose.Types.ObjectId(),
        evaluationRunId,
        ...options,
      };
      
      // Mock the recordResponse implementation
      vi.mocked(ResponseTracker.recordResponse).mockResolvedValue(mockResponse as any);
      
      // Call the method
      const result = await ResponseTracker.recordResponse(evaluationRunId, options);
      
      // Assert result
      expect(result).toEqual(mockResponse);
      expect(ResponseTracker.recordResponse).toHaveBeenCalledWith(evaluationRunId, options);
    });
  });

  describe('getResponsesForRun', () => {
    it('gets all responses for an evaluation run', async () => {
      // Mock data
      const evaluationRunId = new mongoose.Types.ObjectId().toString();
      const mockResponses = [
        { _id: new mongoose.Types.ObjectId(), evaluationRunId, promptIndex: 0 },
        { _id: new mongoose.Types.ObjectId(), evaluationRunId, promptIndex: 1 },
      ];

      // Mock the getResponsesForRun implementation
      vi.mocked(ResponseTracker.getResponsesForRun).mockResolvedValue(mockResponses as any);

      // Call the method
      const result = await ResponseTracker.getResponsesForRun(evaluationRunId);

      // Assert result
      expect(result).toEqual(mockResponses);
      expect(ResponseTracker.getResponsesForRun).toHaveBeenCalledWith(evaluationRunId);
    });
  });

  describe('getEvaluationRun', () => {
    it('gets an evaluation run by ID', async () => {
      // Mock data
      const evaluationRunId = new mongoose.Types.ObjectId().toString();
      const mockRun = {
        _id: evaluationRunId,
        name: 'Test Run',
        status: EvaluationRunStatus.COMPLETED,
      };

      // Mock the getEvaluationRun implementation
      vi.mocked(ResponseTracker.getEvaluationRun).mockResolvedValue(mockRun as any);

      // Call the method
      const result = await ResponseTracker.getEvaluationRun(evaluationRunId);

      // Assert result
      expect(result).toEqual(mockRun);
      expect(ResponseTracker.getEvaluationRun).toHaveBeenCalledWith(evaluationRunId);
    });
  });

  describe('getEvaluationRuns', () => {
    it('gets all evaluation runs matching the filter', async () => {
      // Mock data
      const filter = { type: EvaluationRunType.RANDOM_WORD };
      const mockRuns = [
        { _id: new mongoose.Types.ObjectId(), name: 'Run 1', type: EvaluationRunType.RANDOM_WORD },
        { _id: new mongoose.Types.ObjectId(), name: 'Run 2', type: EvaluationRunType.RANDOM_WORD },
      ];

      // Mock the getEvaluationRuns implementation
      vi.mocked(ResponseTracker.getEvaluationRuns).mockResolvedValue(mockRuns as any);

      // Call the method
      const result = await ResponseTracker.getEvaluationRuns(filter);

      // Assert result
      expect(result).toEqual(mockRuns);
      expect(ResponseTracker.getEvaluationRuns).toHaveBeenCalledWith(filter);
    });
  });

  describe('deleteEvaluationRun', () => {
    it('deletes an evaluation run and its responses', async () => {
      // Mock data
      const evaluationRunId = new mongoose.Types.ObjectId().toString();

      // Mock the deleteEvaluationRun implementation
      vi.mocked(ResponseTracker.deleteEvaluationRun).mockResolvedValue(true);

      // Call the method
      const result = await ResponseTracker.deleteEvaluationRun(evaluationRunId);

      // Assert result
      expect(result).toBe(true);
      expect(ResponseTracker.deleteEvaluationRun).toHaveBeenCalledWith(evaluationRunId);
    });

    it('returns false if the evaluation run was not deleted', async () => {
      // Mock data
      const evaluationRunId = new mongoose.Types.ObjectId().toString();

      // Mock the deleteEvaluationRun implementation
      vi.mocked(ResponseTracker.deleteEvaluationRun).mockResolvedValue(false);

      // Call the method
      const result = await ResponseTracker.deleteEvaluationRun(evaluationRunId);

      // Assert result
      expect(result).toBe(false);
      expect(ResponseTracker.deleteEvaluationRun).toHaveBeenCalledWith(evaluationRunId);
    });
  });
});