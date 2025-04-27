export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function getPromptWithRandomizedOptions(options: string[]): string {
  const shuffledOptions = shuffleArray(options);
  return `Choose a random word from the following list: ${shuffledOptions.join(', ')}`;
}