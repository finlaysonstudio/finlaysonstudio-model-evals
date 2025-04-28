import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  formatStructuredPrompt, 
  generateRandomWordWithStructuredOutput,
  createCustomRandomWordSchema
} from './model-utils';
import { createStructuredPrompt } from '../schemas/model-prompt';
import { DEFAULT_WORD_OPTIONS } from '../schemas/random-word';

describe('Model Utilities', () => {
  describe('formatStructuredPrompt', () => {
    it('should format a structured prompt correctly', () => {
      const prompt = createStructuredPrompt({
        wordOptions: ['red', 'blue', 'green'],
        randomize: false
      });
      
      const formatted = formatStructuredPrompt(prompt);
      
      expect(formatted).toContain('# Task: random word selection');
      expect(formatted).toContain('Available options: red, blue, green');
      expect(formatted).toContain('## Instructions');
      expect(formatted).toContain('## Output Format');
      expect(formatted).toContain('selectedWord');
      expect(formatted).toContain('reason');
    });
    
    it('should omit instructions when not provided', () => {
      const prompt = createStructuredPrompt({
        includeInstructions: false
      });
      
      const formatted = formatStructuredPrompt(prompt);
      
      expect(formatted).not.toContain('## Instructions');
      expect(formatted).toContain('# Task:');
      expect(formatted).toContain('## Output Format');
    });
  });
  
  describe('generateRandomWordWithStructuredOutput', () => {
    it('should call model.generateObject with correct arguments', async () => {
      // Mock model client
      const mockModel = {
        generateResponse: vi.fn(),
        generateObject: vi.fn().mockResolvedValue({
          selectedWord: 'hearts',
          reason: 'Chosen randomly'
        })
      };
      
      const result = await generateRandomWordWithStructuredOutput(mockModel, {
        wordOptions: [...DEFAULT_WORD_OPTIONS]
      });
      
      expect(mockModel.generateObject).toHaveBeenCalledTimes(1);
      expect(mockModel.generateObject.mock.calls[0][1]).toContain('# Task:');
      expect(result).toEqual({
        selectedWord: 'hearts',
        reason: 'Chosen randomly'
      });
    });
  });
  
  describe('createCustomRandomWordSchema', () => {
    it('should create a valid schema with custom options', () => {
      const colors = ['red', 'green', 'blue'];
      const schema = createCustomRandomWordSchema(colors);
      
      // Should validate valid data
      const validData = {
        selectedWord: 'blue',
        reason: 'This is my favorite color'
      };
      expect(schema.safeParse(validData).success).toBe(true);
      
      // Should reject invalid data
      const invalidData = {
        selectedWord: 'purple', // Not in the options
        reason: 'This is invalid'
      };
      expect(schema.safeParse(invalidData).success).toBe(false);
    });
    
    it('should throw an error for empty options', () => {
      expect(() => createCustomRandomWordSchema([])).toThrow();
    });
  });
});