import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';
import { wordsCommand } from '../src/commands/words';

describe('CLI commands', () => {
  describe('wordsCommand', () => {
    it('should register the words command with correct options', () => {
      // Create a mock Command instance
      const program = {
        command: vi.fn().mockReturnThis(),
        description: vi.fn().mockReturnThis(),
        option: vi.fn().mockReturnThis(),
        action: vi.fn().mockReturnThis(),
      } as unknown as Command;
      
      // Register the words command
      wordsCommand(program);
      
      // Verify command was registered with the correct name
      expect(program.command).toHaveBeenCalledWith('words');
      
      // Verify description was set
      expect(program.description).toHaveBeenCalledWith('Run word evaluation tests');
      
      // Verify options were registered
      expect(program.option).toHaveBeenCalledWith(
        '-c, --count <number>',
        'number of evaluation iterations to run',
        expect.any(Function)
      );
      
      expect(program.option).toHaveBeenCalledWith(
        '-w, --words <string>',
        'comma-separated list of words to use in evaluation'
      );
      
      // Verify action was set
      expect(program.action).toHaveBeenCalledWith(expect.any(Function));
    });
  });
});