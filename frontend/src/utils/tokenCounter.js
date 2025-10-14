import { encode, decode } from 'gpt-tokenizer';

export class TokenCounter {
  static estimate(text) {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }
  
  static count(text) {
    if (!text) return 0;
    try {
      return encode(text).length;
    } catch (error) {
      console.warn('Token counting failed, using estimate:', error.message);
      return this.estimate(text);
    }
  }
  
  static canFit(messages, maxTokens = 4096) {
    const totalTokens = messages.reduce((sum, msg) => {
      return sum + this.count(msg.content || '');
    }, 0);
    
    return {
      fits: totalTokens < maxTokens,
      totalTokens,
      remainingTokens: maxTokens - totalTokens
    };
  }
  
  static truncateToFit(text, maxTokens) {
    if (!text) return '';
    
    try {
      const tokens = encode(text);
      if (tokens.length <= maxTokens) return text;
      
      const truncated = tokens.slice(0, maxTokens);
      return decode(truncated);
    } catch (error) {
      // Fallback: character-based truncation
      const estimatedChars = maxTokens * 4;
      return text.slice(0, estimatedChars);
    }
  }
  
  static countMessages(messages) {
    return messages.reduce((total, msg) => {
      return total + this.count(msg.content || '');
    }, 0);
  }
}
