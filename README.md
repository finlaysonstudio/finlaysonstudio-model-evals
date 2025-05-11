# finlaysonstudio-model-evals

A monorepo for evaluating LLM randomness and distributional behavior.

## Status

The project is in active development with a working framework for model evaluations.

## Purpose

This project aims to quantify biases in large language models through structured evaluations, particularly focusing on:

- Random word selection bias
- Position bias in choices
- Statistical analysis of model behaviors

## Design

TypeScript/Node.js monorepo using:
- Vercel AI SDK for model interactions
- MongoDB for persistence
- Vitest for testing

## Packages

The project is organized as a monorepo with the following packages:

### `@finlaysonstudio/eval-models`

Model interfaces and data persistence for LLM evaluations.

- Abstract model client interface with adapters for multiple LLM providers (OpenAI, Anthropic)
- MongoDB integration for storing evaluation runs, model responses, and analysis results
- Tracking service for logging model interactions
- Implements model provider abstraction using Vercel AI SDK

### `@finlaysonstudio/eval-random-words`

Tests a model's ability to select random words, analyzing potential biases in selection.

- Generates prompts asking models to select a random word from a list
- Randomizes the order of word options to control for position bias
- Collects and analyzes distribution of word selections
- Implements position bias detection and statistical analysis
- Provides comprehensive statistical tests (chi-square, entropy, runs test)

### `@finlaysonstudio/eval-models-cli`

Command-line interface for running model evaluations.

- Simple CLI for executing evaluations without writing code
- Supports random word selection evaluations via the `words` command
- Configurable parameters for evaluation count, word list, and output format
- Multiple output formats: table, JSON, CSV, and compact
- Optional database integration for storing evaluation results

## Tracking Results

The project includes a comprehensive system for tracking and analyzing evaluation results:

### Database Integration

```typescript
// Connect to MongoDB
await connectToDatabase({
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/model-evals',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
});
```

### Enabling Tracking in Evaluations

Enable tracking by adding a `tracking` option to your evaluation:

```typescript
const evalOptions = {
  options: ['clubs', 'diamonds', 'hearts', 'spades'],
  numRuns: 100,
  tracking: {
    enabled: true,
    name: 'Card Suit Random Selection Test',
    description: 'Evaluating model\'s ability to select random card suits',
    modelProvider: 'openai',
    modelName: 'gpt-4-turbo'
  }
};

// Run evaluation with tracking
const result = await evaluateRandomWordSelection(model, evalOptions);
// The results are automatically saved to MongoDB
```

### Retrieving and Analyzing Results

The `EvaluationService` provides methods to retrieve and analyze tracked results:

```typescript
// Create an evaluation service
const evaluationService = new EvaluationService();

// Get all evaluation runs (can filter by model, type, etc.)
const runs = await evaluationService.getEvaluationRuns({
  modelProvider: 'openai',
  type: EvaluationRunType.RANDOM_WORD
});

// Get a specific evaluation run
const run = await evaluationService.getEvaluationRun(evaluationRunId);

// Get model responses for a specific run
const responses = await evaluationService.getModelResponses(evaluationRunId);

// Get analysis results for a specific run
const analysisResults = await evaluationService.getAnalysisResults(
  evaluationRunId,
  AnalysisResultType.FREQUENCY_DISTRIBUTION
);

// Save custom analysis results
await evaluationService.saveAnalysisResult({
  evaluationRunId,
  type: AnalysisResultType.CUSTOM,
  name: 'My Analysis',
  description: 'Custom statistical analysis',
  result: { /* your analysis data */ }
});
```

## Example Usage

### Programmatic API

```typescript
import { createModelClient } from '@finlaysonstudio/eval-models';
import { evaluateRandomWordSelection } from '@finlaysonstudio/eval-random-words';

// Create a model client
const model = createModelClient({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-4-turbo'
});

// Run 100 evaluations to test randomness
const results = await evaluateRandomWordSelection(model, {
  options: ['apple', 'banana', 'cherry', 'durian'],
  numRuns: 100,
  tracking: {
    enabled: true,
    name: 'Random Word Test',
    modelProvider: 'openai',
    modelName: 'gpt-4-turbo'
  }
});

console.log(`Word frequencies:`, results.selectedWords);
console.log(`Position bias:`, results.positionBias);
```

### Command Line Interface

```bash
# Install the CLI
npm install -g @finlaysonstudio/eval-models-cli

# Run a basic evaluation
evals words

# Run with custom parameters
evals words --count 50 --words "apple,banana,cherry,durian" --format json

# Run with tracking enabled
evals words --tracking --model-provider openai --count 100
```

## Testing

This project follows a co-location testing approach where test files are located next to the files they test:

- Tests are written using Vitest
- Test files use the naming pattern: `*.test.ts`
- Test files are placed in the same directory as the file they test
- Run tests with `npm test`

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Build packages: `npm run build`
4. Run tests: `npm test`
5. For MongoDB integration, set the `MONGODB_URI` environment variable or use a local MongoDB instance

Generated with 🩶 and the MIT license.