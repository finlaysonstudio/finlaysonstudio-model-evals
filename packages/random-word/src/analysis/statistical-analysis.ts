/**
 * Statistical analysis functions for evaluating randomness
 */
import { EvaluationResult, SelectionRun } from '../types';

/**
 * Calculates the entropy of a distribution
 * Higher entropy indicates more randomness/uniformity
 * 
 * @param distribution Record of counts for each category
 * @param totalCount Total number of observations
 * @returns Entropy value and normalized entropy (0-1 scale)
 */
export function calculateEntropy(
  distribution: Record<string, number>,
  totalCount: number
): { entropy: number; normalizedEntropy: number } {
  const categories = Object.keys(distribution);
  let entropy = 0;
  
  // Calculate Shannon entropy: -sum(p_i * log2(p_i))
  for (const category of categories) {
    const count = distribution[category] || 0;
    if (count === 0) continue; // Skip zero counts
    
    const probability = count / totalCount;
    entropy -= probability * Math.log2(probability);
  }
  
  // Normalize entropy (0 to 1 scale)
  // Maximum entropy for a uniform distribution with n categories is log2(n)
  const maxEntropy = Math.log2(categories.length);
  const normalizedEntropy = entropy / maxEntropy;
  
  return { entropy, normalizedEntropy };
}

/**
 * Calculates the standard deviation of a distribution
 * 
 * @param distribution Record of counts for each category
 * @param totalCount Total number of observations
 * @returns Standard deviation and coefficient of variation
 */
export function calculateStandardDeviation(
  distribution: Record<string, number>,
  totalCount: number
): { mean: number; stdDev: number; coefficientOfVariation: number } {
  const values = Object.values(distribution);
  const n = values.length;
  
  // Calculate mean
  const mean = totalCount / n;
  
  // Calculate sum of squared differences
  let sumSquaredDiff = 0;
  for (const value of values) {
    sumSquaredDiff += Math.pow(value - mean, 2);
  }
  
  // Calculate standard deviation
  const stdDev = Math.sqrt(sumSquaredDiff / n);
  
  // Calculate coefficient of variation (standardized measure of dispersion)
  const coefficientOfVariation = stdDev / mean;
  
  return { mean, stdDev, coefficientOfVariation };
}

/**
 * Performs a runs test to check for sequential independence
 * Tests if the selections show signs of sequential patterns
 * 
 * @param selections Array of selection runs
 * @param attribute The attribute to test ('word' or 'position')
 * @returns Result of runs test analysis
 */
export function runsTest(
  selections: SelectionRun[],
  attribute: 'word' | 'position'
): { 
  numberOfRuns: number; 
  expectedRuns: number;
  zScore: number;
  isRandom: boolean;
  interpretation: string;
} {
  if (selections.length < 10) {
    return {
      numberOfRuns: 0,
      expectedRuns: 0,
      zScore: 0,
      isRandom: false,
      interpretation: "Insufficient data for runs test (need at least 10 observations)"
    };
  }

  // Extract the sequence of values for the specified attribute
  const sequence = selections.map(s => attribute === 'word' ? s.word : s.position);
  
  // Get unique values in the sequence to create categories
  const uniqueValues = Array.from(new Set(sequence));
  if (uniqueValues.length < 2) {
    return {
      numberOfRuns: 1,
      expectedRuns: 1,
      zScore: 0,
      isRandom: false,
      interpretation: "All values are identical, no randomness to test"
    };
  }
  
  // Convert sequence to binary representation
  // We'll use the first unique value as our reference
  const referenceValue = uniqueValues[0];
  const binarySequence = sequence.map(value => value === referenceValue ? 1 : 0);
  
  // Count the occurrences of each category
  const n1 = binarySequence.filter(v => v === 1).length;
  const n2 = binarySequence.filter(v => v === 0).length;
  
  // Count the number of runs
  let runs = 1;
  for (let i = 1; i < binarySequence.length; i++) {
    if (binarySequence[i] !== binarySequence[i - 1]) {
      runs++;
    }
  }
  
  // Calculate expected number of runs and standard deviation
  const expectedRuns = 1 + (2 * n1 * n2) / (n1 + n2);
  const stdDev = Math.sqrt(
    (2 * n1 * n2 * (2 * n1 * n2 - n1 - n2)) / 
    (Math.pow(n1 + n2, 2) * (n1 + n2 - 1))
  );
  
  // Calculate Z-score
  const zScore = (runs - expectedRuns) / stdDev;
  
  // For tests with small sample sizes, we need to be more lenient
  // In real data with large samples, we would use 1.96 for 95% confidence
  const zThreshold = selections.length <= 20 ? 2.5 : 1.96;
  
  // Check randomness
  const isRandom = Math.abs(zScore) < zThreshold;
  
  // Interpretation
  let interpretation;
  if (Math.abs(zScore) < 1.96) {
    interpretation = "Sequence appears random (no significant clustering or alternating patterns)";
  } else if (zScore < -1.96) {
    interpretation = "Sequence shows clustering (too few runs)";
  } else {
    interpretation = "Sequence shows excessive alternating (too many runs)";
  }
  
  return {
    numberOfRuns: runs,
    expectedRuns,
    zScore,
    isRandom,
    interpretation
  };
}

/**
 * Comprehensive analysis of randomness
 * Combines multiple statistical tests to provide a thorough evaluation
 * 
 * @param result Evaluation result containing all selections
 * @returns Comprehensive randomness analysis
 */
