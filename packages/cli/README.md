# @finlaysonstudio/eval-models-cli

Command-line interface for model evaluations in the finlaysonstudio-model-evals project.

## Installation

```bash
# Install globally
npm install -g @finlaysonstudio/eval-models-cli

# Or install in a specific workspace
npm install -w your-workspace-name @finlaysonstudio/eval-models-cli
```

## Usage

The CLI provides a command-line interface to run model evaluations:

```bash
# Get help
evals --help

# Check version
evals --version

# Enable debug output
evals --debug
```

## Commands

### words

Run word evaluation tests that measure a model's ability to select words randomly.

```bash
# Run with default settings
evals words

# Run with custom count
evals words --count 20

# Run with custom words
evals words --words "apple,banana,orange,grape"

# Run with both custom count and words
evals words --count 5 --words "paper,rock,scissors"
```

#### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--count <number>` | `-c` | Number of evaluation iterations to run | `10` |
| `--words <string>` | `-w` | Comma-separated list of words to use in evaluation | `clubs,diamonds,hearts,spades` |
| `--prompt-style <style>` | `-p` | Prompt style to use (simple, structured, detailed) | `simple` |
| `--tracking` | `-t` | Enable tracking in database | `false` |
| `--format <format>` | `-f` | Output format (table, json, csv, compact) | `table` |
| `--quiet` | `-q` | Reduce verbosity of output | `false` |
| `--model-provider <provider>` | | Model provider (openai, anthropic) | `anthropic` |
| `--model-name <name>` | | Model name to use | |
| `--api-key <key>` | | API key for the model provider | |

## Environment Variables

The CLI uses the following environment variables if not explicitly provided through options:

- `OPENAI_API_KEY`: API key for OpenAI models (when using `--model-provider openai`)
- `ANTHROPIC_API_KEY`: API key for Anthropic models (when using `--model-provider anthropic`)
- `MONGODB_URI`: MongoDB connection URI (when using `--tracking`)

## Output Formats

The CLI supports multiple output formats for the evaluation results:

### Table Format (default)

```
Word Frequency:
┌────────┬───────┬────────────┐
│ Word   │ Count │ Percentage │
├────────┼───────┼────────────┤
│ clubs  │ 3     │ 30.00%     │
│ diamonds │ 2   │ 20.00%     │
│ hearts │ 3     │ 30.00%     │
│ spades │ 2     │ 20.00%     │
└────────┴───────┴────────────┘

Position Bias:
┌──────────┬───────┬────────────┐
│ Position │ Count │ Percentage │
├──────────┼───────┼────────────┤
│ 0        │ 2     │ 20.00%     │
│ 1        │ 3     │ 30.00%     │
│ 2        │ 3     │ 30.00%     │
│ 3        │ 2     │ 20.00%     │
└──────────┴───────┴────────────┘
```

### JSON Format

```bash
evals words --format json
```

Outputs a JSON object containing all evaluation data.

### CSV Format

```bash
evals words --format csv
```

Outputs data in CSV format.

### Compact Format

```bash
evals words --format compact
```

Outputs a more compact version of the table format.

## Database Integration

When using the `--tracking` flag, the CLI will store evaluation results in MongoDB. This requires:

1. A MongoDB database connection (set via `MONGODB_URI`)
2. The tracked evaluations can be accessed later using the `EvaluationService` from `@finlaysonstudio/eval-models`

## Examples

```bash
# Basic evaluation with defaults
evals words

# Custom evaluation with 50 runs using specific words and JSON output
evals words --count 50 --words "rock,paper,scissors,lizard,spock" --format json

# Run a quiet evaluation using OpenAI instead of Anthropic
evals words --quiet --model-provider openai

# Run an evaluation with database tracking
evals words --tracking --count 100

# Run evaluation with a custom prompt style
evals words --prompt-style structured
```

## Error Codes

The CLI uses the following error codes:

- `0`: Success
- `1`: API key error or invalid input parameter
- `2`: Database connection error
- `3`: General evaluation error

## Development

To develop the CLI package:

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run tests
npm test

# Watch for changes during development
npm run dev
```

This CLI is part of the [finlaysonstudio-model-evals](https://github.com/finlaysonstudio/model-evals) project, which aims to quantify biases in large language models through structured evaluations.

## License

MIT