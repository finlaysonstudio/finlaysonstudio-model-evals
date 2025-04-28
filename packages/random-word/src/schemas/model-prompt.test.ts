import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  ModelPromptParamsSchema,
  StructuredPromptSchema, 
  createStructuredPrompt,
  createSimplePrompt,
  createDetailedPrompt
} from './model-prompt';
import { DEFAULT_WORD_OPTIONS } from './random-word';
import * as arrayUtils from '../utils/array';

describe('Model Prompt Schemas', () => {
  describe('ModelPromptParamsSchema', () => {
    it('should validate valid params', () => {
      const validParams = {
        wordOptions: ['red', 'green', 'blue', 'yellow'],
        randomize: true,
        includeInstructions: true,
        promptStyle: 'structured' as const
      };
      
      const result = ModelPromptParamsSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });
    
    it('should use defaults for missing params', () => {
      const partialParams = {};
      
      const result = ModelPromptParamsSchema.parse(partialParams);
      expect(result).toEqual({
        wordOptions: [...DEFAULT_WORD_OPTIONS],
        randomize: true,
        includeInstructions: true,
        promptStyle: 'structured'
      });
    });

    it('should validate prompt style options', () => {
      const validStyles = ['simple', 'structured', 'detailed'];
      validStyles.forEach(style => {
        const params = { promptStyle: style };
        const result = ModelPromptParamsSchema.safeParse(params);
        expect(result.success).toBe(true);
      });

      // Invalid style
      const invalidParams = { promptStyle: 'invalid' };
      const result = ModelPromptParamsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });
  
  describe('StructuredPromptSchema', () => {
    it('should validate valid structured prompts', () => {
      const validPrompt = {
        task: 'random word selection',
        context: {
          options: ['clubs', 'diamonds', 'hearts', 'spades']
        },
        instructions: 'Choose one word randomly',
        outputFormat: {
          selectedWord: '',
          reason: ''
        }
      };
      
      const result = StructuredPromptSchema.safeParse(validPrompt);
      expect(result.success).toBe(true);
    });
  });
  
  describe('createStructuredPrompt', () => {
    let shuffleArraySpy: any;
    
    beforeEach(() => {
      // Mock shuffleArray for deterministic tests
      shuffleArraySpy = vi.spyOn(arrayUtils, 'shuffleArray').mockImplementation((arr) => {
        return [...arr].reverse(); // Simple deterministic shuffle for testing
      });
    });
    
    afterEach(() => {
      shuffleArraySpy.mockRestore();
    });
    
    it('should create a structured prompt with default options', () => {
      const prompt = createStructuredPrompt();
      
      expect(prompt).toMatchObject({
        task: 'random word selection',
        context: {
          options: expect.any(Array)
        },
        instructions: expect.stringContaining('Choose one word'),
        outputFormat: {
          selectedWord: '',
          reason: ''
        }
      });
      
      // Check that all default options are present with reversed order due to our mock
      expect(prompt.context.options).toEqual([...DEFAULT_WORD_OPTIONS].reverse());
    });
    
    it('should respect custom word options', () => {
      const customOptions = ['red', 'green', 'blue'];
      const prompt = createStructuredPrompt({
        wordOptions: customOptions
      });
      
      expect(prompt.context.options).toHaveLength(customOptions.length);
      // Should be reversed due to our mocked shuffleArray
      expect(prompt.context.options).toEqual([...customOptions].reverse());
    });
    
    it('should not randomize when randomize is false', () => {
      const customOptions = ['one', 'two', 'three', 'four'];
      const prompt = createStructuredPrompt({
        wordOptions: customOptions,
        randomize: false
      });
      
      // Order should be preserved (not reversed)
      expect(prompt.context.options).toEqual(customOptions);
      expect(shuffleArraySpy).not.toHaveBeenCalled();
    });
    
    it('should exclude instructions when includeInstructions is false', () => {
      const prompt = createStructuredPrompt({
        includeInstructions: false
      });
      
      expect(prompt.instructions).toBe('');
    });
  });

  describe('createSimplePrompt', () => {
    it('should create a simple prompt with the provided options', () => {
      const options = ['clubs', 'diamonds', 'hearts', 'spades'];
      const prompt = createSimplePrompt(options);
      
      expect(prompt).toBe('Choose a random word from the following list: clubs, diamonds, hearts, spades');
    });
    
    it('should handle empty options array', () => {
      const prompt = createSimplePrompt([]);
      
      expect(prompt).toBe('Choose a random word from the following list: ');
    });
  });
  
  describe('createDetailedPrompt', () => {
    it('should create a detailed prompt with numbered options', () => {
      const options = ['clubs', 'diamonds', 'hearts', 'spades'];
      const prompt = createDetailedPrompt(options);
      
      expect(prompt).toContain('# Random Word Selection Task');
      expect(prompt).toContain('1. clubs');
      expect(prompt).toContain('2. diamonds');
      expect(prompt).toContain('3. hearts');
      expect(prompt).toContain('4. spades');
      expect(prompt).toContain('making your choice completely at random');
      expect(prompt).toContain('selectedWord');
      expect(prompt).toContain('reason');
    });
  });
});