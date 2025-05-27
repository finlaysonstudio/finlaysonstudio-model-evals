# finlaysonstudio-model-evals

A TypeScript monorepo for evaluating large language model randomness and distributional behavior through structured bias analysis.

## ✈️ Overview

This project quantifies biases in large language models through comprehensive evaluations.
The framework provides programmatic APIs and a command-line interface for analyzing model behaviors across multiple dimensions.

Primary evaluation targets include random word selection bias, position bias in choices, and statistical analysis of model response patterns.

## 💿 Installation

```bash
# Clone the repository
git clone https://github.com/finlaysonstudio/finlaysonstudio-model-evals.git
cd finlaysonstudio-model-evals

# Install dependencies
npm install

# Build all packages
npm run build
```

For CLI-only usage:

```bash
npm install -g @finlaysonstudio/eval-models-cli
```

## 📋 Usage

### Command Line Interface

```bash
# Run basic word randomness evaluation
evals words

# Customize evaluation parameters
evals words --count 50 --words "apple,banana,cherry,durian"

# Enable detailed output formatting
evals words --count 100 --format json

# Run with debug output
evals words --debug
```

### Programmatic API

```typescript
import { createModelClient } from '@finlaysonstudio/eval-models';
import { evaluateRandomWordSelection } from '@finlaysonstudio/eval-random-words';

const model = createModelClient({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-4-turbo'
});

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

## 📖 Reference

### Architecture

TypeScript/Node.js monorepo structure:
- Vercel AI SDK for model interactions
- MongoDB for persistence and analysis tracking
- Vitest for comprehensive testing
- Commander.js for CLI implementation

### Packages

#### `@finlaysonstudio/eval-models`

Model interfaces and data persistence infrastructure.

- Abstract model client interface with adapters for OpenAI and Anthropic
- MongoDB integration for evaluation runs, responses, and analysis results
- Response tracking service for comprehensive logging
- Model provider abstraction via Vercel AI SDK

#### `@finlaysonstudio/eval-random-words`

Random word selection bias evaluation framework.

- Prompt generation for random word selection tasks
- Position bias control through option randomization
- Distribution analysis with statistical significance testing
- Comprehensive statistical tests including chi-square, entropy, and runs tests

#### `@finlaysonstudio/eval-models-cli`

Command-line interface for evaluation execution.

- Simple CLI execution without programming requirements
- `words` command for random word selection evaluations
- Configurable parameters: count, word lists, output formats
- Multiple output formats: table, JSON, CSV, compact
- Optional database integration for result persistence

### Database Integration and Tracking

Enable comprehensive evaluation tracking with MongoDB integration:

```typescript
import { connectToDatabase } from '@finlaysonstudio/eval-models';

await connectToDatabase({
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/model-evals'
});

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

const result = await evaluateRandomWordSelection(model, evalOptions);
```

### Analysis and Retrieval

```typescript
import { EvaluationService } from '@finlaysonstudio/eval-models';

const evaluationService = new EvaluationService();

// Retrieve evaluation runs with filtering
const runs = await evaluationService.getEvaluationRuns({
  modelProvider: 'openai',
  type: EvaluationRunType.RANDOM_WORD
});

// Access detailed results and analysis
const responses = await evaluationService.getModelResponses(evaluationRunId);
const analysisResults = await evaluationService.getAnalysisResults(
  evaluationRunId,
  AnalysisResultType.FREQUENCY_DISTRIBUTION
);
```

## 💻 Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test

# Type checking
npm run typecheck
```

### Testing Strategy

Co-located testing approach with Vitest:
- Test files use `*.test.ts` naming pattern
- Tests located adjacent to source files
- Comprehensive unit and integration test coverage

### Environment Setup

Set environment variables for database integration:
```bash
export MONGODB_URI="mongodb://localhost:27017/model-evals"
export OPENAI_API_KEY="your-openai-key"
export ANTHROPIC_API_KEY="your-anthropic-key"
```

## 📜 License

Generated with 🩶 and the MIT license.