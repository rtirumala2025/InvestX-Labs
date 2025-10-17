import { describe, it, expect } from 'vitest';
import { formatResponse } from '../responseFormatter';

describe('Response Formatter', () => {
  it('should format education responses', () => {
    const response = {
      type: 'education',
      data: {
        title: 'Compound Interest',
        explanation: 'Compound interest is interest on interest.',
        example: 'If you invest $100 at 10%...',
        keyPoints: ['Grows over time', 'Power of compounding']
      }
    };
    
    const formatted = formatResponse(response, 'education');
    expect(formatted).toContain('📚 Compound Interest');
    expect(formatted).toContain('📖 Explanation');
    expect(formatted).toContain('💡 Example');
    expect(formatted).toContain('🔍 Key Points');
  });

  it('should format suggestion responses with disclaimer', () => {
    const response = {
      type: 'suggestion',
      data: {
        title: 'Investment Options',
        overview: 'Here are some options...',
        considerations: 'Consider your risk tolerance...',
        disclaimer: 'This is not financial advice.'
      }
    };
    
    const formatted = formatResponse(response, 'suggestion');
    expect(formatted).toContain('💡 Investment Options');
    expect(formatted).toContain('📊 Overview');
    expect(formatted).toContain('🔍 Considerations');
    expect(formatted).toContain('⚠️ Important Reminder');
    expect(formatted).toContain('not financial advice');
  });
});
