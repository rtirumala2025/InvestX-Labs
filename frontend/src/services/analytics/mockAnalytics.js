/**
 * Mock Analytics Service
 * 
 * This service provides analytics tracking functionality that works both
 * online and offline. When offline, events are queued and sent when back online.
 */

const ANALYTICS_KEY = 'investx_chat_analytics';
const MAX_QUEUE_SIZE = 50; // Maximum number of events to store before dropping oldest

/**
 * Log an analytics event
 * @param {string} eventName - Name of the event (e.g., 'message_sent', 'error_occurred')
 * @param {Object} [data={}] - Additional event data
 */
const logEvent = (eventName, data = {}) => {
  const event = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    event: eventName,
    ...data,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] ${eventName}`, event);
  }

  // Save to localStorage
  try {
    const events = getStoredEvents();
    events.push(event);
    
    // Keep only the most recent events
    const recentEvents = events.slice(-MAX_QUEUE_SIZE);
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(recentEvents));
  } catch (error) {
    console.error('Failed to save analytics event:', error);
  }
};

/**
 * Get all stored analytics events
 * @returns {Array} Array of stored events
 */
const getStoredEvents = () => {
  try {
    const stored = localStorage.getItem(ANALYTICS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get stored analytics events:', error);
    return [];
  }
};

/**
 * Clear all stored analytics events
 */
const clearEvents = () => {
  try {
    localStorage.removeItem(ANALYTICS_KEY);
  } catch (error) {
    console.error('Failed to clear analytics events:', error);
  }
};

/**
 * Log a chat message event
 * @param {string} messageId - Unique ID of the message
 * @param {string} role - 'user' or 'assistant'
 * @param {string} intent - Detected intent of the message
 * @param {number} responseTime - Response time in milliseconds (for assistant messages)
 * @param {Object} [metadata] - Additional metadata
 */
const logChatMessage = (messageId, role, intent, responseTime = null, metadata = {}) => {
  logEvent('chat_message', {
    messageId,
    role,
    intent,
    responseTime,
    ...metadata,
  });};

/**
 * Log an error event
 * @param {Error} error - The error object
 * @param {string} context - Context where the error occurred
 * @param {Object} [metadata] - Additional error metadata
 */
const logError = (error, context, metadata = {}) => {
  logEvent('error', {
    error: {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    },
    context,
    ...metadata,
  });
};

/**
 * Log a user interaction event
 * @param {string} interactionType - Type of interaction (e.g., 'button_click', 'link_click')
 * @param {string} elementId - ID or class of the interacted element
 * @param {Object} [metadata] - Additional interaction metadata
 */
const logInteraction = (interactionType, elementId, metadata = {}) => {
  logEvent('interaction', {
    interactionType,
    elementId,
    ...metadata,
  });
};

/**
 * Log a performance metric
 * @param {string} metricName - Name of the metric
 * @param {number} value - Value of the metric
 * @param {string} unit - Unit of measurement (e.g., 'ms', 'count')
 * @param {Object} [metadata] - Additional metric metadata
 */
const logMetric = (metricName, value, unit, metadata = {}) => {
  logEvent('metric', {
    metricName,
    value,
    unit,
    ...metadata,
  });
};

// Export the public API
export default {
  logEvent,
  logChatMessage,
  logError,
  logInteraction,
  logMetric,
  getStoredEvents,
  clearEvents,
};
