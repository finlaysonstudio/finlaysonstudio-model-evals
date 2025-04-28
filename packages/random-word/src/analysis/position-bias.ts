/**
 * Functions for analyzing position bias in random word selections
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
