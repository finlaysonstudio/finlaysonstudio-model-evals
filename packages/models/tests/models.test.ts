import { describe, it, expect, vi } from 'vitest';
import { createModelClient, ModelConfig } from '../src/index';
import { z } from 'zod';

// Mock the AI SDK
vi.mock('ai', () => {
  return {
    OpenAI: vi.fn().mockImplementation(() => ({
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ text: '{"result": "test response"}' }]
        })
      }
    })),
    Anthropic: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ text: '{"result": "test response"}' }]
        })
      }
    })),
    VertexAI: vi.fn()
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
    expect(response).toEqual({ result: 'test response' });
  });
});