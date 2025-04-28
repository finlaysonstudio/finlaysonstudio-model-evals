/**
 * Functions for analyzing position bias in random word selections
 */
import { SelectionRun } from '../types';

/**
 * Calculates the raw count of each position selected
 * 
 * @param selections Array of selection runs or objects with position information
 * @returns Record mapping positions to their frequencies
 */
export function calculatePositionBias(selections: Array<{ word: string, position: number }>): Record<number, number> {
  const positionCounts: Record<number, number> = {};
  
  // Count occurrences of each position
  for (const selection of selections) {
    const position = selection.position;
    positionCounts[position] = (positionCounts[position] || 0) + 1;
  }
  
  return positionCounts;
}

/**
 * Detects position bias and calculates bias metrics
 * 
 * @param selections Array of selection runs
 * @param positionCount Total number of positions (defaults to 4)
 * @returns Position bias analysis with metrics
 */
export function detectPositionBias(
  selections: SelectionRun[],
  positionCount: number = 4
): {
  positionFrequency: Record<number, number>;
  biasMetrics: {
    deviation: Record<number, number>;
    maxDeviation: number;
    maxDeviationPosition: number;
    averageDeviation: number;
    biasIndex: number;
  };
  biasAssessment: {
    hasBias: boolean;
    strongestBiasPosition: number | null;
    biasDirection: 'preference' | 'avoidance' | 'none';
    interpretation: string;
  };
} {
  // Calculate raw position counts
  const positionFrequency = calculatePositionBias(selections);
  
  // Ensure all positions have an entry
  for (let i = 0; i < positionCount; i++) {
    if (!(i in positionFrequency)) {
      positionFrequency[i] = 0;
    }
  }
  
  const totalSelections = selections.length;
  const expectedFrequency = totalSelections / positionCount;

  // Calculate deviation from expected frequency for each position
  const deviation: Record<number, number> = {};
  let totalDeviation = 0;
  let maxDeviation = 0;
  let maxDeviationPosition = 0;

  for (let i = 0; i < positionCount; i++) {
    const observed = positionFrequency[i] || 0;
    // Calculate percentage deviation from expected
    deviation[i] = (observed - expectedFrequency) / expectedFrequency;
    totalDeviation += Math.abs(deviation[i]);
    
    if (Math.abs(deviation[i]) > Math.abs(maxDeviation)) {
      maxDeviation = deviation[i];
      maxDeviationPosition = i;
    }
  }

  const averageDeviation = totalDeviation / positionCount;
  
  // Calculate overall bias index (0 = no bias, 1 = maximum bias)
  // Normalized to range from 0 to 1
  const biasIndex = Math.min(1, totalDeviation / (2 * (positionCount - 1)));
  
  // Determine bias threshold (can be adjusted based on statistical significance)
  const biasThreshold = 0.15; // 15% deviation threshold
  const strongBiasThreshold = 0.30; // 30% deviation threshold
  
  // Assess bias
  const hasBias = biasIndex > biasThreshold || Math.abs(maxDeviation) > biasThreshold;
  const biasDirection = maxDeviation > 0 ? 'preference' : 
                        maxDeviation < 0 ? 'avoidance' : 'none';
  
  let interpretation = "";
  
  if (!hasBias) {
    interpretation = "No significant position bias detected.";
  } else if (biasIndex > strongBiasThreshold) {
    interpretation = `Strong position bias detected. Position ${maxDeviationPosition} shows a ${
      biasDirection === 'preference' ? 'preference' : 'avoidance'
    } bias of ${Math.abs(maxDeviation * 100).toFixed(1)}%.`;
  } else {
    interpretation = `Moderate position bias detected. Position ${maxDeviationPosition} shows a ${
      biasDirection === 'preference' ? 'preference' : 'avoidance'
    } bias of ${Math.abs(maxDeviation * 100).toFixed(1)}%.`;
  }
  
  return {
    positionFrequency,
    biasMetrics: {
      deviation,
      maxDeviation,
      maxDeviationPosition,
      averageDeviation,
      biasIndex
    },
    biasAssessment: {
      hasBias,
      strongestBiasPosition: hasBias ? maxDeviationPosition : null,
      biasDirection,
      interpretation
    }
  };
}

/**
 * Checks for position bias in the first or last position
 * Many models show beginning/end effects in selection
 * 
 * @param selections Array of selection runs
 * @param positionCount Total number of positions
 * @returns Analysis of first/last position bias
 */
