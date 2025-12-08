/**
 * Client-side DOM emoji sanitization
 * 
 * Strips emojis from DOM text nodes at page render for any dynamic content
 * injected by third-party widgets or user-generated content.
 * 
 * This script is efficient and avoids altering:
 * - <script> tags
 * - <style> tags
 * - <textarea> elements
 * - <input> elements
 * - <code> elements
 * - SVG elements
 * - Icon fonts (Font Awesome, Material Icons, etc.)
 */

import { stripEmojis } from './stripEmojis';

// Elements to skip during sanitization
const SKIP_SELECTORS = [
  'script',
  'style',
  'textarea',
  'input',
  'code',
  'pre',
  'svg',
  '[class*="icon"]',
  '[class*="fa-"]',
  '[class*="material-icons"]',
  '[class*="lucide"]',
  '[data-emoji-preserve="true"]', // Allow opt-out via data attribute
];

/**
 * Check if an element should be skipped during sanitization
 * 
 * @param {Node} node - DOM node to check
 * @returns {boolean} True if node should be skipped
 */
function shouldSkipNode(node) {
  if (!node || node.nodeType !== Node.ELEMENT_NODE) {
    return false;
  }

  const element = node;
  const tagName = element.tagName?.toLowerCase();
  
  // Skip specific tag names
  if (['script', 'style', 'textarea', 'input', 'code', 'pre', 'svg'].includes(tagName)) {
    return true;
  }

  // Check class names for icon libraries
  const className = element.className || '';
  if (typeof className === 'string') {
    if (
      className.includes('icon') ||
      className.includes('fa-') ||
      className.includes('material-icons') ||
      className.includes('lucide')
    ) {
      return true;
    }
  }

  // Check data attribute for opt-out
  if (element.hasAttribute('data-emoji-preserve')) {
    return true;
  }

  return false;
}

/**
 * Sanitize text content of a text node
 * 
 * @param {Text} textNode - Text node to sanitize
 */
function sanitizeTextNode(textNode) {
  if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
    return;
  }

  const originalText = textNode.textContent;
  if (!originalText) {
    return;
  }

  const sanitizedText = stripEmojis(originalText);
  
  // Only update if text changed (avoid unnecessary DOM mutations)
  if (sanitizedText !== originalText) {
    textNode.textContent = sanitizedText;
  }
}

/**
 * Recursively sanitize all text nodes in a subtree
 * 
 * @param {Node} root - Root node to start sanitization from
 */
function sanitizeSubtree(root) {
  if (!root) {
    return;
  }

  // Skip if this element should be preserved
  if (shouldSkipNode(root)) {
    return;
  }

  // Create a tree walker to traverse text nodes
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // Skip text nodes inside elements we want to preserve
        let parent = node.parentElement;
        while (parent && parent !== root) {
          if (shouldSkipNode(parent)) {
            return NodeFilter.FILTER_REJECT;
          }
          parent = parent.parentElement;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }

  // Sanitize all collected text nodes
  textNodes.forEach(sanitizeTextNode);
}

/**
 * Initialize DOM emoji sanitization
 * 
 * This should be called after the DOM is ready and can be called
 * multiple times to sanitize dynamically added content.
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.observeMutations - Whether to observe DOM mutations (default: true)
 * @param {boolean} options.sanitizeOnLoad - Whether to sanitize on initial load (default: true)
 * @param {number} options.debounceMs - Debounce time for mutation observer (default: 100)
 */
export function initEmojiSanitizer(options = {}) {
  const {
    observeMutations = true,
    sanitizeOnLoad = true,
    debounceMs = 100,
  } = options;

  // Sanitize existing content on load
  if (sanitizeOnLoad) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        sanitizeSubtree(document.body);
      });
    } else {
      // DOM already loaded
      sanitizeSubtree(document.body);
    }
  }

  // Set up mutation observer for dynamically added content
  if (observeMutations && typeof MutationObserver !== 'undefined') {
    let debounceTimer;
    
    const observer = new MutationObserver((mutations) => {
      // Debounce to avoid excessive sanitization
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        mutations.forEach((mutation) => {
          // Sanitize newly added nodes
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              sanitizeTextNode(node);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              sanitizeSubtree(node);
            }
          });
        });
      }, debounceMs);
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Return cleanup function
    return () => {
      observer.disconnect();
      clearTimeout(debounceTimer);
    };
  }

  // Return no-op cleanup function
  return () => {};
}

/**
 * Sanitize a specific element and its children
 * 
 * @param {HTMLElement} element - Element to sanitize
 */
export function sanitizeElement(element) {
  if (!element) {
    return;
  }
  sanitizeSubtree(element);
}

export default {
  init: initEmojiSanitizer,
  sanitize: sanitizeElement,
  sanitizeSubtree,
};

