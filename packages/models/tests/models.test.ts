import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createModelClient, ModelConfig, DEFAULT_MODEL_NAMES } from '../src/models/client';
import { z } from 'zod';

// Import mocked modules
import * as ai from 'ai';
import * as openaiModule from '@ai-sdk/openai';
import * as anthropicModule from '@ai-sdk/anthropic';

// Mocks for external dependencies
vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({ text: 'mocked text response' }),
  generateObject: vi.fn().mockResolvedValue({ 
    object: { result: 'mocked object result', selectedWord: 'hearts' } 
  })
}));

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn().mockReturnValue((modelName: string) => `mocked-openai-${modelName}`)
}));

vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn().mockReturnValue((modelName: string) => `mocked-anthropic-${modelName}`)
}));

describe('createModelClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should create an OpenAI client with correct configuration', () => {
    const config: ModelConfig = {
      provider: 'openai',
      apiKey: 'test-key',
      baseURL: 'https://api.test.com'
    };
    
    createModelClient(config);
    
    expect(openaiModule.createOpenAI).toHaveBeenCalledWith({
      apiKey: 'test-key',
      baseURL: 'https://api.test.com'
    });
  });

  it('should create an Anthropic client with correct configuration', () => {
    const config: ModelConfig = {
      provider: 'anthropic',
      apiKey: 'test-key',
      baseURL: 'https://api.test.com'
    };
    
    createModelClient(config);
    
    expect(anthropicModule.createAnthropic).toHaveBeenCalledWith({
      apiKey: 'test-key',
      baseURL: 'https://api.test.com'
    });
  });

  it('should throw error for unsupported provider', () => {
    const config = {
      provider: 'unsupported' as any,
      apiKey: 'test-key'
    };
    
    expect(() => createModelClient(config)).toThrow(/Unsupported provider/);
  });

  it('should generate text response with correct parameters', async () => {
    const config: ModelConfig = {
      provider: 'openai',
      apiKey: 'test-key'
    };
    
    const client = createModelClient(config);
    const response = await client.generateResponse('Test prompt');
    
    // Verify that generateText was called with the correct model and prompt
    expect(ai.generateText).toHaveBeenCalledWith({
      model: `mocked-openai-${DEFAULT_MODEL_NAMES.openai}`,
      prompt: 'Test prompt'
    });
    
    // Check the response
    expect(response).toBe('mocked text response');
  });

  it('should generate object with correct parameters', async () => {
    const config: ModelConfig = {
      provider: 'openai',
      apiKey: 'test-key'
    };
    
    const client = createModelClient(config);
    const schema = z.object({
      result: z.string(),
      selectedWord: z.enum(['clubs', 'diamonds', 'hearts', 'spades'])
    });
    
    const response = await client.generateObject(schema, 'Test prompt');
    
    // Verify that generateObject was called with the correct parameters
    expect(ai.generateObject).toHaveBeenCalledWith({
      model: `mocked-openai-${DEFAULT_MODEL_NAMES.openai}`,
      prompt: 'Test prompt',
      schema: schema
    });
    
    // Check the response
    expect(response).toEqual({ 
      result: 'mocked object result',
      selectedWord: 'hearts'
    });
  });

  it('should use the custom model name when provided', async () => {
    const config: ModelConfig = {
      provider: 'anthropic',
      apiKey: 'test-key',
      modelName: 'custom-model-name'
    };
    
    const client = createModelClient(config);
    await client.generateResponse('Test prompt');
    
    // Verify that generateText was called with the custom model
    expect(ai.generateText).toHaveBeenCalledWith({
      model: 'mocked-anthropic-custom-model-name',
      prompt: 'Test prompt'
    });
  });
});