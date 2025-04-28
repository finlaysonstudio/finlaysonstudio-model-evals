/**
 * Functions for analyzing word frequency in random word selections
 */

export function calculateWordFrequency(selections: Array<{ word: string }>): Record<string, number> {
  const wordCounts: Record<string, number> = {};
  
  // Count occurrences of each word
  for (const selection of selections) {
    const word = selection.word;
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  }
  
  return wordCounts;
}
