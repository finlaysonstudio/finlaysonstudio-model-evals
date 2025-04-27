import { describe, it, expect } from 'vitest';
import { createModelClient } from '../src/index';

describe('createModelClient', () => {
  it('should return a ModelClient instance', async () => {
    const client = await createModelClient('test-provider');
    expect(client).toBeDefined();
    expect(client).toHaveProperty('generateResponse');
  });

  it('should generate a response containing the prompt', async () => {
    const client = await createModelClient('test-provider');
    const prompt = 'Test prompt';
    const response = await client.generateResponse(prompt);
    expect(response).toContain(prompt);
  });
});