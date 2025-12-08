import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './index.css';
import { initEmojiSanitizer } from './utils/domEmojiSanitizer';

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // Check if it's a message channel error (usually from browser extensions)
  if (event.reason && event.reason.message && 
      event.reason.message.includes('message channel closed')) {
    console.warn('Message channel error (likely from browser extension):', event.reason);
    event.preventDefault(); // Prevent the error from being logged to console
  }
});

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  // Check if it's a message channel error
  if (event.message && event.message.includes('message channel closed')) {
    console.warn('Message channel error (likely from browser extension):', event.error);
    event.preventDefault(); // Prevent the error from being logged to console
  }
});


// Ensure the root element exists
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Failed to find the root element');
} else {
  const root = ReactDOM.createRoot(rootElement);
  
  // Wrap the app with all necessary providers
  const AppWithProviders = () => (
    <React.StrictMode>
      <Router>
        <App />
      </Router>
    </React.StrictMode>
  );

  root.render(<AppWithProviders />);
  console.log('App rendered with all providers');

  // Initialize emoji sanitization for dynamic content
  // This sanitizes any third-party widgets or dynamically injected content
  // Runs in all environments to ensure consistent behavior
  initEmojiSanitizer({
    observeMutations: true,
    sanitizeOnLoad: true,
    debounceMs: 100,
  });

  // Register service worker for offline support
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.warn('Service Worker registration failed:', error);
        });
    });
  }
}
