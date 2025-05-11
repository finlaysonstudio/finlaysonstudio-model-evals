import { describe, it, expect } from 'vitest';
import {
  formatAsTable,
  formatAsJson,
  formatAsCsv,
  formatAsCompactTable,
  formatOutput,
  OutputFormat
} from '../src/utils/formatting';

describe('Formatting Utilities', () => {
  // Test data
  const sampleData = [
    { name: 'John', age: 30, city: 'New York' },
    { name: 'Alice', age: 25, city: 'Los Angeles' },
    { name: 'Bob', age: 40, city: 'Chicago' }
  ];

  describe('formatAsTable', () => {
    it('should format data as a table with proper padding', () => {
      const result = formatAsTable(sampleData);
      
      // Check header row
      expect(result).toContain('name | age | city');
      
      // Check separator row
      expect(result).toContain('-----+-----+------------');
      
      // Check data rows - with proper padding
      expect(result).toContain('John | 30  | New York');
      expect(result).toContain('Alice | 25  | Los Angeles');
      expect(result).toContain('Bob   | 40  | Chicago');
    });

    it('should handle empty data array', () => {
      const result = formatAsTable([]);
      expect(result).toBe('No data available');
    });
  });

  describe('formatAsCompactTable', () => {
    it('should format data as a compact table with minimal padding', () => {
      const result = formatAsCompactTable(sampleData);
      
      // Check header row
      expect(result).toContain('name | age | city');
      
      // Check separator row (shorter than standard table)
      expect(result).toContain('----+----+----');
      
      // Check data rows - should not have extra padding
      expect(result).toContain('John | 30 | New York');
      expect(result).toContain('Alice | 25 | Los Angeles');
      expect(result).toContain('Bob | 40 | Chicago');
    });

    it('should handle empty data array', () => {
      const result = formatAsCompactTable([]);
      expect(result).toBe('No data available');
    });
  });

  describe('formatAsJson', () => {
    it('should format data as properly indented JSON', () => {
      const result = formatAsJson(sampleData);
      
      // Parse and verify the JSON
      const parsed = JSON.parse(result);
      expect(parsed).toEqual(sampleData);
      
      // Check indentation (2 spaces)
      expect(result).toContain('{\n    "name": "John"');
    });
  });

  describe('formatAsCsv', () => {
    it('should format data as CSV with headers', () => {
      const result = formatAsCsv(sampleData);
      
      // Check header row
      expect(result.startsWith('name,age,city')).toBe(true);
      
      // Check data rows
      expect(result).toContain('John,30,New York');
      expect(result).toContain('Alice,25,Los Angeles');
      expect(result).toContain('Bob,40,Chicago');
    });

    it('should escape values with commas', () => {
      const dataWithCommas = [
        { name: 'John,Doe', age: 30, city: 'New York' }
      ];
      
      const result = formatAsCsv(dataWithCommas);
      expect(result).toContain('"John,Doe",30,New York');
    });

    it('should escape values with quotes', () => {
      const dataWithQuotes = [
        { name: 'John "Nickname" Doe', age: 30, city: 'New York' }
      ];
      
      const result = formatAsCsv(dataWithQuotes);
      expect(result).toContain('"John ""Nickname"" Doe",30,New York');
    });

    it('should handle empty data array', () => {
      const result = formatAsCsv([]);
      expect(result).toBe('No data available');
    });
  });

  describe('formatOutput', () => {
    it('should use table format by default', () => {
      const result = formatOutput(sampleData);
      expect(result).toContain('name | age | city');
      expect(result).toContain('-----+-----+------------');
    });

    it('should format as JSON when specified', () => {
      const result = formatOutput(sampleData, 'json');
      expect(JSON.parse(result)).toEqual(sampleData);
    });

    it('should format as CSV when specified', () => {
      const result = formatOutput(sampleData, 'csv');
      expect(result.startsWith('name,age,city')).toBe(true);
    });

    it('should format as compact table when specified', () => {
      const result = formatOutput(sampleData, 'compact');
      expect(result).toContain('name | age | city');
      expect(result).toContain('----+----+----');
    });

    it('should convert non-array data to array for table formats', () => {
      const nonArrayData = { a: 1, b: 2, c: 3 };
      const result = formatOutput(nonArrayData, 'table');
      
      // Should convert object to key-value pairs
      expect(result).toContain('key | value');
      expect(result).toContain('a   | 1');
      expect(result).toContain('b   | 2');
      expect(result).toContain('c   | 3');
    });

    it('should throw error for non-array data with CSV format', () => {
      const nonArrayData = { a: 1, b: 2, c: 3 };
      expect(() => formatOutput(nonArrayData, 'csv')).toThrow('CSV format only supports array data');
    });
  });
});