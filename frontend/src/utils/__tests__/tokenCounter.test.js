import { describe, it, expect } from 'vitest';
import { TokenCounter } from '../tokenCounter';

describe('Token Counter', () => {
  it('should count tokens in text', () => {
    const count = TokenCounter.count('Hello world');
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(10);
  });

  it('should handle empty string', () => {
    const count = TokenCounter.count('');
    expect(count).toBe(0);
  });

  it('should check if messages fit in context', () => {
    const messages = [
      { content: 'Hello' },
      { content: 'How are you?' }
    ];
    const result = TokenCounter.canFit(messages, 100);
    expect(result.fits).toBe(true);
    expect(result.totalTokens).toBeGreaterThan(0);
  });

  it('should detect when messages exceed context', () => {
    const longText = 'a '.repeat(1000);
    const messages = [
      { content: longText },
      { content: longText }
    ];
    const result = TokenCounter.canFit(messages, 100);
    expect(result.fits).toBe(false);
  });
});
