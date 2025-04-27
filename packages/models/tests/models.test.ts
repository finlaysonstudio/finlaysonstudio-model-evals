import { describe, it, expect, vi } from 'vitest';
import { createModelClient, ModelConfig } from '../src/index';
import { z } from 'zod';

// Mock the AI SDK
vi.mock('ai', () => {
  return {
    generateObject: vi.fn().mockResolvedValue({
      object: { result: 'test response', response: 'test response' }
    })
  };
});

vi.mock('@ai-sdk/openai', () => {
  return {
    openai: vi.fn().mockReturnValue('mocked-openai-model'),
    createOpenAI: vi.fn().mockReturnValue(vi.fn().mockReturnValue('mocked-openai-model'))
  };
});

vi.mock('@ai-sdk/anthropic', () => {
  return {
    anthropic: vi.fn().mockReturnValue('mocked-anthropic-model'),
    createAnthropic: vi.fn().mockReturnValue(vi.fn().mockReturnValue('mocked-anthropic-model'))
  };
});

describe('createModelClient', () => {
  it('should create an OpenAI client', () => {
    const config: ModelConfig = {
      provider: 'openai',
      apiKey: 'test-key'
    };
    
    const client = createModelClient(config);
    expect(client).toBeDefined();
    expect(client).toHaveProperty('generateResponse');
    expect(client).toHaveProperty('generateObject');
  });

  it('should create an Anthropic client', () => {
    const config: ModelConfig = {
      provider: 'anthropic',
      apiKey: 'test-key'
    };
    
    const client = createModelClient(config);
    expect(client).toBeDefined();
    expect(client).toHaveProperty('generateResponse');
    expect(client).toHaveProperty('generateObject');
  });

  it('should throw error for unsupported provider', () => {
    const config = {
      provider: 'unsupported' as any,
      apiKey: 'test-key'
    };
    
    expect(() => createModelClient(config)).toThrow(/Unsupported provider/);
  });

  it('should generate a structured object response', async () => {
    const config: ModelConfig = {
      provider: 'openai',
      apiKey: 'test-key'
    };
    
    const client = createModelClient(config);
    const schema = z.object({
      result: z.string()
    });
    
    const response = await client.generateObject(schema, 'Test prompt');
    expect(response).toEqual({ 
      result: 'test response',
      response: 'test response'
    });
  });
});