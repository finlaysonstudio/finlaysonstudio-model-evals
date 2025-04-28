import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  ModelPromptParamsSchema,
  StructuredPromptSchema, 
  createStructuredPrompt
} from './model-prompt';
import { DEFAULT_WORD_OPTIONS } from './random-word';

describe('Model Prompt Schemas', () => {
  describe('ModelPromptParamsSchema', () => {
    it('should validate valid params', () => {
      const validParams = {
        wordOptions: ['red', 'green', 'blue', 'yellow'],
        randomize: true,
        includeInstructions: true
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
        includeInstructions: true
      });
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
    // Mock Math.random to make tests deterministic
    let randomSpy: any;
    
    beforeEach(() => {
      const mockMath = Object.create(global.Math);
      mockMath.random = () => 0.5;
      randomSpy = vi.spyOn(global.Math, 'random').mockImplementation(() => 0.5);
      global.Math = mockMath;
    });
    
    afterEach(() => {
      randomSpy.mockRestore();
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
      
      // Check that all default options are present (though order may differ due to randomization)
      DEFAULT_WORD_OPTIONS.forEach(option => {
        expect(prompt.context.options).toContain(option);
      });
    });
    
    it('should respect custom word options', () => {
      const customOptions = ['red', 'green', 'blue'];
      const prompt = createStructuredPrompt({
        wordOptions: customOptions
      });
      
      expect(prompt.context.options).toHaveLength(customOptions.length);
      customOptions.forEach(option => {
        expect(prompt.context.options).toContain(option);
      });
    });
    
    it('should not randomize when randomize is false', () => {
      const customOptions = ['one', 'two', 'three', 'four'];
      const prompt = createStructuredPrompt({
        wordOptions: customOptions,
        randomize: false
      });
      
      // Order should be preserved
      expect(prompt.context.options).toEqual(customOptions);
    });
    
    it('should exclude instructions when includeInstructions is false', () => {
      const prompt = createStructuredPrompt({
        includeInstructions: false
      });
      
      expect(prompt.instructions).toBe('');
    });
  });
});