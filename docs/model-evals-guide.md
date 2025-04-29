# finlaysonstudio-model-evals - AI SDK Integration Guide

## Overview

This guide provides comprehensive documentation and examples for using the finlaysonstudio-model-evals packages to evaluate LLM randomness and distributional behavior. The project utilizes Vercel's AI SDK for model interactions and offers tools for testing, tracking, and analyzing model behavior.

## Getting Started

### Installation

```bash
# Install the packages
npm install @finlaysonstudio/eval-models @finlaysonstudio/eval-random-words

# Or install in a specific workspace
npm install -w your-workspace-name @finlaysonstudio/eval-models @finlaysonstudio/eval-random-words
```

### Environment Setup

Create a `.env` file with your API keys:

```
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
MONGODB_URI=your_mongodb_connection_string
```

## Core Packages

The project consists of two main packages:

1. **eval-models**: Handles model interfaces and data persistence
2. **eval-random-words**: Tests a model's ability to select random words

## Using eval-models

The eval-models package provides abstractions for different AI model providers and handles data persistence.

### Model Client Setup

```typescript
import { createModelClient, ModelConfig } from '@finlaysonstudio/eval-models';

// Configure the model client
const modelConfig: ModelConfig = {
  provider: 'openai', // or 'anthropic'
  apiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-4o', // or any supported model
};

// Create the model client
const modelClient = createModelClient(modelConfig);
```

### Database Connection

```typescript
import { connectToDatabase, disconnectFromDatabase } from '@finlaysonstudio/eval-models';

// Connect to MongoDB
await connectToDatabase({
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  dbName: 'model-evals',
});

// Don't forget to disconnect when done
await disconnectFromDatabase();
```

### Storing Evaluation Results

```typescript
import { 
  EvaluationService, 
  EvaluationRunType, 
  EvaluationRunStatus,
  AnalysisResultType 
} from '@finlaysonstudio/eval-models';

// Create evaluation service
const evaluationService = new EvaluationService();

// Create an evaluation run
const evaluationRun = await evaluationService.createEvaluationRun({
  name: 'Random Word Selection Test',
  description: 'Testing random word selection with GPT-4',
  type: EvaluationRunType.RANDOM_WORD,
  modelProvider: 'openai',
  modelName: 'gpt-4',
  config: {
    numPrompts: 100,
    words: ['clubs', 'diamonds', 'hearts', 'spades'],
  },
});

// Update status to running
await evaluationService.updateEvaluationRunStatus(
  evaluationRun._id,
  EvaluationRunStatus.RUNNING
);

// Save a model response
await evaluationService.saveModelResponse({
  evaluationRunId: evaluationRun._id,
  promptIndex: 0,
  prompt: 'Choose a random word from: clubs, diamonds, hearts, spades',
  rawResponse: '{"selectedWord": "hearts"}',
  parsedResponse: { selectedWord: 'hearts' },
  responseTime: 120, // ms
  metadata: {
    wordOrder: ['clubs', 'diamonds', 'hearts', 'spades'],
    selectedPosition: 2,
  },
});

// Save analysis results
await evaluationService.saveAnalysisResult({
  evaluationRunId: evaluationRun._id,
  type: AnalysisResultType.FREQUENCY_DISTRIBUTION,
  name: 'Word Frequency',
  description: 'Distribution of selected words',
  result: {
    clubs: 25,
    diamonds: 28,
    hearts: 23,
    spades: 24,
  },
  metadata: {
    totalResponses: 100,
  },
});
```

## Using eval-random-words

The eval-random-words package provides tools for testing a model's ability to select random words.

### Basic Random Word Evaluation

```typescript
import { evaluateRandomWordSelection } from '@finlaysonstudio/eval-random-words';
import { createModelClient } from '@finlaysonstudio/eval-models';

// Create a model client
const modelClient = createModelClient({
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY,
  modelName: 'claude-3-sonnet-20240229',
});

// Run a basic evaluation
const result = await evaluateRandomWordSelection(modelClient, {
  options: ['clubs', 'diamonds', 'hearts', 'spades'],
  numRuns: 100,
  promptStyle: 'structured', // or 'simple'
});

console.log('Word Selection Frequencies:');
Object.entries(result.selectedWords).forEach(([word, count]) => {
  console.log(`${word}: ${count} (${(count / result.totalRuns * 100).toFixed(1)}%)`);
});

console.log('Position Bias:');
Object.entries(result.positionBias).forEach(([position, count]) => {
  console.log(`Position ${position}: ${count} (${(count / result.totalRuns * 100).toFixed(1)}%)`);
});
```

### Tracked Evaluation with Database Storage

```typescript
import { evaluateRandomWordSelection } from '@finlaysonstudio/eval-random-words';
import { connectToDatabase, createModelClient } from '@finlaysonstudio/eval-models';

// Connect to the database first
await connectToDatabase({
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/model-evals',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
});

// Create a model client
const modelClient = createModelClient({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-4',
});

// Run evaluation with tracking enabled
const result = await evaluateRandomWordSelection(modelClient, {
  options: ['clubs', 'diamonds', 'hearts', 'spades'],
  numRuns: 100,
  promptStyle: 'structured',
  tracking: {
    enabled: true,
    name: 'Card Suit Random Selection - GPT-4',
    description: 'Evaluating GPT-4\'s ability to select random card suits',
    modelProvider: 'openai',
    modelName: 'gpt-4',
  }
});

// Results are automatically stored in the database
console.log(`Evaluation completed and stored with ID: ${result.evaluationRunId}`);
```