export function detectEdgePositionBias(
  selections: SelectionRun[],
  positionCount: number = 4
): {
  firstPositionFrequency: number;
  lastPositionFrequency: number;
  firstPositionBias: number;
  lastPositionBias: number;
  hasEdgeBias: boolean;
  interpretation: string;
} {
  const positionFrequency = calculatePositionBias(selections);
  
  const totalSelections = selections.length;
  const expectedFrequency = totalSelections / positionCount;
  
  const firstPosition = 0;
  const lastPosition = positionCount - 1;
  
  const firstPositionFrequency = positionFrequency[firstPosition] || 0;
  const lastPositionFrequency = positionFrequency[lastPosition] || 0;
  
  // Calculate bias as deviation from expected
  const firstPositionBias = (firstPositionFrequency - expectedFrequency) / expectedFrequency;
  const lastPositionBias = (lastPositionFrequency - expectedFrequency) / expectedFrequency;
  
  // Determine if there's a significant edge bias
  const biasThreshold = 0.15;
  const hasFirstPositionBias = Math.abs(firstPositionBias) > biasThreshold;
  const hasLastPositionBias = Math.abs(lastPositionBias) > biasThreshold;
  const hasEdgeBias = hasFirstPositionBias || hasLastPositionBias;
  
  let interpretation = "";
  
  if (!hasEdgeBias) {
    interpretation = "No significant edge position bias detected.";
  } else if (hasFirstPositionBias && hasLastPositionBias) {
    interpretation = `Edge position bias detected. ${
      firstPositionBias > 0 ? 'Preference' : 'Avoidance'
    } for first position (${(firstPositionBias * 100).toFixed(1)}%) and ${
      lastPositionBias > 0 ? 'preference' : 'avoidance'
    } for last position (${(lastPositionBias * 100).toFixed(1)}%).`;
  } else if (hasFirstPositionBias) {
    interpretation = `First position bias detected: ${
      firstPositionBias > 0 ? 'preference' : 'avoidance'
    } bias of ${Math.abs(firstPositionBias * 100).toFixed(1)}%.`;
  } else {
    interpretation = `Last position bias detected: ${
      lastPositionBias > 0 ? 'preference' : 'avoidance'
    } bias of ${Math.abs(lastPositionBias * 100).toFixed(1)}%.`;
  }
  
  return {
    firstPositionFrequency,
    lastPositionFrequency,
    firstPositionBias,
    lastPositionBias,
    hasEdgeBias,
    interpretation
  };
}

/**
 * Correlates word and position bias to detect if
 * specific words have position preferences
 * 
 * @param selections Array of selection runs
 * @returns Word-position correlation analysis
 */
export function detectWordPositionCorrelation(
  selections: SelectionRun[]
): {
  correlationMatrix: Record<string, Record<number, number>>;
  significantCorrelations: Array<{word: string, position: number, frequency: number, expected: number, deviation: number}>;
  hasSignificantCorrelation: boolean;
  interpretation: string;
} {
  const words = new Set<string>();
  const positions = new Set<number>();
  
  // Extract unique words and positions
  for (const selection of selections) {
    words.add(selection.word);
    positions.add(selection.position);
  }
  
  // Create correlation matrix to track word-position pairings
  const correlationMatrix: Record<string, Record<number, number>> = {};
  
  // Initialize matrix
  for (const word of words) {
    correlationMatrix[word] = {};
    for (const position of positions) {
      correlationMatrix[word][position] = 0;
    }
  }
  
  // Fill correlation matrix with frequencies
  for (const selection of selections) {
    correlationMatrix[selection.word][selection.position]++;
  }
  
  // Calculate word frequencies
  const wordFrequencies: Record<string, number> = {};
  for (const word of words) {
    wordFrequencies[word] = selections.filter(s => s.word === word).length;
  }
  
  // Calculate position frequencies
  const positionFrequencies: Record<number, number> = {};
  for (const position of positions) {
    positionFrequencies[position] = selections.filter(s => s.position === position).length;
  }
  
  const totalSelections = selections.length;
  
  // Identify significant correlations
  const significantCorrelations: Array<{
    word: string;
    position: number;
    frequency: number;
    expected: number;
    deviation: number;
  }> = [];
  
  for (const word of words) {
    for (const position of positions) {
      const frequency = correlationMatrix[word][position];
      // Expected frequency assuming independence
      const expected = (wordFrequencies[word] * positionFrequencies[position]) / totalSelections;
      const deviation = (frequency - expected) / expected;
      
      // Check if deviation is significant (>30% from expected)
      if (Math.abs(deviation) > 0.3) {
        significantCorrelations.push({
          word: word.toString(),
          position: Number(position),
          frequency,
          expected,
          deviation
        });
      }
    }
  }
  
  // Sort by deviation magnitude (descending)
  significantCorrelations.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));
  
  const hasSignificantCorrelation = significantCorrelations.length > 0;
  
  // Generate interpretation
  let interpretation = "";
  
  if (!hasSignificantCorrelation) {
    interpretation = "No significant word-position correlations detected.";
  } else if (significantCorrelations.length === 1) {
    const corr = significantCorrelations[0];
    interpretation = `Word-position correlation detected: '${corr.word}' ${
      corr.deviation > 0 ? 'appears more frequently' : 'appears less frequently'
    } at position ${corr.position} than expected (deviation: ${(corr.deviation * 100).toFixed(1)}%).`;
  } else {
    interpretation = `Multiple word-position correlations detected. Most significant: '${
      significantCorrelations[0].word
    }' at position ${significantCorrelations[0].position} (deviation: ${
      (significantCorrelations[0].deviation * 100).toFixed(1)
    }%).`;
  }
  
  return {
    correlationMatrix,
    significantCorrelations,
    hasSignificantCorrelation,
    interpretation
  };
}
