# eval-random-words

This package tests a model's ability to select random words, analyzing potential biases in selection.

## Purpose

The package provides tools to:
- Generate prompts asking models to select a random word from a list
- Randomize the order of word options in prompts to control for position bias
- Collect and analyze distribution of word selections
- Track position bias in selection
- Perform statistical analysis of results

## Installation

```bash
npm install @finlaysonstudio/eval-random-words
```

## Basic Usage

```typescript
import { getRandomWordSelection } from '@finlaysonstudio/eval-random-words';
import { ModelClient } from '@finlaysonstudio/eval-models';

// Initialize your model client
const model: ModelClient = /* your model client */;

// Define word options (defaults to ['clubs', 'diamonds', 'hearts', 'spades'])
const options = ['clubs', 'diamonds', 'hearts', 'spades'];

// Get a random word selection
const result = await getRandomWordSelection(model, options);
console.log(result);
// { selectedWord: 'hearts', reason: 'I chose this randomly' }
```

## Running Multiple Evaluations

To run multiple evaluations and analyze the results:

```typescript
import { evaluateRandomWordSelection } from '@finlaysonstudio/eval-random-words';
import { ModelClient } from '@finlaysonstudio/eval-models';

// Initialize your model client
const model: ModelClient = /* your model client */;

// Run 100 evaluations (default)
const results = await evaluateRandomWordSelection(model);

console.log(`Total runs: ${results.totalRuns}`);
console.log(`Word frequencies:`, results.selectedWords);
console.log(`Position bias:`, results.positionBias);
```

## Analysis Functions

The package includes functions for analyzing the results of multiple runs:

```typescript
import { 
  calculateWordFrequency, 
  calculatePositionBias,
  calculateChiSquare
} from '@finlaysonstudio/eval-random-words';

// Sample selection data with position information
const selections = [
  { word: 'hearts', position: 2 },
  { word: 'clubs', position: 0 },
  { word: 'diamonds', position: 1 },
  { word: 'hearts', position: 3 },
  // ...more selections
];

// Analyze word frequency
const wordFrequency = calculateWordFrequency(selections);
// { hearts: 2, clubs: 1, diamonds: 1 }

// Analyze position bias
const positionBias = calculatePositionBias(selections);
// { 0: 1, 1: 1, 2: 1, 3: 1 }

// Statistical analysis of distribution
const stats = calculateChiSquare(wordFrequency, selections.length);
console.log(`Chi-square value: ${stats.chiSquare}`);
console.log(`Interpretation: ${stats.interpretation}`);
```

## Types and Schemas

The package exports several TypeScript types and Zod schemas for structured output validation:

```typescript
// Response from a single word selection
interface RandomWordResponse {
  selectedWord: 'clubs' | 'diamonds' | 'hearts' | 'spades';
  reason?: string;
}

// Information about a single selection run
interface SelectionRun {
  word: string;
  position: number;
  originalOrder: string[];
}

// Aggregated results from multiple evaluation runs
interface EvaluationResult {
  selectedWords: Record<string, number>;
  positionBias: Record<number, number>;
  totalRuns: number;
  rawSelections: SelectionRun[];
}
```

### Zod Schemas

The package provides Zod schemas for structured output validation:

```typescript
import { 
  RandomWordSchema, 
  SelectionRunSchema,
  WordFrequencySchema,
  PositionBiasSchema,
  EvaluationResultSchema 
} from '@finlaysonstudio/eval-random-words';

// RandomWordSchema validates the model's response
const response = { selectedWord: 'hearts', reason: 'This was chosen randomly' };
const result = RandomWordSchema.parse(response);

// All schemas can be used for validation and type inference
type RandomWord = z.infer<typeof RandomWordSchema>;
```

## Advanced Usage

### Custom Word Options and Run Count

You can customize the word options and the number of runs:

```typescript
import { evaluateRandomWordSelection } from '@finlaysonstudio/eval-random-words';

const customOptions = ['apple', 'banana', 'cherry', 'durian'];
const numRuns = 500;

const results = await evaluateRandomWordSelection(model, customOptions, numRuns);
```

### Structured Prompts with Zod

The package includes utilities for creating structured prompts that work well with Vercel AI SDK:

```typescript
import { 
  createStructuredPrompt, 
  formatStructuredPrompt,
  generateRandomWordWithStructuredOutput
} from '@finlaysonstudio/eval-random-words';

// Create a structured prompt with custom options
const prompt = createStructuredPrompt({
  wordOptions: ['red', 'blue', 'green', 'yellow'],
  randomize: true,
  includeInstructions: true
});

// Format the prompt for model consumption
const formattedPrompt = formatStructuredPrompt(prompt);

// Or use the helper function to generate a response directly
const response = await generateRandomWordWithStructuredOutput(model, {
  wordOptions: ['red', 'blue', 'green', 'yellow']
});
```

### Custom Schemas

You can create custom schemas for different word sets:

```typescript
import { createCustomRandomWordSchema } from '@finlaysonstudio/eval-random-words';

// Create a schema for an array of colors
const colors = ['red', 'blue', 'green', 'yellow'];
const ColorSchema = createCustomRandomWordSchema(colors);

// Use the schema with a model client
const response = await model.generateObject(ColorSchema, prompt);
```