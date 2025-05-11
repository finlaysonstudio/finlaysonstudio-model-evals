# add cli

Create a project plan that full fills the following requirements:

* create a new package, cli
* install commander
* create a new command, `evals`, that takes a second param for the eval, right now only `words`
* Words should allow -c/--count 12 -w/--words "paper,rock,scissors" 
* `evals` should run the eval and print the results
* Include useful debugging along the way
* Always build tests as part of each step, don't save it until the end

---

# Project Plan: Creating a CLI for Model Evaluations

This document outlines the implementation plan for adding a command-line interface (CLI) to the model evaluations project. The CLI will allow users to run evaluations from the command line with customizable parameters.

## Overview

We'll create a new package called `cli` within the project's packages directory. This package will use the Commander.js library to implement a command-line interface for running model evaluations. Initially, we'll support a single evaluation type called "words".

## Prerequisites

- Node.js and npm installed
- Existing model evaluations codebase

## Tasks

1. **Setup CLI Package Structure** - _Dequeued_
   - Create a new package directory at `packages/cli`
   - Initialize package.json with appropriate dependencies
   - Set up TypeScript configuration
   - Install Commander.js for CLI argument parsing
   - Create basic entry point file structure

2. **Implement Basic CLI Framework** - _Queued_
   - Create CLI entry point
   - Set up Commander.js command structure
   - Implement help text and version information
   - Add debugging utilities
   - Write tests for basic CLI functionality

3. **Implement "words" Evaluation Command** - _Queued_
   - Create command handler for "words" evaluation
   - Implement parameter parsing for count and words options
   - Connect to existing evaluation infrastructure
   - Add input validation and error handling
   - Write tests for "words" command functionality

4. **Implement Results Formatting and Output** - _Queued_
   - Create formatters for evaluation results
   - Implement console output formatting
   - Add support for different output formats (JSON, table, etc.)
   - Implement proper exit codes
   - Write tests for output formatting

5. **Add Integration Tests** - _Queued_
   - Create end-to-end tests for CLI
   - Test different parameter combinations
   - Verify correct output formats
   - Test error conditions and handling

6. **Documentation and Finalization** - _Queued_
   - Add README for CLI package
   - Document available commands and options
   - Include example usage
   - Update project-level documentation to reference CLI
   - Final code review and cleanup

## Implementation Details

### Directory Structure

```
packages/
  cli/
    package.json
    tsconfig.json
    src/
      index.ts
      commands/
        words.ts
      utils/
        formatting.ts
        debug.ts
    tests/
      words.test.ts
      cli.test.ts
```

### Command Usage Examples

The CLI will support commands like:

```bash
# Run words evaluation with default settings
evals words

# Run words evaluation with custom count
evals words --count 20

# Run words evaluation with custom word list
evals words --words "apple,banana,orange"

# Run words evaluation with both custom count and words
evals words --count 5 --words "paper,rock,scissors"

# Enable debug output
evals words --debug
```

### Parameters for "words" Command

- `-c, --count <number>`: Number of evaluation iterations to run (default: 10)
- `-w, --words <string>`: Comma-separated list of words to use in evaluation
- `-d, --debug`: Enable debug output
- `-h, --help`: Display help information

### Testing Strategy

Each component should have its own unit tests:
- Test CLI argument parsing
- Test evaluation parameter validation
- Test integration with evaluation infrastructure
- Test output formatting

All tests should be implemented alongside the functionality they test, not at the end of development.

### Notes for Implementation

- Use TypeScript for type safety
- Implement robust error handling
- Use async/await for asynchronous operations
- Provide clear, actionable error messages
- Maintain consistent code style with the rest of the project
- Use dependency injection where appropriate to facilitate testing