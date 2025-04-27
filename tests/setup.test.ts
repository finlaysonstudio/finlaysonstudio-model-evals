import { describe, it, expect } from 'vitest';

describe('Vitest Setup', () => {
  it('should be properly configured', () => {
    expect(true).toBe(true);
  });
  
  it('can perform basic assertions', () => {
    expect(1 + 1).toBe(2);
    expect('hello').toContain('hell');
    expect([1, 2, 3]).toHaveLength(3);
  });
});