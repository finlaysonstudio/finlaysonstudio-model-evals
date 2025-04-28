import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Helper function to safely get ObjectId as string
function getIdAsString(obj: any): string {
  return (obj._id as unknown as mongoose.Types.ObjectId).toString();
}
import { 
  EvaluationRepository, 
  CreateEvaluationRunOptions, 
  SaveModelResponseOptions, 
  SaveAnalysisResultOptions 
} from './repository';
import { 
  EvaluationRunStatus, 
  EvaluationRunType, 
  AnalysisResultType, 
  EvaluationRun, 
  ModelResponse, 
  AnalysisResult 
} from './schemas';

describe('EvaluationRepository - Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let repository: EvaluationRepository;

  beforeAll(async () => {
    // Start in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(uri);
    
    // Create repository instance
    repository = new EvaluationRepository();
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

  describe('Evaluation Run Management', () => {
    it('should create a new evaluation run', async () => {
      const options: CreateEvaluationRunOptions = {
        name: 'Test Evaluation',
        description: 'Test evaluation run',
        type: EvaluationRunType.RANDOM_WORD,
        modelProvider: 'openai',
        modelName: 'gpt-4',
        config: { numPrompts: 100 },
      };

      const result = await repository.createEvaluationRun(options);

      expect(result).toBeDefined();
      expect(result._id).toBeDefined();
      expect(result.name).toBe(options.name);
      expect(result.description).toBe(options.description);
      expect(result.type).toBe(options.type);
      expect(result.modelProvider).toBe(options.modelProvider);
      expect(result.modelName).toBe(options.modelName);
      expect(result.status).toBe(EvaluationRunStatus.PENDING);
      expect(result.config).toEqual(options.config);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should update evaluation run status', async () => {
      // Create a test evaluation run
      const run = await repository.createEvaluationRun({
        name: 'Status Test',
        type: EvaluationRunType.RANDOM_WORD,
        modelProvider: 'anthropic',
        modelName: 'claude-3',
      });

      // Update to running
      const running = await repository.updateEvaluationRunStatus(
        getIdAsString(run),
        EvaluationRunStatus.RUNNING
      );

      expect(running).toBeDefined();
      expect(running!.status).toBe(EvaluationRunStatus.RUNNING);
      expect(running!.startTime).toBeDefined();
      expect(running!.endTime).toBeUndefined();

      // Update to completed
      const completed = await repository.updateEvaluationRunStatus(
        getIdAsString(run),
        EvaluationRunStatus.COMPLETED
      );

      expect(completed).toBeDefined();
      expect(completed!.status).toBe(EvaluationRunStatus.COMPLETED);
      expect(completed!.startTime).toBeDefined();
      expect(completed!.endTime).toBeDefined();
    });

    it('should get an evaluation run by ID', async () => {
      const run = await repository.createEvaluationRun({
        name: 'Get Test',
        type: EvaluationRunType.RANDOM_WORD,
        modelProvider: 'openai',
        modelName: 'gpt-4',
      });

      const retrieved = await repository.getEvaluationRun(getIdAsString(run));

      expect(retrieved).toBeDefined();
      if (retrieved) {
        const retrievedId = retrieved._id as unknown as mongoose.Types.ObjectId;
        expect(retrievedId.toString()).toBe(getIdAsString(run));
      }
      expect(retrieved!.name).toBe('Get Test');
    });

    it('should get all evaluation runs with filtering', async () => {
      // Create multiple evaluation runs
      await repository.createEvaluationRun({
        name: 'OpenAI Test',
        type: EvaluationRunType.RANDOM_WORD,
        modelProvider: 'openai',
        modelName: 'gpt-4',
      });

      await repository.createEvaluationRun({
        name: 'Anthropic Test',
        type: EvaluationRunType.RANDOM_WORD,
        modelProvider: 'anthropic',
        modelName: 'claude-3',
      });

      // Get all runs
      const allRuns = await repository.getEvaluationRuns();
      expect(allRuns).toHaveLength(2);

      // Filter by model provider
      const openaiRuns = await repository.getEvaluationRuns({ modelProvider: 'openai' });
      expect(openaiRuns).toHaveLength(1);
      expect(openaiRuns[0].name).toBe('OpenAI Test');

      const anthropicRuns = await repository.getEvaluationRuns({ modelProvider: 'anthropic' });
      expect(anthropicRuns).toHaveLength(1);
      expect(anthropicRuns[0].name).toBe('Anthropic Test');
    });

    it('should delete an evaluation run and all associated data', async () => {
      // Create an evaluation run
      const run = await repository.createEvaluationRun({
        name: 'Delete Test',
        type: EvaluationRunType.RANDOM_WORD,
        modelProvider: 'openai',
        modelName: 'gpt-4',
      });

      // Add a model response
      await repository.saveModelResponse({
        evaluationRunId: getIdAsString(run),
        promptIndex: 0,
        prompt: 'Test prompt',
        rawResponse: 'Test response',
        responseTime: 100,
      });

      // Add an analysis result
      await repository.saveAnalysisResult({
        evaluationRunId: getIdAsString(run),
        type: AnalysisResultType.FREQUENCY_DISTRIBUTION,
        name: 'Test Analysis',
        result: { data: 'test' },
      });

      // Verify data exists
      const responses = await repository.getModelResponses(getIdAsString(run));
      expect(responses).toHaveLength(1);

      const results = await repository.getAnalysisResults(getIdAsString(run));
      expect(results).toHaveLength(1);

      // Delete the evaluation run
      const deleted = await repository.deleteEvaluationRun(getIdAsString(run));
      expect(deleted).toBe(true);

      // Verify all data is deleted
      const deletedRun = await repository.getEvaluationRun(getIdAsString(run));
      expect(deletedRun).toBeNull();

      const deletedResponses = await repository.getModelResponses(getIdAsString(run));
      expect(deletedResponses).toHaveLength(0);

      const deletedResults = await repository.getAnalysisResults(getIdAsString(run));
      expect(deletedResults).toHaveLength(0);
    });
  });

  describe('Model Response Management', () => {
    let evaluationRunId: string;

    beforeEach(async () => {
      // Create a test evaluation run for response tests
      const run = await repository.createEvaluationRun({
        name: 'Response Test',
        type: EvaluationRunType.RANDOM_WORD,
        modelProvider: 'openai',
        modelName: 'gpt-4',
      });
      evaluationRunId = getIdAsString(run);
    });

    it('should save a model response', async () => {
      const options: SaveModelResponseOptions = {
        evaluationRunId,
        promptIndex: 1,
        prompt: 'Choose a random word: clubs, diamonds, hearts, spades',
        rawResponse: 'hearts',
        parsedResponse: { selectedWord: 'hearts' },
        responseTime: 150,
        metadata: { wordOrder: ['clubs', 'diamonds', 'hearts', 'spades'] },
      };

      const result = await repository.saveModelResponse(options);

      expect(result).toBeDefined();
      expect(result._id).toBeDefined();
      expect(result.evaluationRunId.toString()).toBe(evaluationRunId.toString());
      expect(result.promptIndex).toBe(options.promptIndex);
      expect(result.prompt).toBe(options.prompt);
      expect(result.rawResponse).toBe(options.rawResponse);
      expect(result.parsedResponse).toEqual(options.parsedResponse);
      expect(result.responseTime).toBe(options.responseTime);
      expect(result.metadata).toEqual(options.metadata);
    });

    it('should enforce unique evaluationRunId and promptIndex combination', async () => {
      // Save first response
      await repository.saveModelResponse({
        evaluationRunId,
        promptIndex: 2,
        prompt: 'Choose a random word: clubs, diamonds, hearts, spades',
        rawResponse: 'clubs',
        responseTime: 120,
      });

      // Try to save a response with the same evaluationRunId and promptIndex
      await expect(repository.saveModelResponse({
        evaluationRunId,
        promptIndex: 2, // Same as above
        prompt: 'Different prompt',
        rawResponse: 'different response',
        responseTime: 130,
      })).rejects.toThrow();
    });

    it('should get model responses for an evaluation run', async () => {
      // Save multiple responses
      await repository.saveModelResponse({
        evaluationRunId,
        promptIndex: 0,
        prompt: 'Prompt 0',
        rawResponse: 'Response 0',
        responseTime: 100,
      });

      await repository.saveModelResponse({
        evaluationRunId,
        promptIndex: 1,
        prompt: 'Prompt 1',
        rawResponse: 'Response 1',
        responseTime: 110,
      });

      // Get all responses
      const responses = await repository.getModelResponses(evaluationRunId);
      
      expect(responses).toHaveLength(2);
      expect(responses[0].promptIndex).toBe(0);
      expect(responses[1].promptIndex).toBe(1);
    });
  });

  describe('Analysis Result Management', () => {
    let evaluationRunId: string;

    beforeEach(async () => {
      // Create a test evaluation run for analysis tests
      const run = await repository.createEvaluationRun({
        name: 'Analysis Test',
        type: EvaluationRunType.RANDOM_WORD,
        modelProvider: 'openai',
        modelName: 'gpt-4',
      });
      evaluationRunId = getIdAsString(run);
    });

    it('should save an analysis result', async () => {
      const options: SaveAnalysisResultOptions = {
        evaluationRunId,
        type: AnalysisResultType.FREQUENCY_DISTRIBUTION,
        name: 'Word Frequency',
        description: 'Distribution of word selections',
        result: {
          clubs: 25,
          diamonds: 27,
          hearts: 23,
          spades: 25,
        },
        metadata: { totalSamples: 100 },
      };

      const result = await repository.saveAnalysisResult(options);

      expect(result).toBeDefined();
      expect(result._id).toBeDefined();
      expect(result.evaluationRunId.toString()).toBe(evaluationRunId.toString());
      expect(result.type).toBe(options.type);
      expect(result.name).toBe(options.name);
      expect(result.description).toBe(options.description);
      expect(result.result).toEqual(options.result);
      expect(result.metadata).toEqual(options.metadata);
    });

    it('should update an existing analysis result with the same key', async () => {
      // Save initial result
      const initialResult = await repository.saveAnalysisResult({
        evaluationRunId,
        type: AnalysisResultType.POSITION_BIAS,
        name: 'Position Analysis',
        result: { initial: true, data: [0.25, 0.25, 0.25, 0.25] },
      });

      // Update with new data
      const updatedResult = await repository.saveAnalysisResult({
        evaluationRunId,
        type: AnalysisResultType.POSITION_BIAS,
        name: 'Position Analysis',
        result: { updated: true, data: [0.2, 0.3, 0.3, 0.2] },
        description: 'Updated description',
      });

      // Should have updated the existing record
      expect(getIdAsString(updatedResult)).toBe(getIdAsString(initialResult));
      expect(updatedResult.result).toEqual({ updated: true, data: [0.2, 0.3, 0.3, 0.2] });
      expect(updatedResult.description).toBe('Updated description');
    });

    it('should get analysis results with optional type filtering', async () => {
      // Save multiple analysis results
      await repository.saveAnalysisResult({
        evaluationRunId,
        type: AnalysisResultType.FREQUENCY_DISTRIBUTION,
        name: 'Word Frequency',
        result: { word: 'frequency' },
      });

      await repository.saveAnalysisResult({
        evaluationRunId,
        type: AnalysisResultType.POSITION_BIAS,
        name: 'Position Analysis',
        result: { position: 'bias' },
      });

      await repository.saveAnalysisResult({
        evaluationRunId,
        type: AnalysisResultType.STATISTICAL_TEST,
        name: 'Chi-Square Test',
        result: { pValue: 0.42 },
      });

      // Get all results
      const allResults = await repository.getAnalysisResults(evaluationRunId);
      expect(allResults).toHaveLength(3);

      // Filter by type
      const frequencyResults = await repository.getAnalysisResults(
        evaluationRunId,
        AnalysisResultType.FREQUENCY_DISTRIBUTION
      );
      expect(frequencyResults).toHaveLength(1);
      expect(frequencyResults[0].name).toBe('Word Frequency');

      const positionResults = await repository.getAnalysisResults(
        evaluationRunId,
        AnalysisResultType.POSITION_BIAS
      );
      expect(positionResults).toHaveLength(1);
      expect(positionResults[0].name).toBe('Position Analysis');
    });
  });
});