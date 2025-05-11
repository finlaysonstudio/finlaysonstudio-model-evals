#!/usr/bin/env node
import { Command } from 'commander';
import { wordsCommand } from './commands/words.js';
import packageJson from '../package.json' assert { type: 'json' };
const version = packageJson.version;
import { setupDebug } from './utils/debug.js';

// Create the main program
const program = new Command();

// Set up basic program information
program
  .name('evals')
  .description('Command-line interface for model evaluations')
  .version(version);

// Add global debug option
program.option('-d, --debug', 'enable debug output');

// Parse global options early to set up debugging
program.parseOptions(process.argv);
const options = program.opts();

// Set up debug if enabled
setupDebug(options.debug);

// Register commands
wordsCommand(program);

// Parse arguments and execute
program.parse();