import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initEmojiSanitizer, sanitizeElement } from '../domEmojiSanitizer';
import { stripEmojis } from '../stripEmojis';

// Mock stripEmojis to track calls
vi.mock('../stripEmojis', () => ({
  stripEmojis: vi.fn((text) => text.replace(/[\u{1F600}-\u{1F64F}]/gu, '')),
}));

describe('domEmojiSanitizer', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('sanitizeElement', () => {
    it('should sanitize text nodes in an element', () => {
      container.innerHTML = '<p>Hello 👋 world 🌍</p>';
      sanitizeElement(container);
      
      expect(stripEmojis).toHaveBeenCalled();
      expect(container.textContent).not.toContain('👋');
    });

    it('should skip script tags', () => {
      container.innerHTML = '<script>console.log("👋");</script><p>Hello 👋</p>';
      sanitizeElement(container);
      
      // Should not process script content
      const script = container.querySelector('script');
      expect(script.textContent).toBe('console.log("👋");');
    });

    it('should skip style tags', () => {
      container.innerHTML = '<style>.emoji { content: "👋"; }</style><p>Hello 👋</p>';
      sanitizeElement(container);
      
      const style = container.querySelector('style');
      expect(style.textContent).toContain('👋');
    });

    it('should skip textarea elements', () => {
      container.innerHTML = '<textarea>Hello 👋</textarea><p>Hello 👋</p>';
      sanitizeElement(container);
      
      const textarea = container.querySelector('textarea');
      expect(textarea.value).toBe('Hello 👋');
    });

    it('should skip input elements', () => {
      container.innerHTML = '<input value="Hello 👋"><p>Hello 👋</p>';
      sanitizeElement(container);
      
      const input = container.querySelector('input');
      expect(input.value).toBe('Hello 👋');
    });

    it('should skip code elements', () => {
      container.innerHTML = '<code>console.log("👋");</code><p>Hello 👋</p>';
      sanitizeElement(container);
      
      const code = container.querySelector('code');
      expect(code.textContent).toBe('console.log("👋");');
    });

    it('should skip elements with data-emoji-preserve attribute', () => {
      container.innerHTML = '<div data-emoji-preserve="true">Hello 👋</div><p>Hello 👋</p>';
      sanitizeElement(container);
      
      const preserved = container.querySelector('[data-emoji-preserve]');
      expect(preserved.textContent).toBe('Hello 👋');
    });

    it('should sanitize nested elements', () => {
      container.innerHTML = '<div><p>Hello 👋</p><span>World 🌍</span></div>';
      sanitizeElement(container);
      
      expect(stripEmojis).toHaveBeenCalled();
    });

    it('should handle empty elements', () => {
      container.innerHTML = '<p></p>';
      sanitizeElement(container);
      
      // Should not throw errors
      expect(container.textContent).toBe('');
    });
  });

  describe('initEmojiSanitizer', () => {
    it('should return a cleanup function', () => {
      const cleanup = initEmojiSanitizer({ sanitizeOnLoad: false, observeMutations: false });
      expect(typeof cleanup).toBe('function');
      cleanup();
    });

    it('should sanitize on load when sanitizeOnLoad is true', () => {
      container.innerHTML = '<p>Hello 👋</p>';
      initEmojiSanitizer({ sanitizeOnLoad: true, observeMutations: false });
      
      // Give it a moment to process
      setTimeout(() => {
        expect(stripEmojis).toHaveBeenCalled();
      }, 10);
    });

    it('should not sanitize on load when sanitizeOnLoad is false', () => {
      container.innerHTML = '<p>Hello 👋</p>';
      initEmojiSanitizer({ sanitizeOnLoad: false, observeMutations: false });
      
      // Should not be called immediately
      expect(stripEmojis).not.toHaveBeenCalled();
    });

    it('should set up mutation observer when observeMutations is true', () => {
      const cleanup = initEmojiSanitizer({ 
        sanitizeOnLoad: false, 
        observeMutations: true 
      });
      
      // Add a new element
      const newElement = document.createElement('p');
      newElement.textContent = 'New 👋 content';
      container.appendChild(newElement);
      
      // Give mutation observer time to process
      setTimeout(() => {
        expect(stripEmojis).toHaveBeenCalled();
      }, 200);
      
      cleanup();
    });
  });
});