### Statistical Analysis

```typescript
import { analyzeRandomness } from '@finlaysonstudio/eval-random-words';

// Analyze the results for randomness
const analysis = analyzeRandomness(result);

// Check overall assessment
console.log(`Random Distribution: ${analysis.overallAssessment.isUniformDistribution ? 'Yes' : 'No'}`);
console.log(`Sequential Independence: ${analysis.overallAssessment.isSequentiallyIndependent ? 'Yes' : 'No'}`);
console.log(`Interpretation: ${analysis.overallAssessment.interpretation}`);

// Check for position bias
console.log(`Position Bias: ${analysis.chiSquare.positions.interpretation}`);
```

### Position Bias Detection

```typescript
import { 
  detectPositionBias, 
  detectEdgePositionBias, 
  detectWordPositionCorrelation 
} from '@finlaysonstudio/eval-random-words';

// Perform detailed position bias analysis
const positionBiasAnalysis = detectPositionBias(result.rawSelections);
console.log(`Bias Index: ${positionBiasAnalysis.biasMetrics.biasIndex.toFixed(3)}`);
console.log(`Assessment: ${positionBiasAnalysis.biasAssessment.interpretation}`);

// Analyze edge position effects (first/last position bias)
const edgeBiasAnalysis = detectEdgePositionBias(result.rawSelections);
console.log(`First Position Bias: ${(edgeBiasAnalysis.firstPositionBias * 100).toFixed(1)}%`);
console.log(`Last Position Bias: ${(edgeBiasAnalysis.lastPositionBias * 100).toFixed(1)}%`);

// Analyze word-position correlations
const correlationAnalysis = detectWordPositionCorrelation(result.rawSelections);
if (correlationAnalysis.hasSignificantCorrelation) {
  console.log('Significant correlations detected:');
  correlationAnalysis.significantCorrelations.forEach(corr => {
    console.log(`'${corr.word}' at position ${corr.position}: ${(corr.deviation * 100).toFixed(1)}% deviation`);
  });
}
```

## AI SDK Integration Details

This project uses Vercel's AI SDK for structured outputs. Here's how it works:

### Structured Output Schemas

```typescript
import { z } from 'zod';

// Define the output schema for random word selection
const RandomWordSchema = z.object({
  selectedWord: z.enum(['clubs', 'diamonds', 'hearts', 'spades']),
  reason: z.string().optional(),
});

// Type inference
type RandomWordResult = z.infer<typeof RandomWordSchema>;
```

### Making AI Model Calls

```typescript
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { RandomWordSchema } from './schemas';

// Using OpenAI
async function generateWithOpenAI(words) {
  const { object } = await generateObject({
    model: openai('gpt-4o-2024-04-09', { structuredOutputs: true }),
    prompt: `Choose a random word from the following list: ${words.join(', ')}`,
    schema: RandomWordSchema,
  });
  
  return object;
}

// Using Anthropic
async function generateWithAnthropic(words) {
  const { object } = await generateObject({
    model: anthropic('claude-3-sonnet-20240229'),
    prompt: `Choose a random word from the following list: ${words.join(', ')}`,
    schema: RandomWordSchema,
    mode: 'json', // Required for Anthropic
  });
  
  return object;
}
```

### Using Custom API Keys

```typescript
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { RandomWordSchema } from './schemas';

export async function generateRandomWord(words, provider, apiKey) {
  if (provider === 'openai') {
    const customOpenAI = createOpenAI({ apiKey });
    const { object } = await generateObject({
      model: customOpenAI('gpt-4o', { structuredOutputs: true }),
      prompt: `Choose a random word from the following list: ${words.join(', ')}`,
      schema: RandomWordSchema,
    });
    return object;
  } else if (provider === 'anthropic') {
    const customAnthropic = createAnthropic({ apiKey });
    const { object } = await generateObject({
      model: customAnthropic('claude-3-sonnet-20240229'),
      prompt: `Choose a random word from the following list: ${words.join(', ')}`,
      schema: RandomWordSchema,
      mode: 'json',
    });
    return object;
  }
  throw new Error(`Unsupported provider: ${provider}`);
}
```

## Best Practices

1. **Error Handling**: Always wrap your model calls in try-catch blocks to handle API errors gracefully
2. **Environment Variables**: Store API keys in environment variables
3. **Randomize Word Order**: Always randomize the word order to minimize position bias
4. **Sample Size**: Use at least 100 runs for statistically significant results
5. **Database Connection**: Use the connection utilities to manage database connections properly
6. **Testing**: Write tests for your evaluation logic to ensure correctness

## Troubleshooting

### Common Issues

1. **API Key Errors**: Ensure your API keys are correctly set in environment variables
2. **MongoDB Connection Failures**: Check your MongoDB connection string and network access
3. **Response Parsing Errors**: Verify that your schema matches what the model can return
4. **Rate Limiting**: Implement exponential backoff for retries on rate limit errors

### Debugging

```typescript
// Enable debug logging
process.env.DEBUG = 'eval-models:*,eval-random-words:*';

// Create evaluation service with debugging
const evaluationService = new EvaluationService({ debug: true });
```

## Resources

- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [MongoDB Documentation](https://www.mongodb.com/docs/)
- [Zod Documentation](https://zod.dev/)
- [Statistical Analysis Methods](https://en.wikipedia.org/wiki/Statistical_hypothesis_testing)