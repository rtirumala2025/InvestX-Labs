import { describe, it, expect } from 'vitest';
import { classifyQuery } from '../queryClassifier';

describe('Query Classifier', () => {
  it('should classify education queries', () => {
    const result = classifyQuery('What is compound interest?');
    expect(result.primary).toBe('education');
    expect(result.requiresSafety).toBe(false);
  });

  it('should classify suggestion queries', () => {
    const result = classifyQuery('What should I invest in?');
    expect(result.primary).toBe('suggestion');
    expect(result.requiresSafety).toBe(false);
  });

  it('should detect safety requirements', () => {
    const result = classifyQuery('Should I buy TSLA stock?');
    expect(result.requiresSafety).toBe(true);
  });

  it('should detect crypto queries', () => {
    const result = classifyQuery('What about Bitcoin?');
    expect(result.requiresSafety).toBe(true);
    expect(result.categories).toContain('crypto');
  });
});
