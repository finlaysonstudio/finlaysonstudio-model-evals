import { describe, it, expect, vi } from 'vitest';
import { shuffleArray, getPromptWithRandomizedOptions, getRandomWordSelection, RandomWordSchema } from '../src/index';
import { ModelClient } from '@finlaysonstudio/eval-models';
import { z } from 'zod';

describe('shuffleArray', () => {
  it('should return an array of the same length', () => {
    const input = ['clubs', 'diamonds', 'hearts', 'spades'];
    const result = shuffleArray(input);
    expect(result.length).toBe(input.length);
  });

  it('should contain all the same elements', () => {
    const input = ['clubs', 'diamonds', 'hearts', 'spades'];
    const result = shuffleArray(input);
    expect(result).toEqual(expect.arrayContaining(input));
    expect(input).toEqual(expect.arrayContaining(result));
  });
});

describe('getPromptWithRandomizedOptions', () => {
  it('should include all options in the prompt', () => {
    const options = ['clubs', 'diamonds', 'hearts', 'spades'];
    const prompt = getPromptWithRandomizedOptions(options);
    for (const option of options) {
      expect(prompt).toContain(option);
    }
  });

  it('should start with the expected prefix', () => {
    const options = ['clubs', 'diamonds', 'hearts', 'spades'];
    const prompt = getPromptWithRandomizedOptions(options);
    expect(prompt).toContain('Choose a random word from the following list:');
  });
});

describe('RandomWordSchema', () => {
  it('should validate valid inputs', () => {
    const validInput = {
      selectedWord: 'clubs',
      reason: 'randomly selected'
    };
    
    const result = RandomWordSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });
  
  it('should validate without an optional reason', () => {
    const validInput = {
      selectedWord: 'diamonds'
    };
    
    const result = RandomWordSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });
  
  it('should reject invalid inputs', () => {
    const invalidInput = {
      selectedWord: 123, // Should be a string
      reason: 'test'
    };
    
    const result = RandomWordSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });
});

describe('getRandomWordSelection', () => {
  it('should get a random word selection from the model', async () => {
    // Mock model client
    const mockModelClient: ModelClient = {
      generateResponse: vi.fn(),
      generateObject: vi.fn().mockResolvedValue({
        selectedWord: 'clubs',
        reason: 'test reason'
      })
    };
    
    const options = ['clubs', 'diamonds', 'hearts', 'spades'];
    const result = await getRandomWordSelection(mockModelClient, options);
    
    expect(mockModelClient.generateObject).toHaveBeenCalledWith(
      RandomWordSchema,
      expect.stringContaining('Choose a random word')
    );
    
    expect(result).toEqual({
      selectedWord: 'clubs',
      reason: 'test reason'
    });
  });
});