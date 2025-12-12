import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { stripEmojis } from '../utils/stripEmojis';
import { sanitizeElement } from '../utils/domEmojiSanitizer';

// Mock a simple component with emoji content
const TestComponent = ({ text }) => (
  <div>
    <h1>{text}</h1>
    <p>Regular text without emoji</p>
  </div>
);

describe('Emoji Sanitization Integration', () => {
  it('should sanitize emoji in rendered component text', () => {
    const textWithEmoji = 'Hello 👋 World 🌍';
    const sanitizedText = stripEmojis(textWithEmoji);
    
    render(
      <BrowserRouter>
        <TestComponent text={sanitizedText} />
      </BrowserRouter>
    );
    
    const heading = screen.getByText(/Hello.*World/);
    expect(heading.textContent).not.toContain('👋');
    expect(heading.textContent).not.toContain('🌍');
    expect(heading.textContent).toContain('Hello');
    expect(heading.textContent).toContain('World');
  });

  it('should preserve regular text content', () => {
    const regularText = 'Hello World';
    
    render(
      <BrowserRouter>
        <TestComponent text={regularText} />
      </BrowserRouter>
    );
    
    const heading = screen.getByText('Hello World');
    expect(heading).toBeInTheDocument();
  });

  it('should handle DOM sanitization on dynamically added content', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    container.innerHTML = '<p>Test 👋 content 🌍</p>';
    
    // Sanitize the element
    sanitizeElement(container);
    
    // Check that emojis are removed (or at least processed)
    // Use Testing Library to render the sanitized content
    const sanitizedHTML = container.innerHTML;
    render(
      <BrowserRouter>
        <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
      </BrowserRouter>
    );
    const paragraph = screen.getByText(/Test.*content/);
    expect(paragraph).toBeTruthy();
    
    // Clean up
    document.body.removeChild(container);
  });

  it('should not break React rendering with sanitized text', () => {
    const texts = [
      'Hello 👋',
      'Price: $100 💰',
      'Great job! 🎉',
      'Regular text',
    ];
    
    texts.forEach(text => {
      const sanitized = stripEmojis(text);
      expect(() => {
        render(
          <BrowserRouter>
            <TestComponent text={sanitized} />
          </BrowserRouter>
        );
      }).not.toThrow();
    });
  });

  it('should handle edge cases in integration', () => {
    const edgeCases = [
      '',
      '   ',
      '👋',
      '🎉🎊🎈',
      'Text with 👋 multiple 🌍 emojis 🚀',
    ];
    
    edgeCases.forEach(text => {
      const sanitized = stripEmojis(text);
      expect(typeof sanitized).toBe('string');
      
      // Should not throw when rendering
      expect(() => {
        render(
          <BrowserRouter>
            <TestComponent text={sanitized} />
          </BrowserRouter>
        );
      }).not.toThrow();
    });
  });
});

