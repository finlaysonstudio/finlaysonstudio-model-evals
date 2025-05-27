import { Command } from 'commander';
import { debug } from '../utils/debug.js';
import {
  connectToDatabase,
  disconnectFromDatabase,
  createModelClient,
  ModelConfig
} from '@finlaysonstudio/eval-models';
import {
  evaluateRandomWordSelection,
  EvaluationOptions,
  PromptStyle
} from '@finlaysonstudio/eval-random-words';
import { formatOutput, OutputFormat } from '../utils/formatting.js';

interface WordsOptions {
  count?: number;
  words?: string;
  promptStyle?: string;
  tracking?: boolean;
  format?: OutputFormat;
  modelProvider?: string;
  modelName?: string;
  apiKey?: string;
  quiet?: boolean;
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
    .option('-p, --prompt-style <style>', 'prompt style to use (simple, structured, detailed)', validatePromptStyle)
    .option('-t, --tracking', 'enable tracking in database', false)
    .option('-f, --format <format>', 'output format (table, json, csv, compact)', validateOutputFormat, 'table')
    .option('-q, --quiet', 'reduce verbosity of output', false)
    .option('--model-provider <provider>', 'model provider (openai, anthropic)', 'anthropic')
    .option('--model-name <name>', 'model name to use')
    .option('--api-key <key>', 'API key for the model provider (defaults to env var based on provider)')
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
    const words = options.words?.split(',') || ['clubs', 'diamonds', 'hearts', 'spades'];
    const promptStyle = options.promptStyle as PromptStyle || 'simple';
    const tracking = options.tracking || false;
    const format = options.format || 'table';
    const modelProvider = options.modelProvider || 'anthropic';
    const quiet = options.quiet || false;

    debug(`Evaluation count: ${count}`);
    debug(`Using words: ${words.join(', ')}`);
    debug(`Prompt style: ${promptStyle}`);
    debug(`Tracking enabled: ${tracking}`);
    debug(`Output format: ${format}`);
    debug(`Quiet mode: ${quiet}`);
    debug(`Model provider: ${modelProvider}`);

    // Get API key from options or environment variables
    let apiKey = options.apiKey || '';
    if (!apiKey) {
      if (modelProvider === 'openai') {
        apiKey = process.env.OPENAI_API_KEY || '';
      } else if (modelProvider === 'anthropic') {
        apiKey = process.env.ANTHROPIC_API_KEY || '';
      }
    }

    if (!apiKey) {
      console.error(`No API key provided for ${modelProvider}. Please provide an API key using --api-key or set the appropriate environment variable.`);
      process.exit(1); // Exit with error code
    }

    // Connect to database if tracking is enabled
    if (tracking) {
      console.log('Connecting to database for tracking...');
      try {
        await connectToDatabase({
          uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/model-evals',
          dbName: 'model-evals'
        });
        console.log('Connected to database.');
      } catch (error) {
        console.error('Failed to connect to database. Make sure MongoDB is running and MONGODB_URI is set correctly.', error);
        process.exit(2); // Exit with database error code
      }
    }

    // Create model client configuration
    const modelConfig: ModelConfig = {
      provider: modelProvider as 'openai' | 'anthropic',
      apiKey,
      modelName: options.modelName,
    };

    console.log(`Creating ${modelProvider} client...`);
    const modelClient = createModelClient(modelConfig);

    // Configure evaluation options
    const evalOptions: EvaluationOptions = {
      options: words,
      numRuns: count,
      promptStyle: promptStyle,
    };

    // Add tracking configuration if enabled
    if (tracking) {
      evalOptions.tracking = {
        enabled: true,
        name: `Word Selection Evaluation - ${new Date().toISOString()}`,
        description: `CLI-triggered evaluation using words: ${words.join(', ')}`,
        modelProvider: modelConfig.provider as 'openai' | 'anthropic',
        modelName: modelConfig.modelName || 'default'
      };
    }

