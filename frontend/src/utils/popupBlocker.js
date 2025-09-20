/**
 * Popup Blocker Detection Utility
 * Helps detect if popups are blocked and provides fallback mechanisms
 */

/**
 * Check if popups are blocked by the browser
 * @returns {Promise<boolean>} True if popups are blocked, false otherwise
 */
export const isPopupBlocked = async () => {
  try {
    // Try to open a small popup
    const popup = window.open('', '_blank', 'width=1,height=1,scrollbars=no,resizable=no');
    
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      return true;
    }
    
    // Close the test popup
    popup.close();
    return false;
  } catch (error) {
    return true;
  }
};

/**
 * Show popup blocker warning to user
 * @param {Function} onRetry - Function to call when user wants to retry
 */
export const showPopupBlockerWarning = (onRetry) => {
  const warningMessage = `
    Popup blocked detected! 
    
    To use Google sign-in:
    1. Click "Allow" when prompted by your browser
    2. Or manually allow popups for this site in your browser settings
    3. Then click "Try Again" below
    
    Common browser settings:
    - Chrome: Click the popup icon in the address bar → Always allow
    - Firefox: Click the shield icon → Disable popup blocking
    - Safari: Safari menu → Preferences → Websites → Pop-up Windows → Allow
  `;
  
  if (confirm(warningMessage + '\n\nClick OK to try again, or Cancel to continue with email sign-in.')) {
    onRetry();
  }
};

/**
 * Enhanced popup opener with blocker detection
 * @param {string} url - URL to open in popup
 * @param {string} name - Window name
 * @param {string} features - Window features
 * @returns {Promise<Window>} The opened popup window
 */
export const openPopupWithDetection = (url, name = '_blank', features = 'width=500,height=600,scrollbars=yes,resizable=yes') => {
  return new Promise((resolve, reject) => {
    const popup = window.open(url, name, features);
    
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      reject(new Error('Popup blocked. Please allow popups for this site.'));
      return;
    }
    
    // Check if popup is still open after a short delay
    setTimeout(() => {
      if (popup.closed) {
        reject(new Error('Popup was closed before authentication could complete.'));
      } else {
        resolve(popup);
      }
    }, 1000);
  });
};