export function analyzeRandomness(result: EvaluationResult): {
  wordFrequency: Record<string, number>;
  positionFrequency: Record<number, number>;
  entropy: { 
    words: { entropy: number; normalizedEntropy: number }; 
    positions: { entropy: number; normalizedEntropy: number };
  };
  distribution: {
    words: { mean: number; stdDev: number; coefficientOfVariation: number };
    positions: { mean: number; stdDev: number; coefficientOfVariation: number };
  };
  chiSquare: {
    words: { chiSquare: number; degreesOfFreedom: number; interpretation: string };
    positions: { chiSquare: number; degreesOfFreedom: number; interpretation: string };
  };
  sequentialIndependence: {
    words: { numberOfRuns: number; expectedRuns: number; zScore: number; isRandom: boolean; interpretation: string };
    positions: { numberOfRuns: number; expectedRuns: number; zScore: number; isRandom: boolean; interpretation: string };
  };
  overallAssessment: {
    isUniformDistribution: boolean;
    isSequentiallyIndependent: boolean;
    interpretation: string;
  };
} {
  const totalRuns = result.totalRuns;
  const wordFrequency = result.selectedWords;
  const positionFrequency = result.positionBias;
  
  // Analyze word distribution entropy
  const wordEntropy = calculateEntropy(wordFrequency, totalRuns);
  
  // Analyze position distribution entropy
  const positionEntropy = calculateEntropy(positionFrequency, totalRuns);
  
  // Analyze word distribution standard deviation
  const wordDistribution = calculateStandardDeviation(wordFrequency, totalRuns);
  
  // Analyze position distribution standard deviation
  const positionDistribution = calculateStandardDeviation(positionFrequency, totalRuns);
  
  // Chi-square test for uniform distribution
  const wordChiSquare = calculateChiSquare(wordFrequency, totalRuns);
  const positionChiSquare = calculateChiSquare(positionFrequency, totalRuns);
  
  // Runs test for sequential independence
  const wordRunsTest = runsTest(result.rawSelections, 'word');
  const positionRunsTest = runsTest(result.rawSelections, 'position');
  
  // Overall assessment
  const isUniformDistribution = 
    wordEntropy.normalizedEntropy > 0.95 && 
    positionEntropy.normalizedEntropy > 0.95;
  
  const isSequentiallyIndependent = 
    wordRunsTest.isRandom && 
    positionRunsTest.isRandom;
  
  let interpretation = "";
  if (isUniformDistribution && isSequentiallyIndependent) {
    interpretation = "Distribution appears highly random and unbiased";
  } else if (isUniformDistribution && !isSequentiallyIndependent) {
    interpretation = "Distribution is uniform but shows sequential patterns";
  } else if (!isUniformDistribution && isSequentiallyIndependent) {
    interpretation = "Distribution shows some bias but selections are sequentially independent";
  } else {
    interpretation = "Distribution is biased and shows sequential patterns";
  }
  
  return {
    wordFrequency,
    positionFrequency,
    entropy: {
      words: wordEntropy,
      positions: positionEntropy
    },
    distribution: {
      words: wordDistribution,
      positions: positionDistribution
    },
    chiSquare: {
      words: wordChiSquare,
      positions: positionChiSquare
    },
    sequentialIndependence: {
      words: wordRunsTest,
      positions: positionRunsTest
    },
    overallAssessment: {
      isUniformDistribution,
      isSequentiallyIndependent,
      interpretation
    }
  };
}

/**
 * Calculates chi-square statistic to measure randomness of distribution
 * @param observed Record of observed counts 
 * @param totalObservations Total number of observations
 * @param expectedProbability Expected probability for each category (default: equal distribution)
 * @returns Chi-square statistic and a p-value interpretation
 */
export function calculateChiSquare(
  observed: Record<string, number>,
  totalObservations: number,
  expectedProbability?: Record<string, number>
): { chiSquare: number; degreesOfFreedom: number; interpretation: string } {
  const categories = Object.keys(observed);
  
  // If no expected probabilities provided, assume uniform distribution
  const expectedProbs = expectedProbability || 
    Object.fromEntries(categories.map(cat => [cat, 1 / categories.length]));
  
  let chiSquare = 0;
  
  // Calculate chi-square statistic
  for (const category of categories) {
    const observedCount = observed[category] || 0;
    const expectedCount = totalObservations * (expectedProbs[category] || 1 / categories.length);
    
    chiSquare += Math.pow(observedCount - expectedCount, 2) / expectedCount;
  }
  
  const degreesOfFreedom = categories.length - 1;
  
  // Simple interpretation based on the chi-square value
  let interpretation = "";
  
  // These are very rough thresholds for a quick interpretation
  // In a real application, you would use a proper chi-square distribution table
  if (chiSquare < degreesOfFreedom) {
    interpretation = "Distribution appears random (chi-square < df)";
  } else if (chiSquare < 2 * degreesOfFreedom) {
    interpretation = "Distribution shows mild deviation from randomness";
  } else if (chiSquare < 3 * degreesOfFreedom) {
    interpretation = "Distribution shows moderate deviation from randomness";
  } else {
    interpretation = "Distribution shows strong deviation from randomness";
  }
  
  return {
    chiSquare,
    degreesOfFreedom,
    interpretation
  };
}