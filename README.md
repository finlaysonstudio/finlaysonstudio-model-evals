# finlaysonstudio-model-evals

A monorepo for evaluating LLM randomness and distributional behavior.

## Status

Currently in early development. Nothing works yet.

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

## Testing

This project follows a co-location testing approach where test files are located next to the files they test:

- Tests are written using Vitest
- Test files use the naming pattern: `*.test.ts`
- Test files are placed in the same directory as the file they test
- Run tests with `npm test`

Generated with 🩶 and the MIT license.