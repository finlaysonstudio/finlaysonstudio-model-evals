import { describe, it, expect } from 'vitest';
import { shuffleArray, getPromptWithRandomizedOptions } from '../src/index';

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