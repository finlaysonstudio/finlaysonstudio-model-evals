import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Helper function to safely get ObjectId as string
function getIdAsString(obj: any): string {
  return (obj._id as unknown as mongoose.Types.ObjectId).toString();
}
import { 
  EvaluationService, 
  RunEvaluationOptions 
} from './evaluation-service';
import { 
  EvaluationRunStatus, 
  EvaluationRunType, 
  AnalysisResultType, 
  EvaluationRun, 
  ModelResponse, 
  AnalysisResult 
} from './schemas';

describe('EvaluationService - Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let service: EvaluationService;

  beforeAll(async () => {
    // Start in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(uri);
    
    // Create service instance
    service = new EvaluationService();
  });

  afterAll(async () => {
    // Disconnect and stop MongoDB server
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections before each test
    await EvaluationRun.deleteMany({});
    await ModelResponse.deleteMany({});
    await AnalysisResult.deleteMany({});
  });

  describe('Basic Operations', () => {
    it('should create and retrieve an evaluation run', async () => {
      const evaluationRun = await service.createEvaluationRun({
        name: 'Test Evaluation',
        description: 'Testing service operations',
        type: EvaluationRunType.RANDOM_WORD,
        modelProvider: 'openai',
        modelName: 'gpt-4',
        config: { numPrompts: 50 },
      });

      expect(evaluationRun).toBeDefined();
      expect(evaluationRun._id).toBeDefined();

      // Retrieve the created run
      const retrieved = await service.getEvaluationRun(getIdAsString(evaluationRun));
      expect(retrieved).toBeDefined();
      if (retrieved) {
        const retrievedId = retrieved._id as unknown as mongoose.Types.ObjectId;
        expect(retrievedId.toString()).toBe(getIdAsString(evaluationRun));
      }
      expect(retrieved!.name).toBe('Test Evaluation');
    });

    it('should save and retrieve model responses', async () => {
      // Create an evaluation run
      const evaluationRun = await service.createEvaluationRun({
        name: 'Response Test',
        type: EvaluationRunType.RANDOM_WORD,
        modelProvider: 'anthropic',
        modelName: 'claude-3',
      });

      // Save responses
      await service.saveModelResponse({
        evaluationRunId: getIdAsString(evaluationRun),
        promptIndex: 0,
        prompt: 'Prompt 0',
        rawResponse: 'Response 0',
        responseTime: 100,
      });

      await service.saveModelResponse({
        evaluationRunId: getIdAsString(evaluationRun),
        promptIndex: 1,
        prompt: 'Prompt 1',
        rawResponse: 'Response 1',
        responseTime: 120,
      });

      // Retrieve responses
      const responses = await service.getModelResponses(getIdAsString(evaluationRun));
      expect(responses).toHaveLength(2);
      expect(responses[0].promptIndex).toBe(0);
      expect(responses[1].promptIndex).toBe(1);
    });

    it('should save and retrieve analysis results', async () => {
      // Create an evaluation run
      const evaluationRun = await service.createEvaluationRun({
        name: 'Analysis Test',
        type: EvaluationRunType.RANDOM_WORD,
        modelProvider: 'openai',
        modelName: 'gpt-4',
      });

      // Save analysis results
      await service.saveAnalysisResult({
        evaluationRunId: getIdAsString(evaluationRun),
        type: AnalysisResultType.FREQUENCY_DISTRIBUTION,
        name: 'Word Frequency',
        result: { data: 'frequency data' },
      });

      await service.saveAnalysisResult({
        evaluationRunId: getIdAsString(evaluationRun),
        type: AnalysisResultType.POSITION_BIAS,
        name: 'Position Bias',
        result: { data: 'position data' },
      });

      // Retrieve all results
      const allResults = await service.getAnalysisResults(getIdAsString(evaluationRun));
      expect(allResults).toHaveLength(2);

      // Retrieve filtered results
      const frequencyResults = await service.getAnalysisResults(
        getIdAsString(evaluationRun),
        AnalysisResultType.FREQUENCY_DISTRIBUTION
      );
      expect(frequencyResults).toHaveLength(1);
      expect(frequencyResults[0].name).toBe('Word Frequency');
    });
  });

  describe('Complete Evaluation Flow', () => {
    it('should run a complete evaluation process', async () => {
      const onStartMock = vi.fn();
      const onResponseMock = vi.fn();
      const onCompleteMock = vi.fn();

      const options: RunEvaluationOptions = {
        evaluationRun: {
          name: 'Complete Flow Test',
          type: EvaluationRunType.RANDOM_WORD,
          modelProvider: 'openai',
          modelName: 'gpt-4',
          config: { numPrompts: 3 },
        },
        onStart: onStartMock,
        onResponse: onResponseMock,
        onComplete: onCompleteMock,
      };

      // Mock response generator
      async function* responseGenerator(run: any) {
        const words = ['clubs', 'diamonds', 'hearts', 'spades'];
        
        for (let i = 0; i < 3; i++) {
          yield {
            promptIndex: i,
            prompt: `Choose a random word from: ${words.join(', ')}`,
            response: { selectedWord: words[i % 4] },
            responseTime: 100 + i * 10,
            metadata: { wordOrder: [...words].sort(() => Math.random() - 0.5) },
          };
        }
      }

      // Run the evaluation
      const result = await service.runEvaluation(responseGenerator, options);

      // Check evaluation run
      expect(result.evaluationRun).toBeDefined();
      expect(result.evaluationRun.status).toBe(EvaluationRunStatus.COMPLETED);
      expect(result.evaluationRun.startTime).toBeDefined();
      expect(result.evaluationRun.endTime).toBeDefined();

      // Check responses
      expect(result.responses).toHaveLength(3);
      expect(result.responses[0].promptIndex).toBe(0);
      expect(result.responses[1].promptIndex).toBe(1);
      expect(result.responses[2].promptIndex).toBe(2);

      // Check callbacks were called
      expect(onStartMock).toHaveBeenCalledTimes(1);
      expect(onResponseMock).toHaveBeenCalledTimes(3);
      expect(onCompleteMock).toHaveBeenCalledTimes(1);

      // Verify data in the database
      const storedRun = await service.getEvaluationRun(getIdAsString(result.evaluationRun));
      expect(storedRun).toBeDefined();
      expect(storedRun!.status).toBe(EvaluationRunStatus.COMPLETED);

      const storedResponses = await service.getModelResponses(getIdAsString(result.evaluationRun));
      expect(storedResponses).toHaveLength(3);
    });

    it('should handle errors during evaluation', async () => {
      const onErrorMock = vi.fn();

      const options: RunEvaluationOptions = {
        evaluationRun: {
          name: 'Error Test',
          type: EvaluationRunType.RANDOM_WORD,
          modelProvider: 'openai',
          modelName: 'gpt-4',
        },
        onError: onErrorMock,
      };

      // Generator that throws an error
      async function* errorGenerator() {
        yield {
          promptIndex: 0,
          prompt: 'Test prompt',
          response: 'Test response',
          responseTime: 100,
        };
        
        throw new Error('Test error');
      }

      // Run the evaluation and expect it to throw
      await expect(service.runEvaluation(errorGenerator, options)).rejects.toThrow('Test error');

      // Check error callback was called
      expect(onErrorMock).toHaveBeenCalledTimes(1);
      expect(onErrorMock).toHaveBeenCalledWith(expect.any(Error), expect.anything());

      // Verify the evaluation run was marked as failed
      const evaluationRuns = await service.getEvaluationRuns({ name: 'Error Test' });
      expect(evaluationRuns).toHaveLength(1);
      expect(evaluationRuns[0].status).toBe(EvaluationRunStatus.FAILED);
    });
  });
});