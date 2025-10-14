import { describe, it, expect } from 'vitest';
import { TokenCounter } from '../utils/tokenCounter.js';

describe('TokenCounter', () => {
  it('should estimate token count for empty string', () => {
    expect(TokenCounter.estimate('')).toBe(0);
  });

  it('should estimate token count for short text', () => {
    expect(TokenCounter.estimate('Hello')).toBe(2); // 5 chars / 4 = 1.25 -> 2
  });

  it('should count tokens accurately', () => {
    const count = TokenCounter.count('Hello world');
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(10);
  });

  it('should handle token counting errors gracefully', () => {
    // Force an error by passing null
    const originalConsoleWarn = console.warn;
    let warningMessage = '';
    
    console.warn = (msg) => { warningMessage = msg; };
    
    const count = TokenCounter.count(null);
    
    expect(count).toBe(0);
    expect(warningMessage).toContain('Token counting failed');
    
    console.warn = originalConsoleWarn;
  });

  it('should check if messages fit within token limit', () => {
    const messages = [
      { content: 'Hello' },
      { content: 'How are you?' },
      { content: 'This is a test message' }
    ];

    const result = TokenCounter.canFit(messages, 100);
    
    expect(result).toHaveProperty('fits');
    expect(result).toHaveProperty('totalTokens');
    expect(result).toHaveProperty('remainingTokens');
    expect(result.fits).toBe(true);
    expect(result.remainingTokens).toBeGreaterThan(0);
  });

  it('should truncate text to fit token limit', () => {
    const longText = 'This is a long text that should be truncated to fit within the token limit. '
      + 'It contains multiple sentences and should be shortened.';
    
    const truncated = TokenCounter.truncateToFit(longText, 10);
    
    expect(TokenCounter.count(truncated)).toBeLessThanOrEqual(10);
    expect(truncated.length).toBeLessThan(longText.length);
  });

  it('should count tokens in multiple messages', () => {
    const messages = [
      { content: 'First message' },
      { content: 'Second message' },
      { content: 'Third message' }
    ];
    
    const count = TokenCounter.countMessages(messages);
    const expectedCount = messages.reduce((sum, msg) => sum + TokenCounter.count(msg.content), 0);
    
    expect(count).toBe(expectedCount);
  });
});
