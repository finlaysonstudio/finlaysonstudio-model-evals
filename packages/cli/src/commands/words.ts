import { Command } from 'commander';
import { debug } from '../utils/debug.js';

interface WordsOptions {
  count?: number;
  words?: string;
}

/**
 * Registers the words evaluation command
 */
export function wordsCommand(program: Command): void {
  program
    .command('words')
    .description('Run word evaluation tests')
    .option('-c, --count <number>', 'number of evaluation iterations to run', parseIntOption)
    .option('-w, --words <string>', 'comma-separated list of words to use in evaluation')
    .action(executeWordsCommand);
}

/**
 * Executes the words evaluation command
 */
async function executeWordsCommand(options: WordsOptions): Promise<void> {
  try {
    debug('Running words evaluation with options:', options);
    
    // Parse options
    const count = options.count || 10;
    const words = options.words?.split(',') || ['default', 'word', 'list'];
    
    debug(`Evaluation count: ${count}`);
    debug(`Using words: ${words.join(', ')}`);
    
    // TODO: Implement actual evaluation by connecting to evaluation infrastructure
    console.log('Words evaluation results:');
    console.log(`- Count: ${count}`);
    console.log(`- Words: ${words.join(', ')}`);
    console.log('Evaluation not yet implemented. This is a placeholder.');
    
  } catch (error) {
    console.error('Error executing words evaluation:', error);
    process.exit(1);
  }
}

/**
 * Parse string to integer, used for count option
 */
function parseIntOption(value: string): number {
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) {
    throw new Error(`Invalid number: ${value}`);
  }
  return parsedValue;
}