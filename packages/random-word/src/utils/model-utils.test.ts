import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  formatStructuredPrompt, 
  generateRandomWordWithStructuredOutput,
  createCustomRandomWordSchema,
  generateRandomWordPrompt,
  generateRandomWordWithCustomPrompt
} from './model-utils';
import { createStructuredPrompt } from '../schemas/model-prompt';
import { DEFAULT_WORD_OPTIONS } from '../schemas/random-word';
import * as arrayUtils from './array';

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
  
  describe('generateRandomWordPrompt', () => {
    let shuffleArraySpy: any;
    
    beforeEach(() => {
      // Mock shuffleArray to make tests deterministic
      shuffleArraySpy = vi.spyOn(arrayUtils, 'shuffleArray').mockImplementation((arr) => {
        return [...arr].reverse(); // Simple mock: just reverse the array for predictable results
      });
    });
    
    afterEach(() => {
      shuffleArraySpy.mockRestore();
    });
    
    it('should generate a simple prompt with randomized word order', () => {
      const options = ['clubs', 'diamonds', 'hearts', 'spades'];
      const prompt = generateRandomWordPrompt(options, 'simple');
      
      expect(prompt).toBe('Choose a random word from the following list: spades, hearts, diamonds, clubs');
      expect(shuffleArraySpy).toHaveBeenCalledWith(options);
    });
    
    it('should generate a structured prompt with randomized word order', () => {
      const options = ['clubs', 'diamonds', 'hearts', 'spades'];
      const prompt = generateRandomWordPrompt(options, 'structured');
      
      expect(prompt).toContain('# Task: random word selection');
      expect(prompt).toContain('Available options: spades, hearts, diamonds, clubs');
      expect(prompt).toContain('Choose one word from the provided options completely at random');
      expect(shuffleArraySpy).toHaveBeenCalledWith(options);
    });
    
    it('should generate a detailed prompt with randomized word order', () => {
      const options = ['clubs', 'diamonds', 'hearts', 'spades'];
      const prompt = generateRandomWordPrompt(options, 'detailed');
      
      expect(prompt).toContain('# Random Word Selection Task');
      expect(prompt).toContain('1. spades');
      expect(prompt).toContain('2. hearts');
      expect(prompt).toContain('3. diamonds');
      expect(prompt).toContain('4. clubs');
      expect(prompt).toContain('making your choice completely at random');
      expect(shuffleArraySpy).toHaveBeenCalledWith(options);
    });
    
    it('should use default options when none are provided', () => {
      const prompt = generateRandomWordPrompt();
      
      DEFAULT_WORD_OPTIONS.forEach(option => {
        // Since we mocked shuffleArray to reverse, we expect reversed order
        expect(prompt).toContain(option);
      });
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
  
  describe('generateRandomWordWithCustomPrompt', () => {
    beforeEach(() => {
      // Mock shuffleArray to make tests deterministic
      vi.spyOn(arrayUtils, 'shuffleArray').mockImplementation((arr) => {
        return [...arr].reverse(); // Simple mock: just reverse the array
      });
    });
    
    afterEach(() => {
      vi.restoreAllMocks();
    });
    
    it('should call model.generateObject with the correct prompt and schema', async () => {
      // Mock model client
      const mockModel = {
        generateResponse: vi.fn(),
        generateObject: vi.fn().mockResolvedValue({
          selectedWord: 'hearts',
          reason: 'Chosen randomly'
        })
      };
      
      const options = ['clubs', 'diamonds', 'hearts', 'spades'];
      const result = await generateRandomWordWithCustomPrompt(mockModel, options, 'simple');
      
      expect(mockModel.generateObject).toHaveBeenCalledTimes(1);
      
      // Verify that a custom schema was created with the provided options
      const schemaArg = mockModel.generateObject.mock.calls[0][0];
      expect(schemaArg.shape.selectedWord._def.values).toEqual(options);
      
      // Verify the prompt was generated with randomized options
      const promptArg = mockModel.generateObject.mock.calls[0][1];
      expect(promptArg).toBe('Choose a random word from the following list: spades, hearts, diamonds, clubs');
      
      // Verify the result matches the mock response
      expect(result).toEqual({
        selectedWord: 'hearts',
        reason: 'Chosen randomly'
      });
    });
    
    it('should use different prompt styles', async () => {
      // Mock model client
      const mockModel = {
        generateResponse: vi.fn(),
        generateObject: vi.fn().mockResolvedValue({
          selectedWord: 'diamonds',
          reason: 'Chosen randomly'
        })
      };
      
      // Test with structured prompt
      await generateRandomWordWithCustomPrompt(mockModel, DEFAULT_WORD_OPTIONS, 'structured');
      expect(mockModel.generateObject.mock.calls[0][1]).toContain('# Task: random word selection');
      
      // Reset mock and test with detailed prompt
      mockModel.generateObject.mockClear();
      await generateRandomWordWithCustomPrompt(mockModel, DEFAULT_WORD_OPTIONS, 'detailed');
      expect(mockModel.generateObject.mock.calls[0][1]).toContain('# Random Word Selection Task');
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