    // Run the evaluation
    if (!quiet) {
      console.log('Starting word evaluation...');
      console.log(`Evaluating ${count} runs with words: [${words.join(', ')}]`);
    }

    const startTime = Date.now();
    const result = await evaluateRandomWordSelection(modelClient, evalOptions);
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    if (!quiet) {
      console.log(`\nEvaluation completed in ${duration.toFixed(2)} seconds.`);
    }

    // Process and display results
    if (!quiet) {
      console.log('\nWord Selection Results:');
    }

    // Format word frequency data
    const wordFrequencyData = Object.entries(result.selectedWords).map(([word, count]) => ({
      Word: word,
      Count: count as number,
      Percentage: `${(((count as number) / result.totalRuns) * 100).toFixed(2)}%`
    }));

    // Format position bias data
    const positionBiasData = Object.entries(result.positionBias).map(([position, count]) => ({
      Position: position,
      Count: count as number,
      Percentage: `${(((count as number) / result.totalRuns) * 100).toFixed(2)}%`
    }));

    // Prepare complete result data
    const resultData = {
      metadata: {
        totalRuns: result.totalRuns,
        words: words,
        duration: `${duration.toFixed(2)} seconds`,
        model: options.modelName || 'default',
        provider: modelProvider
      },
      wordFrequency: result.selectedWords,
      positionBias: result.positionBias,
      // The detailed run data is not available in the EvaluationResult type
  rawDetails: []
    };

    // Display results in selected format
    if (format === 'json') {
      console.log(formatOutput(resultData, 'json'));
    } else if (format === 'csv') {
      console.log('\nWord Frequency:');
      console.log(formatOutput(wordFrequencyData, 'csv'));

      console.log('\nPosition Bias:');
      console.log(formatOutput(positionBiasData, 'csv'));
    } else if (format === 'compact') {
      console.log('\nWord Frequency:');
      console.log(formatOutput(wordFrequencyData, 'compact'));

      console.log('\nPosition Bias:');
      console.log(formatOutput(positionBiasData, 'compact'));
    } else {
      // Default to table format
      console.log('\nWord Frequency:');
      console.log(formatOutput(wordFrequencyData, 'table'));

      console.log('\nPosition Bias:');
      console.log(formatOutput(positionBiasData, 'table'));

      // Show summary stats in non-quiet mode
      if (!quiet) {
        console.log('\nSummary:');
        const summary = [
          { Metric: 'Total Runs', Value: result.totalRuns },
          { Metric: 'Duration', Value: `${duration.toFixed(2)} seconds` },
          { Metric: 'Model', Value: options.modelName || 'default' },
          { Metric: 'Provider', Value: modelProvider }
        ];
        console.log(formatOutput(summary, 'table'));
      }
    }

    // Disconnect from database if we connected
    if (tracking) {
      if (!quiet) {
        console.log('Disconnecting from database...');
      }
      await disconnectFromDatabase();
    }

    if (!quiet) {
      console.log('\nEvaluation complete!');
    }

    // Exit with success code
    process.exit(0);

  } catch (error) {
    console.error('Error executing words evaluation:', error);

    // Try to disconnect from database if there was an error
    try {
      await disconnectFromDatabase();
    } catch (disconnectError) {
      // Ignore disconnect errors during cleanup
    }

    process.exit(3); // Exit with general evaluation error code
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

/**
 * Validate prompt style option
 */
function validatePromptStyle(value: string): string {
  const validStyles = ['simple', 'structured', 'detailed'];
  if (!validStyles.includes(value)) {
    throw new Error(`Invalid prompt style: ${value}. Must be one of: ${validStyles.join(', ')}`);
  }
  return value;
}

/**
 * Validate output format option
 */
function validateOutputFormat(value: string): OutputFormat {
  const validFormats: OutputFormat[] = ['table', 'json', 'csv', 'compact'];
  if (!validFormats.includes(value as OutputFormat)) {
    throw new Error(`Invalid output format: ${value}. Must be one of: ${validFormats.join(', ')}`);
  }
  return value as OutputFormat;
}