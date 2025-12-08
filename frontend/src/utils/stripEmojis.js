/**
 * Emoji removal utility function
 * 
 * Removes emoji/pictograph Unicode characters and variation selectors from text.
 * Uses modern Unicode property escapes (\p{Extended_Pictographic}) with a fallback
 * for environments that don't support Unicode property escapes.
 * 
 * @param {string} text - The text to sanitize
 * @returns {string} Text with emoji characters removed
 * 
 * @example
 * stripEmojis('Hello 👋 world 🌍') // Returns 'Hello  world '
 * stripEmojis('Price: $100 💰') // Returns 'Price: $100 '
 */
export function stripEmojis(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }

  try {
    // Modern approach: Use Unicode property escapes (ES2018+)
    // Matches Extended_Pictographic characters and variation selectors
    const emojiRegex = /[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu;
    
    // Test if Unicode property escapes are supported
    try {
      // This will throw in environments without Unicode property support
      const testRegex = new RegExp('\\p{Extended_Pictographic}', 'u');
      testRegex.test('test');
      
      // Use modern regex
      return text.replace(emojiRegex, '');
    } catch (e) {
      // Fallback for environments without Unicode property escape support
      return stripEmojisFallback(text);
    }
  } catch (error) {
    // If anything fails, use fallback
    return stripEmojisFallback(text);
  }
}

/**
 * Fallback emoji removal using common emoji ranges
 * Used when Unicode property escapes are not supported
 * 
 * @param {string} text - The text to sanitize
 * @returns {string} Text with emoji characters removed
 * @private
 */
function stripEmojisFallback(text) {
  // Common emoji ranges (covers most emojis)
  // This is a comprehensive but not exhaustive list
  const emojiRanges = [
    // Emoticons
    /[\u{1F600}-\u{1F64F}]/gu,
    // Miscellaneous Symbols and Pictographs
    /[\u{1F300}-\u{1F5FF}]/gu,
    // Supplemental Symbols and Pictographs
    /[\u{1F900}-\u{1F9FF}]/gu,
    // Transport and Map Symbols
    /[\u{1F680}-\u{1F6FF}]/gu,
    // Symbols and Pictographs Extended-A
    /[\u{1FA00}-\u{1FAFF}]/gu,
    // Dingbats
    /[\u{2700}-\u{27BF}]/gu,
    // Miscellaneous Symbols
    /[\u{2600}-\u{26FF}]/gu,
    // Variation Selectors
    /[\u{FE00}-\u{FE0F}]/gu,
    // Combining Diacritical Marks for Symbols
    /[\u{20D0}-\u{20FF}]/gu,
    // Zero Width Joiner (used in emoji sequences)
    /\u{200D}/gu,
    // Enclosed characters (keycap sequences)
    /[\u{20E3}]/gu,
    // Regional Indicator Symbols (flag emojis)
    /[\u{1F1E0}-\u{1F1FF}]/gu,
    // Tags (used in flag sequences)
    /[\u{E0020}-\u{E007F}]/gu,
    // Skin tone modifiers
    /[\u{1F3FB}-\u{1F3FF}]/gu,
  ];

  let result = text;
  for (const range of emojiRanges) {
    result = result.replace(range, '');
  }

  return result;
}

/**
 * Sanitize text by removing emojis and cleaning up extra whitespace
 * 
 * @param {string} text - The text to sanitize
 * @param {boolean} trimWhitespace - Whether to trim and normalize whitespace (default: true)
 * @returns {string} Sanitized text
 */
export function sanitizeText(text, trimWhitespace = true) {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let sanitized = stripEmojis(text);
  
  if (trimWhitespace) {
    // Replace multiple spaces with single space
    sanitized = sanitized.replace(/\s+/g, ' ');
    // Trim leading/trailing whitespace
    sanitized = sanitized.trim();
  }

  return sanitized;
}

/**
 * Check if a string contains emoji characters
 * 
 * @param {string} text - The text to check
 * @returns {boolean} True if text contains emoji characters
 */
export function hasEmojis(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }

  try {
    const emojiRegex = /[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu;
    const testRegex = new RegExp('\\p{Extended_Pictographic}', 'u');
    testRegex.test('test');
    return emojiRegex.test(text);
  } catch (e) {
    // Fallback check
    const fallbackRanges = [
      /[\u{1F600}-\u{1F64F}]/gu,
      /[\u{1F300}-\u{1F5FF}]/gu,
      /[\u{1F900}-\u{1F9FF}]/gu,
      /[\u{1F680}-\u{1F6FF}]/gu,
      /[\u{2700}-\u{27BF}]/gu,
      /[\u{2600}-\u{26FF}]/gu,
    ];
    
    return fallbackRanges.some(range => range.test(text));
  }
}

export default stripEmojis;

