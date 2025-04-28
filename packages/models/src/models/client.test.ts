import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createModelClient, ModelConfig, DEFAULT_MODEL_NAMES } from './client';
import { z } from 'zod';

// Mocks for external dependencies
vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({ text: 'mocked text response' }),
  generateObject: vi.fn().mockResolvedValue({ 
    object: { result: 'mocked object result', selectedWord: 'hearts' } 
  }),
  streamText: vi.fn().mockResolvedValue({}),
  streamObject: vi.fn().mockResolvedValue({})
}));

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn().mockReturnValue((modelName: string) => `mocked-openai-${modelName}`)
}));

vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn().mockReturnValue((modelName: string) => `mocked-anthropic-${modelName}`)
}));

// Import mocked modules after the mocks are set up
import { generateText, generateObject, streamText, streamObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

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
    
    expect(createOpenAI).toHaveBeenCalledWith({
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
    
    expect(createAnthropic).toHaveBeenCalledWith({
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
    expect(generateText).toHaveBeenCalledWith({
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
    expect(generateObject).toHaveBeenCalledWith({
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
    expect(generateText).toHaveBeenCalledWith({
      model: 'mocked-anthropic-custom-model-name',
      prompt: 'Test prompt',
      temperature: undefined,
      maxTokens: undefined
    });
  });
  
  it('should stream text response with correct parameters', async () => {
    const config: ModelConfig = {
      provider: 'openai',
      apiKey: 'test-key',
      temperature: 0.7,
      maxTokens: 500
    };
    
    const client = createModelClient(config);
    await client.streamResponse('Test prompt');
    
    // Verify that streamText was called with the correct parameters
    expect(streamText).toHaveBeenCalledWith({
      model: `mocked-openai-${DEFAULT_MODEL_NAMES.openai}`,
      prompt: 'Test prompt',
      temperature: 0.7,
      maxTokens: 500
    });
  });
  
  it('should stream object with correct parameters', async () => {
    const config: ModelConfig = {
      provider: 'openai',
      apiKey: 'test-key'
    };
    
    const client = createModelClient(config);
    const schema = z.object({
      result: z.string(),
      selectedWord: z.enum(['clubs', 'diamonds', 'hearts', 'spades'])
    });
    
    await client.streamObject(schema, 'Test prompt');
    
    // Verify that streamObject was called with the correct parameters
    expect(streamObject).toHaveBeenCalledWith({
      model: `mocked-openai-${DEFAULT_MODEL_NAMES.openai}`,
      prompt: 'Test prompt',
      schema: schema,
      temperature: undefined,
      maxTokens: undefined
    });
  });
  
  it('should generate completion with correct parameters', async () => {
    const config: ModelConfig = {
      provider: 'openai',
      apiKey: 'test-key',
      temperature: 0.5
    };
    
    const client = createModelClient(config);
    const response = await client.generateCompletion('Test prompt', { maxTokens: 1000 });
    
    // Verify that generateText was called with correct parameters (as fallback for generateCompletion)
    expect(generateText).toHaveBeenCalledWith({
      model: `mocked-openai-${DEFAULT_MODEL_NAMES.openai}`,
      prompt: 'Test prompt',
      temperature: 0.5,
      maxTokens: 1000
    });
    
    // Check the response
    expect(response).toBe('mocked text response');
  });
  
  it('should throw error for unsupported providers', () => {
    // Test with an unsupported provider
    const config = {
      provider: 'fakeprovider' as any,
      apiKey: 'test-key'
    };
    
    expect(() => createModelClient(config)).toThrow(/Unsupported provider/);
  });
  
  it('should handle organization ID for OpenAI', () => {
    const config: ModelConfig = {
      provider: 'openai',
      apiKey: 'test-key',
      organizationId: 'org-123456'
    };
    
    createModelClient(config);
    
    expect(createOpenAI).toHaveBeenCalledWith({
      apiKey: 'test-key',
      baseURL: undefined,
      organization: 'org-123456'
    });
  });
});