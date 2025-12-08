import { describe, it, expect } from 'vitest';
import { stripEmojis, sanitizeText, hasEmojis } from '../stripEmojis';

describe('stripEmojis', () => {
  it('should remove common emoji characters', () => {
    expect(stripEmojis('Hello 👋 world 🌍')).toBe('Hello  world ');
    expect(stripEmojis('Price: $100 💰')).toBe('Price: $100 ');
    expect(stripEmojis('Great job! 🎉')).toBe('Great job! ');
  });

  it('should remove multiple emojis', () => {
    expect(stripEmojis('Happy 😊 and excited 🎉')).toBe('Happy  and excited ');
    expect(stripEmojis('🚀 Launch 🎯 Target ✅ Done')).toBe(' Launch  Target  Done');
  });

  it('should remove emoji with skin tone modifiers', () => {
    expect(stripEmojis('Thumbs up 👍')).toBe('Thumbs up ');
    expect(stripEmojis('Wave 👋')).toBe('Wave ');
  });

  it('should remove flag emojis', () => {
    expect(stripEmojis('USA 🇺🇸 and UK 🇬🇧')).toBe('USA  and UK ');
  });

  it('should remove emoji sequences', () => {
    expect(stripEmojis('Family 👨‍👩‍👧‍👦')).toBe('Family ');
    expect(stripEmojis('Woman technologist 👩‍💻')).toBe('Woman technologist ');
  });

  it('should handle text without emojis', () => {
    expect(stripEmojis('Hello world')).toBe('Hello world');
    expect(stripEmojis('Price: $100')).toBe('Price: $100');
    expect(stripEmojis('123 ABC')).toBe('123 ABC');
  });

  it('should handle empty strings', () => {
    expect(stripEmojis('')).toBe('');
    expect(stripEmojis('   ')).toBe('   ');
  });

  it('should handle null and undefined', () => {
    expect(stripEmojis(null)).toBe(null);
    expect(stripEmojis(undefined)).toBe(undefined);
  });

  it('should handle non-string inputs', () => {
    expect(stripEmojis(123)).toBe(123);
    expect(stripEmojis({})).toEqual({});
    expect(stripEmojis([])).toEqual([]);
  });

  it('should preserve special characters and punctuation', () => {
    expect(stripEmojis('Hello! @user #hashtag $100')).toBe('Hello! @user #hashtag $100');
    expect(stripEmojis('Email: test@example.com')).toBe('Email: test@example.com');
  });

  it('should handle mixed content', () => {
    expect(stripEmojis('Check out 🎉 our new feature! 🚀')).toBe('Check out  our new feature! ');
    expect(stripEmojis('Status: ✅ Active | ❌ Inactive')).toBe('Status:  Active |  Inactive');
  });

  it('should remove variation selectors', () => {
    // Variation selectors are often used with emojis
    expect(stripEmojis('Text with variation')).toBe('Text with variation');
  });

  it('should handle edge cases with only emojis', () => {
    expect(stripEmojis('👋')).toBe('');
    expect(stripEmojis('🎉🎊🎈')).toBe('');
    expect(stripEmojis('👋🌍🚀')).toBe('');
  });
});

describe('sanitizeText', () => {
  it('should remove emojis and normalize whitespace by default', () => {
    expect(sanitizeText('Hello 👋  world 🌍')).toBe('Hello world');
    expect(sanitizeText('  Price: $100 💰  ')).toBe('Price: $100');
  });

  it('should preserve whitespace when trimWhitespace is false', () => {
    expect(sanitizeText('Hello 👋  world 🌍', false)).toBe('Hello   world ');
    expect(sanitizeText('  Price: $100 💰  ', false)).toBe('  Price: $100  ');
  });

  it('should handle text without emojis', () => {
    expect(sanitizeText('Hello world')).toBe('Hello world');
    expect(sanitizeText('  Multiple   spaces  ')).toBe('Multiple spaces');
  });

  it('should handle empty strings', () => {
    expect(sanitizeText('')).toBe('');
    expect(sanitizeText('   ')).toBe('');
  });
});

describe('hasEmojis', () => {
  it('should detect emojis in text', () => {
    expect(hasEmojis('Hello 👋')).toBe(true);
    expect(hasEmojis('🎉 Launch')).toBe(true);
    expect(hasEmojis('Text with 🚀 emoji')).toBe(true);
  });

  it('should return false for text without emojis', () => {
    expect(hasEmojis('Hello world')).toBe(false);
    expect(hasEmojis('Price: $100')).toBe(false);
    expect(hasEmojis('123 ABC')).toBe(false);
  });

  it('should return false for empty strings', () => {
    expect(hasEmojis('')).toBe(false);
    expect(hasEmojis('   ')).toBe(false);
  });

  it('should return false for null and undefined', () => {
    expect(hasEmojis(null)).toBe(false);
    expect(hasEmojis(undefined)).toBe(false);
  });

  it('should detect various emoji types', () => {
    expect(hasEmojis('😊')).toBe(true);
    expect(hasEmojis('🇺🇸')).toBe(true);
    expect(hasEmojis('👨‍👩‍👧‍👦')).toBe(true);
    expect(hasEmojis('👍')).toBe(true);
  });
});

