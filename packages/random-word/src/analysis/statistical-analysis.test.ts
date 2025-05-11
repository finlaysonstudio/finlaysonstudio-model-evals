import { describe, it, expect } from 'vitest';
import { 
  calculateEntropy, 
  calculateStandardDeviation, 
  runsTest, 
  analyzeRandomness,
  calculateChiSquare
} from './statistical-analysis';
import { EvaluationResult, SelectionRun } from '../types';

describe('Statistical Analysis Functions', () => {
  describe('calculateEntropy', () => {
    it('should return maximum entropy for uniform distribution', () => {
      const distribution = { A: 25, B: 25, C: 25, D: 25 };
      const result = calculateEntropy(distribution, 100);
      
      expect(result.entropy).toBeCloseTo(2.0, 1); // log2(4) = 2
      expect(result.normalizedEntropy).toBeCloseTo(1.0, 1);
    });
    
    it('should return lower entropy for non-uniform distribution', () => {
      const distribution = { A: 40, B: 30, C: 20, D: 10 };
      const result = calculateEntropy(distribution, 100);
      
      expect(result.entropy).toBeLessThan(2.0);
      expect(result.normalizedEntropy).toBeLessThan(1.0);
    });
    
    it('should return zero entropy for single-value distribution', () => {
      const distribution = { A: 100, B: 0, C: 0, D: 0 };
      const result = calculateEntropy(distribution, 100);
      
      expect(result.entropy).toBeCloseTo(0, 1);
      expect(result.normalizedEntropy).toBeCloseTo(0, 1);
    });
  });
  
  describe('calculateStandardDeviation', () => {
    it('should return zero stdDev for uniform distribution', () => {
      const distribution = { A: 25, B: 25, C: 25, D: 25 };
      const result = calculateStandardDeviation(distribution, 100);
      
      expect(result.mean).toBe(25);
      expect(result.stdDev).toBeCloseTo(0, 1);
      expect(result.coefficientOfVariation).toBeCloseTo(0, 1);
    });
    
    it('should calculate correct stdDev for non-uniform distribution', () => {
      const distribution = { A: 40, B: 30, C: 20, D: 10 };
      const result = calculateStandardDeviation(distribution, 100);
      
      expect(result.mean).toBe(25);
      expect(result.stdDev).toBeCloseTo(11.18, 1);
      expect(result.coefficientOfVariation).toBeCloseTo(0.45, 1);
    });
  });
  
  describe('runsTest', () => {
    it('should identify clustered sequence correctly', () => {
      // Create a sequence with too few runs (clustered)
      const selections: SelectionRun[] = generateSelections([
        'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A',
        'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B'
      ]);
      
      const result = runsTest(selections, 'word');
      
      expect(result.isRandom).toBe(false);
      expect(result.zScore).toBeLessThan(-1.96);
      expect(result.interpretation).toContain("clustering");
    });
    
    it('should identify alternating sequence correctly', () => {
      // Create a sequence with too many runs (alternating)
      const selections: SelectionRun[] = generateSelections([
        'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B',
        'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B'
      ]);
      
      const result = runsTest(selections, 'word');
      
      expect(result.isRandom).toBe(false);
      expect(result.zScore).toBeGreaterThan(1.96);
      expect(result.interpretation).toContain("alternating");
    });
    
    it('should handle insufficient data gracefully', () => {
      const selections: SelectionRun[] = generateSelections(['A', 'B', 'A']);
      
      const result = runsTest(selections, 'word');
      
      expect(result.interpretation).toContain("Insufficient data");
    });
  });
  
  describe('calculateChiSquare', () => {
    it('should return low chi-square for uniform distribution', () => {
      const observed = { A: 24, B: 26, C: 25, D: 25 };
      const result = calculateChiSquare(observed, 100);
      
      expect(result.chiSquare).toBeLessThan(result.degreesOfFreedom);
      expect(result.interpretation).toContain("appears random");
    });
    
    it('should return high chi-square for non-uniform distribution', () => {
      const observed = { A: 40, B: 30, C: 20, D: 10 };
      const result = calculateChiSquare(observed, 100);
      
      expect(result.chiSquare).toBeGreaterThan(result.degreesOfFreedom * 3);
      expect(result.interpretation).toContain("strong deviation");
    });
  });
  
  describe('analyzeRandomness', () => {
    it('should perform comprehensive analysis for random distribution', () => {
      // Generate mock data that mimics a random distribution
      const wordCounts = { clubs: 26, diamonds: 25, hearts: 24, spades: 25 };
      const positionCounts = { '0': 26, '1': 24, '2': 25, '3': 25 };
      
      // Create balanced sequence of selections
      const selections: SelectionRun[] = [];
      for (let i = 0; i < 100; i++) {
        const wordIndex = i % 4;
        const word = ['clubs', 'diamonds', 'hearts', 'spades'][wordIndex];
        const position = i % 4;
        selections.push({
          word,
          position,
          originalOrder: ['clubs', 'diamonds', 'hearts', 'spades']
        });
      }
      
      // Shuffle to create more randomness
      shuffleArray(selections);
      
      const result: EvaluationResult = {
        selectedWords: wordCounts,
        positionBias: positionCounts,
        totalRuns: 100,
        rawSelections: selections
      };
      
      const analysis = analyzeRandomness(result);
      
      expect(analysis.entropy.words.normalizedEntropy).toBeGreaterThan(0.95);
      expect(analysis.entropy.positions.normalizedEntropy).toBeGreaterThan(0.95);
      expect(analysis.distribution.words.coefficientOfVariation).toBeLessThan(0.1);
      expect(analysis.distribution.positions.coefficientOfVariation).toBeLessThan(0.1);
      expect(analysis.overallAssessment.isUniformDistribution).toBe(true);
    });
    
    it('should identify non-random distribution correctly', () => {
      // Generate mock data that mimics a biased distribution
      const wordCounts = { clubs: 40, diamonds: 30, hearts: 20, spades: 10 };
      const positionCounts = { '0': 40, '1': 30, '2': 20, '3': 10 };
      
      // Create biased sequence
      const selections: SelectionRun[] = [];
      for (let i = 0; i < 40; i++) selections.push(createSelectionRun('clubs', 0));
      for (let i = 0; i < 30; i++) selections.push(createSelectionRun('diamonds', 1));
      for (let i = 0; i < 20; i++) selections.push(createSelectionRun('hearts', 2));
      for (let i = 0; i < 10; i++) selections.push(createSelectionRun('spades', 3));
      
      const result: EvaluationResult = {
        selectedWords: wordCounts,
        positionBias: positionCounts,
        totalRuns: 100,
        rawSelections: selections
      };
      
      const analysis = analyzeRandomness(result);
      
      expect(analysis.entropy.words.normalizedEntropy).toBeLessThan(0.95);
      expect(analysis.overallAssessment.isUniformDistribution).toBe(false);
      expect(analysis.overallAssessment.interpretation).toContain("biased");
    });
  });
});

// Helper functions for tests

function generateSelections(sequence: string[]): SelectionRun[] {
  return sequence.map((word, index) => ({
    word,
    position: index % 4,
    originalOrder: ['A', 'B', 'C', 'D']
  }));
}

function createSelectionRun(word: string, position: number): SelectionRun {
  return {
    word,
    position,
    originalOrder: ['clubs', 'diamonds', 'hearts', 'spades']
  };
}

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}