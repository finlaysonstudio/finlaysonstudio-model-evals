import { describe, it, expect } from 'vitest';
import { 
  RandomWordSchema, 
  SelectionRunSchema,
  WordFrequencySchema,
  PositionBiasSchema,
  EvaluationResultSchema,
  DEFAULT_WORD_OPTIONS
} from './random-word';

describe('Random Word Schemas', () => {
  describe('RandomWordSchema', () => {
    it('should validate valid responses', () => {
      const validResponse = {
        selectedWord: 'clubs',
        reason: 'This was chosen randomly'
      };
      
      const result = RandomWordSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });
    
    it('should validate valid responses without reason', () => {
      const validResponse = {
        selectedWord: 'hearts'
      };
      
      const result = RandomWordSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });
    
    it('should reject invalid word choices', () => {
      const invalidResponse = {
        selectedWord: 'invalid',
        reason: 'This word is not in the allowed list'
      };
      
      const result = RandomWordSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });
  
  describe('SelectionRunSchema', () => {
    it('should validate valid selection runs', () => {
      const validRun = {
        word: 'diamonds',
        position: 2,
        originalOrder: ['clubs', 'spades', 'diamonds', 'hearts']
      };
      
      const result = SelectionRunSchema.safeParse(validRun);
      expect(result.success).toBe(true);
    });
    
    it('should reject negative positions', () => {
      const invalidRun = {
        word: 'diamonds',
        position: -1,
        originalOrder: ['clubs', 'spades', 'diamonds', 'hearts']
      };
      
      const result = SelectionRunSchema.safeParse(invalidRun);
      expect(result.success).toBe(false);
    });
  });
  
  describe('WordFrequencySchema', () => {
    it('should validate valid word frequency records', () => {
      const validFrequency = {
        clubs: 25,
        diamonds: 23,
        hearts: 27,
        spades: 25
      };
      
      const result = WordFrequencySchema.safeParse(validFrequency);
      expect(result.success).toBe(true);
    });
    
    it('should reject negative frequencies', () => {
      const invalidFrequency = {
        clubs: -1,
        diamonds: 23,
        hearts: 27,
        spades: 25
      };
      
      const result = WordFrequencySchema.safeParse(invalidFrequency);
      expect(result.success).toBe(false);
    });
  });
  
  describe('PositionBiasSchema', () => {
    it('should validate valid position bias records', () => {
      const validBias = {
        '0': 20,
        '1': 26,
        '2': 30,
        '3': 24
      };
      
      const result = PositionBiasSchema.safeParse(validBias);
      expect(result.success).toBe(true);
    });
    
    it('should reject negative counts', () => {
      const invalidBias = {
        '0': -1,
        '1': 26,
        '2': 30,
        '3': 24
      };
      
      const result = PositionBiasSchema.safeParse(invalidBias);
      expect(result.success).toBe(false);
    });
  });
  
  describe('EvaluationResultSchema', () => {
    it('should validate valid evaluation results', () => {
      const validResult = {
        selectedWords: {
          clubs: 25,
          diamonds: 23,
          hearts: 27,
          spades: 25
        },
        positionBias: {
          '0': 20,
          '1': 26,
          '2': 30,
          '3': 24
        },
        totalRuns: 100,
        rawSelections: [
          {
            word: 'diamonds',
            position: 2,
            originalOrder: ['clubs', 'spades', 'diamonds', 'hearts']
          }
        ]
      };
      
      const result = EvaluationResultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
    });
    
    it('should reject zero or negative run counts', () => {
      const invalidResult = {
        selectedWords: {
          clubs: 25,
          diamonds: 23,
          hearts: 27,
          spades: 25
        },
        positionBias: {
          '0': 20,
          '1': 26,
          '2': 30,
          '3': 24
        },
        totalRuns: 0,
        rawSelections: [
          {
            word: 'diamonds',
            position: 2,
            originalOrder: ['clubs', 'spades', 'diamonds', 'hearts']
          }
        ]
      };
      
      const result = EvaluationResultSchema.safeParse(invalidResult);
      expect(result.success).toBe(false);
    });
  });
});