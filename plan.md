# Project Plan: finlaysonstudio-model-evals

## Overview
A TypeScript project set up as an NPM monorepo with Vite and Vitest for testing, using Vercel's AI SDK for model interactions.

## Project Structure
- Root package name: `finlaysonstudio-model-evals`
- Monorepo structure using NPM workspaces
- Build tooling: Vite
- Testing framework: Vitest
- Database: MongoDB with Mongoose
- AI Integration: Vercel AI SDK

## Packages
### eval-random-words (packages/random-word)
This package will test a model's ability to select random words.

#### Implementation Details
- Ask the model to pick a random word from [clubs, diamonds, hearts, spades] n times (n = 100)
- Randomize the order of the words for each prompt
- Track:
  - Frequency of each word chosen
  - Frequency of each index position chosen (to detect position bias)
- Use Vercel AI SDK's structured output for consistent response formatting:
  ```typescript
  import { streamText } from 'ai';
  import { z } from 'zod';
  
  // Define the output schema for random word selection
  const RandomWordSchema = z.object({
    selectedWord: z.enum(['clubs', 'diamonds', 'hearts', 'spades']),
    reason: z.string().optional(),
  });
  
  // Example function to get structured output
  async function getRandomWordSelection(model, words) {
    const response = await model.generateObject({
      schema: RandomWordSchema,
      prompt: `Choose a random word from the following list: ${words.join(', ')}`,
    });
    return response;
  }
  ```

#### Expected Outputs
- Statistical analysis of word selection distribution
- Analysis of position bias in selection
- Visualization of results

### eval-models (packages/models)
This package will handle model interfaces and data persistence.

#### Implementation Details
- Create abstraction layers for different AI model APIs using Vercel AI SDK
- Handle data storage and retrieval using MongoDB and Mongoose
- Define schemas for:
  - Evaluation runs
  - Model responses
  - Analysis results
- Provide standardized interfaces for data access
- Sample AI SDK integration:
  ```typescript
  import { OpenAI, Anthropic, VertexAI } from 'ai';
  
  // Initialize model providers
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  
  // Model factory example
  function getModelClient(provider: 'openai' | 'anthropic' | 'vertex') {
    switch (provider) {
      case 'openai':
        return openai;
      case 'anthropic':
        return anthropic;
      // Add more providers as needed
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
  ```

## Tasks
**Note: Each implementation task should include appropriate unit tests using Vitest**

### Queued
- Configure Vite for build process
- Add Vitest for testing framework
- Install Vercel AI SDK and its dependencies (zod)
- Create MongoDB connection configuration with tests
- Create packages/models directory structure
- Initialize eval-models package
- Define Mongoose schemas for data persistence with validation tests
- Implement model API interfaces using Vercel AI SDK with mocked API tests
- Create packages/random-word directory structure
- Initialize eval-random-words package
- Set up structured output schemas with Zod for consistent response formatting
- Implement prompt generation with randomized word order + tests
- Implement tracking and data collection for responses + tests
- Add statistical analysis functions with accuracy tests
- Implement position bias detection with validation tests
- Create visualization component for results with rendering tests
- Set up MongoDB integration for storing evaluation results with integration tests
- Implement model provider abstraction using Vercel AI SDK
- Create documentation and usage examples with AI SDK integration samples

### Dequeued

### Verified
- Initialize root monorepo with package.json and npm workspace configuration
- Set up TypeScript configuration for the project