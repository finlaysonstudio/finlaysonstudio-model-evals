import { describe, it, expect, vi } from 'vitest';
import { 
  shuffleArray, 
  getPromptWithRandomizedOptions, 
  getRandomWordSelection,
  runSingleEvaluation,
  evaluateRandomWordSelection 
} from '../src/index';
import { RandomWordSchema, DEFAULT_WORD_OPTIONS } from '../src/schemas/random-word';
import { calculateWordFrequency } from '../src/analysis/word-frequency';
import { calculatePositionBias } from '../src/analysis/position-bias';
import { calculateChiSquare } from '../src/analysis';
import { ModelClient } from '../src/types/model-client';

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
  
  it('should reject words not in the enum', () => {
    const invalidInput = {
      selectedWord: 'invalid',
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
  
  it('should use default options if none provided', async () => {
    // Mock model client
    const mockModelClient: ModelClient = {
      generateResponse: vi.fn(),
      generateObject: vi.fn().mockResolvedValue({
        selectedWord: 'clubs',
        reason: 'test reason'
      })
    };
    
    await getRandomWordSelection(mockModelClient);
    
    expect(mockModelClient.generateObject).toHaveBeenCalledWith(
      RandomWordSchema,
      expect.stringContaining(DEFAULT_WORD_OPTIONS[0])
    );
  });
});

describe('runSingleEvaluation', () => {
  it('should track selected word and its position', async () => {
    // Mock model client
    const mockModelClient: ModelClient = {
      generateResponse: vi.fn(),
      generateObject: vi.fn().mockImplementation((schema, prompt) => {
        // Extract the first option from the prompt and return it
        const match = prompt.match(/list: (.*?)(?:,|$)/);
        const firstWord = match ? match[1] : 'clubs';
        return Promise.resolve({
          selectedWord: firstWord,
          reason: 'test reason'
        });
      })
    };
    
    const options = ['clubs', 'diamonds', 'hearts', 'spades'];
    const result = await runSingleEvaluation(mockModelClient, options);
    
    expect(result.word).toBeDefined();
    expect(options).toContain(result.word);
    expect(result.position).toBe(0); // Since our mock always picks the first option
    expect(result.originalOrder).toHaveLength(options.length);
    expect(result.originalOrder[0]).toBe(result.word);
  });
});

describe('evaluateRandomWordSelection', () => {
  it('should run multiple evaluations and collect statistics', async () => {
    // Mock model client that alternates between returning clubs and hearts
    let callCount = 0;
    const mockModelClient: ModelClient = {
      generateResponse: vi.fn(),
      generateObject: vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          selectedWord: callCount % 2 === 0 ? 'hearts' : 'clubs',
          reason: 'test reason'
        });
      })
    };
    
    const numRuns = 10;
    const result = await evaluateRandomWordSelection(mockModelClient, DEFAULT_WORD_OPTIONS, numRuns);
    
    expect(result.totalRuns).toBe(numRuns);
    expect(result.rawSelections).toHaveLength(numRuns);
    
    // Verify word frequencies
    expect(result.selectedWords.clubs).toBe(5);
    expect(result.selectedWords.hearts).toBe(5);
    
    // Verify we have position bias data
    expect(Object.keys(result.positionBias).length).toBeGreaterThan(0);
  });
});

describe('Analysis functions', () => {
  describe('calculateWordFrequency', () => {
    it('should correctly count word occurrences', () => {
      const selections = [
        { word: 'hearts' },
        { word: 'clubs' },
        { word: 'hearts' },
        { word: 'diamonds' }
      ];
      
      const result = calculateWordFrequency(selections);
      
      expect(result).toEqual({
        hearts: 2,
        clubs: 1,
        diamonds: 1
      });
    });
  });
  
  describe('calculatePositionBias', () => {
    it('should correctly count position occurrences', () => {
      const selections = [
        { word: 'hearts', position: 2 },
        { word: 'clubs', position: 0 },
        { word: 'hearts', position: 3 },
        { word: 'diamonds', position: 0 }
      ];
      
      const result = calculatePositionBias(selections);
      
      expect(result).toEqual({
        0: 2,
        2: 1,
        3: 1
      });
    });
  });
  
  describe('calculateChiSquare', () => {
    it('should calculate chi-square for a uniform distribution', () => {
      const observed = {
        clubs: 25,
        diamonds: 25,
        hearts: 25,
        spades: 25
      };
      const totalObservations = 100;
      
      const result = calculateChiSquare(observed, totalObservations);
      
      expect(result.chiSquare).toBe(0);
      expect(result.degreesOfFreedom).toBe(3);
      expect(result.interpretation).toContain('random');
    });
    
    it('should calculate chi-square for a biased distribution', () => {
      const observed = {
        clubs: 40,
        diamonds: 30,
        hearts: 20,
        spades: 10
      };
      const totalObservations = 100;
      
      const result = calculateChiSquare(observed, totalObservations);
      
      expect(result.chiSquare).toBeGreaterThan(0);
      expect(result.degreesOfFreedom).toBe(3);
      expect(result.interpretation).toBeDefined();
    });
  });
});