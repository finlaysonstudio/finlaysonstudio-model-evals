import { describe, it, expect, vi } from 'vitest';
import { 
  shuffleArray, 
  getPromptWithRandomizedOptions, 
  getRandomWordSelection,
  runSingleEvaluation,
  evaluateRandomWordSelection 
} from './index';
import { RandomWordSchema, DEFAULT_WORD_OPTIONS } from './schemas/random-word';
import { calculateWordFrequency } from './analysis/word-frequency';
import { calculatePositionBias } from './analysis/position-bias';
import { calculateChiSquare } from './analysis';
import { ModelClient } from './types/model-client';
import * as arrayUtils from './utils/array';

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

  it('should start with the expected prefix in simple style', () => {
    const options = ['clubs', 'diamonds', 'hearts', 'spades'];
    const prompt = getPromptWithRandomizedOptions(options, 'simple');
    expect(prompt).toContain('Choose a random word from the following list:');
  });
  
  it('should generate a structured prompt when specified', () => {
    const options = ['clubs', 'diamonds', 'hearts', 'spades'];
    const prompt = getPromptWithRandomizedOptions(options, 'structured');
    expect(prompt).toContain('# Task: random word selection');
    expect(prompt).toContain('## Context');
    for (const option of options) {
      expect(prompt).toContain(option);
    }
  });
  
  it('should generate a detailed prompt when specified', () => {
    const options = ['clubs', 'diamonds', 'hearts', 'spades'];
    const prompt = getPromptWithRandomizedOptions(options, 'detailed');
    expect(prompt).toContain('# Random Word Selection Task');
    for (let i = 0; i < options.length; i++) {
      expect(prompt).toContain(`${i + 1}.`); // Should have numbered options
    }
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
  it('should get a random word selection from the model with simple prompt', async () => {
    // Mock model client
    const mockModelClient: ModelClient = {
      generateResponse: vi.fn(),
      generateObject: vi.fn().mockResolvedValue({
        selectedWord: 'clubs',
        reason: 'test reason'
      })
    };
    
    const options = ['clubs', 'diamonds', 'hearts', 'spades'];
    const result = await getRandomWordSelection(mockModelClient, options, 'simple');
    
    expect(mockModelClient.generateObject).toHaveBeenCalled();
    expect(mockModelClient.generateObject.mock.calls[0][1]).toContain('Choose a random word');
    
    expect(result).toEqual({
      selectedWord: 'clubs',
      reason: 'test reason'
    });
  });
  
  it('should get a random word selection with structured prompt', async () => {
    // Mock model client
    const mockModelClient: ModelClient = {
      generateResponse: vi.fn(),
      generateObject: vi.fn().mockResolvedValue({
        selectedWord: 'diamonds',
        reason: 'test reason'
      })
    };
    
    const options = ['clubs', 'diamonds', 'hearts', 'spades'];
    const result = await getRandomWordSelection(mockModelClient, options, 'structured');
    
    expect(mockModelClient.generateObject).toHaveBeenCalled();
    expect(mockModelClient.generateObject.mock.calls[0][1]).toContain('# Task: random word selection');
    
    expect(result).toEqual({
      selectedWord: 'diamonds',
      reason: 'test reason'
    });
  });
  
  it('should get a random word selection with detailed prompt', async () => {
    // Mock model client
    const mockModelClient: ModelClient = {
      generateResponse: vi.fn(),
      generateObject: vi.fn().mockResolvedValue({
        selectedWord: 'hearts',
        reason: 'test reason'
      })
    };
    
    const options = ['clubs', 'diamonds', 'hearts', 'spades'];
    const result = await getRandomWordSelection(mockModelClient, options, 'detailed');
    
    expect(mockModelClient.generateObject).toHaveBeenCalled();
    expect(mockModelClient.generateObject.mock.calls[0][1]).toContain('# Random Word Selection Task');
    
    expect(result).toEqual({
      selectedWord: 'hearts',
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
    
    expect(mockModelClient.generateObject).toHaveBeenCalled();
    DEFAULT_WORD_OPTIONS.forEach(option => {
      expect(mockModelClient.generateObject.mock.calls[0][0].shape.selectedWord._def.values).toContain(option);
    });
  });
});

describe('runSingleEvaluation', () => {
  it('should track selected word and its position with simple prompt', async () => {
    // Mock model client that returns the word at the specified position in the shuffled array
    const mockModelClient: ModelClient = {
      generateResponse: vi.fn(),
      generateObject: vi.fn().mockImplementation((schema, prompt) => {
        // This implementation doesn't need to parse the prompt anymore
        // since we're using our schema parameter to get the options
        const options = schema.shape.selectedWord._def.values;
        return Promise.resolve({
          selectedWord: options[0], // Always select the first option in the schema
          reason: 'test reason'
        });
      })
    };
    
    // Mock the shuffleArray function to return a predictable result
    const mockShuffleArray = vi.spyOn(arrayUtils, 'shuffleArray').mockImplementation(arr => [...arr]);
    
    try {
      const options = ['clubs', 'diamonds', 'hearts', 'spades'];
      const result = await runSingleEvaluation(mockModelClient, options, 'simple');
      
      expect(result.word).toBe('clubs'); // First word in our non-shuffled array
      expect(options).toContain(result.word);
      expect(result.position).toBe(0); // Position in the original array
      expect(result.originalOrder).toHaveLength(options.length);
      expect(result.originalOrder[0]).toBe(result.word);
    } finally {
      // Restore the original implementation
      mockShuffleArray.mockRestore();
    }
  });
  
  it('should track selected word and its position with structured prompt', async () => {
    // Mock model client
    const mockModelClient: ModelClient = {
      generateResponse: vi.fn(),
      generateObject: vi.fn().mockImplementation((schema, prompt) => {
        // Always return the same word for predictable testing
        return Promise.resolve({
          selectedWord: 'diamonds',
          reason: 'test reason'
        });
      })
    };
    
    const options = ['clubs', 'diamonds', 'hearts', 'spades'];
    const result = await runSingleEvaluation(mockModelClient, options, 'structured');
    
    expect(result.word).toBe('diamonds');
    expect(result.position).toBeDefined();
    expect(Number.isInteger(result.position)).toBe(true);
    expect(result.originalOrder).toHaveLength(options.length);
    expect(result.originalOrder[result.position]).toBe('diamonds');
  });
  
  it('should work with different prompt styles', async () => {
    // Mock model client
    const mockModelClient: ModelClient = {
      generateResponse: vi.fn(),
      generateObject: vi.fn().mockResolvedValue({
        selectedWord: 'hearts',
        reason: 'test reason'
      })
    };
    
    const options = ['clubs', 'diamonds', 'hearts', 'spades'];
    
    // Test with simple prompt
    await runSingleEvaluation(mockModelClient, options, 'simple');
    expect(mockModelClient.generateObject.mock.calls[0][1]).toContain('Choose a random word from');
    
    // Reset mock and test with detailed prompt
    mockModelClient.generateObject.mockClear();
    await runSingleEvaluation(mockModelClient, options, 'detailed');
    expect(mockModelClient.generateObject.mock.calls[0][1]).toContain('# Random Word Selection Task');
  });
});

describe('evaluateRandomWordSelection', () => {
  it('should run multiple evaluations and collect statistics with default prompt', async () => {
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
  
  it('should run multiple evaluations with structured prompt style', async () => {
    // Mock model client that returns different values in sequence
    const responses = ['clubs', 'diamonds', 'hearts', 'spades'];
    let callCount = 0;
    const mockModelClient: ModelClient = {
      generateResponse: vi.fn(),
      generateObject: vi.fn().mockImplementation(() => {
        const index = callCount % responses.length;
        callCount++;
        return Promise.resolve({
          selectedWord: responses[index],
          reason: 'test reason'
        });
      })
    };
    
    const numRuns = 8; // 2 complete cycles through our responses
    const result = await evaluateRandomWordSelection(
      mockModelClient, 
      DEFAULT_WORD_OPTIONS, 
      numRuns, 
      'structured'
    );
    
    expect(result.totalRuns).toBe(numRuns);
    expect(result.rawSelections).toHaveLength(numRuns);
    
    // Verify word frequencies (each word should appear twice)
    responses.forEach(word => {
      expect(result.selectedWords[word]).toBe(2);
    });
    
    // Check that the right prompt style was used
    expect(mockModelClient.generateObject.mock.calls[0][1]).toContain('# Task: random word selection');
  });
  
  it('should support different prompt styles for evaluations', async () => {
    // Mock model client that always returns the same value for testing
    const mockModelClient: ModelClient = {
      generateResponse: vi.fn(),
      generateObject: vi.fn().mockResolvedValue({
        selectedWord: 'clubs',
        reason: 'test reason'
      })
    };
    
    // Test simple style
    await evaluateRandomWordSelection(mockModelClient, DEFAULT_WORD_OPTIONS, 2, 'simple');
    expect(mockModelClient.generateObject.mock.calls[0][1]).toContain('Choose a random word from');
    
    // Reset and test detailed style
    mockModelClient.generateObject.mockClear();
    await evaluateRandomWordSelection(mockModelClient, DEFAULT_WORD_OPTIONS, 2, 'detailed');
    expect(mockModelClient.generateObject.mock.calls[0][1]).toContain('# Random Word Selection Task');
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