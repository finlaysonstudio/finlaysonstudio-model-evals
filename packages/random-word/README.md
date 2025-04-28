# eval-random-words

This package tests a model's ability to select random words, analyzing potential biases in selection.

## Purpose

The package provides tools to:
- Generate prompts asking models to select a random word from a list
- Randomize the order of word options in prompts to control for position bias
- Collect and analyze distribution of word selections
- Track position bias in selection

## Usage

```typescript
import { getRandomWordSelection } from '@finlaysonstudio/eval-random-words';
import { ModelClient } from '@finlaysonstudio/eval-models';

// Initialize your model client
const model: ModelClient = /* your model client */;

// Define word options
const options = ['clubs', 'diamonds', 'hearts', 'spades'];

// Get a random word selection
const result = await getRandomWordSelection(model, options);
console.log(result);
// { selectedWord: 'hearts', reason: 'I chose this randomly' }
```

## Analysis Functions

The package includes functions for analyzing the results of multiple runs:

```typescript
import { 
  calculateWordFrequency, 
  calculatePositionBias 
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
```