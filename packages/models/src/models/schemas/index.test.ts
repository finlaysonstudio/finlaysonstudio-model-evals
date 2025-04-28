import { describe, it, expect } from 'vitest';
import { 
  EvaluationRunStatus, 
  EvaluationRunType,
  AnalysisResultType
} from './index';

// We'll focus on testing the constants and enums since the actual schema
// validation would require a real MongoDB connection

describe('Evaluation Run Schema', () => {
  it('should have the correct evaluation run status values', () => {
    expect(EvaluationRunStatus.PENDING).toBe('pending');
    expect(EvaluationRunStatus.RUNNING).toBe('running');
    expect(EvaluationRunStatus.COMPLETED).toBe('completed');
    expect(EvaluationRunStatus.FAILED).toBe('failed');

    const statusValues = Object.values(EvaluationRunStatus);
    expect(statusValues).toHaveLength(4);
    expect(statusValues).toContain('pending');
    expect(statusValues).toContain('running');
    expect(statusValues).toContain('completed');
    expect(statusValues).toContain('failed');
  });

  it('should have the correct evaluation run type values', () => {
    expect(EvaluationRunType.RANDOM_WORD).toBe('random-word');
    
    const typeValues = Object.values(EvaluationRunType);
    expect(typeValues).toHaveLength(1);
    expect(typeValues).toContain('random-word');
  });
});

describe('Analysis Result Schema', () => {
  it('should have the correct analysis result type values', () => {
    expect(AnalysisResultType.FREQUENCY_DISTRIBUTION).toBe('frequency-distribution');
    expect(AnalysisResultType.POSITION_BIAS).toBe('position-bias');
    expect(AnalysisResultType.STATISTICAL_TEST).toBe('statistical-test');
    
    const typeValues = Object.values(AnalysisResultType);
    expect(typeValues).toHaveLength(3);
    expect(typeValues).toContain('frequency-distribution');
    expect(typeValues).toContain('position-bias');
    expect(typeValues).toContain('statistical-test');
  });
});