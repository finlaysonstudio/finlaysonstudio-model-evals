export * from './position-bias';
export * from './word-frequency';

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