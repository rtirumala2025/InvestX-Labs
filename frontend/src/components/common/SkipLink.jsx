import React from 'react';

/**
 * SkipLink Component
 * 
 * Provides keyboard navigation shortcut to skip to main content.
 * WCAG 2.1 AA compliant - helps screen reader users and keyboard-only users.
 */
const SkipLink = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label="Skip to main content"
    >
      Skip to main content
    </a>
  );
};

export default SkipLink;

