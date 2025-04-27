# Testing with Vitest

## Overview

This project uses Vitest for testing. Vitest is a fast and simple testing framework that is compatible with Vite and provides a similar API to Jest.

## Running Tests

To run all tests across the monorepo:

```bash
npm test
```

To run tests for a specific package:

```bash
npm test -w @finlaysonstudio/eval-models
# or
npm test -w @finlaysonstudio/eval-random-words
```

## Writing Tests

Tests are written using the Vitest API, which is similar to Jest. Each package has a `tests` directory that contains test files with a `.test.ts` extension.

### Example Test Structure

```typescript
import { describe, it, expect } from 'vitest';

describe('Component or function name', () => {
  it('should do something specific', () => {
    // Arrange
    const input = 'some input';
    
    // Act
    const result = someFunction(input);
    
    // Assert
    expect(result).toBe('expected output');
  });
});
```

## Test Configuration

Vitest is configured in the root `vite.config.ts` file with the following settings:

```typescript
test: {
  globals: true,
  environment: 'node',
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/**'],
  },
}
```

## Code Coverage

To run tests with code coverage:

```bash
npm test -- --coverage
```

This will generate coverage reports in the following formats:
- Text summary in the console
- HTML report in the `coverage` directory
- JSON report in the `coverage` directory
