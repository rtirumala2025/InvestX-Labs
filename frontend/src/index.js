import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './context/ThemeContext';
import App from './App';
import './index.css';

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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
