/**
 * Network Monitoring Utility
 * Monitors network connectivity and provides offline/online state management
 */

import { useState, useEffect, useCallback } from 'react';

// Network state constants
export const NETWORK_STATES = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  UNKNOWN: 'unknown'
};

// Queue for pending operations when offline
let pendingOperations = [];
let isOnline = navigator.onLine;

/**
 * Network Monitor Class
 * Handles network state detection and operation queuing
 */
class NetworkMonitor {
  constructor() {
    this.listeners = new Set();
    this.isOnline = navigator.onLine;
    this.pendingOperations = [];
    this.retryAttempts = new Map();
    this.maxRetryAttempts = 3;
    this.retryDelay = 1000; // 1 second base delay
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  handleOnline() {
    console.log('🌐 Network: Back online');
    this.isOnline = true;
    this.notifyListeners(NETWORK_STATES.ONLINE);
    this.processPendingOperations();
  }

  handleOffline() {
    console.log('📴 Network: Gone offline');
    this.isOnline = false;
    this.notifyListeners(NETWORK_STATES.OFFLINE);
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(state) {
    this.listeners.forEach(callback => callback(state));
  }

  getNetworkState() {
    return this.isOnline ? NETWORK_STATES.ONLINE : NETWORK_STATES.OFFLINE;
  }

  /**
   * Queue an operation to be executed when back online
   * @param {Function} operation - Operation to queue
   * @param {Object} options - Options for the operation
   */
  queueOperation(operation, options = {}) {
    const {
      id = Date.now().toString(),
      priority = 0,
      maxRetries = this.maxRetryAttempts,
      retryDelay = this.retryDelay
    } = options;

    const queuedOperation = {
      id,
      operation,
      priority,
      maxRetries,
      retryDelay,
      attempts: 0,
      queuedAt: Date.now()
    };

    this.pendingOperations.push(queuedOperation);
    this.pendingOperations.sort((a, b) => b.priority - a.priority);

    console.log(`📝 Queued operation ${id} (${this.pendingOperations.length} pending)`);
  }

  /**
   * Process all pending operations
   */
  async processPendingOperations() {
    if (!this.isOnline || this.pendingOperations.length === 0) {
      return;
    }

    console.log(`🔄 Processing ${this.pendingOperations.length} pending operations`);

    const operations = [...this.pendingOperations];
    this.pendingOperations = [];

    for (const queuedOp of operations) {
      try {
        await this.executeOperation(queuedOp);
      } catch (error) {
        console.error(`❌ Failed to execute queued operation ${queuedOp.id}:`, error);
        // Re-queue if retries remaining
        if (queuedOp.attempts < queuedOp.maxRetries) {
          queuedOp.attempts++;
          this.pendingOperations.push(queuedOp);
        }
      }
    }
  }

  /**
   * Execute a queued operation
   * @param {Object} queuedOp - Queued operation object
   */
  async executeOperation(queuedOp) {
    if (!this.isOnline) {
      throw new Error('Network is offline');
    }

    console.log(`⚡ Executing queued operation ${queuedOp.id}`);
    await queuedOp.operation();
    console.log(`✅ Successfully executed operation ${queuedOp.id}`);
  }

  /**
   * Clear all pending operations
   */
  clearPendingOperations() {
    this.pendingOperations = [];
    console.log('🧹 Cleared all pending operations');
  }

  /**
   * Get pending operations count
   */
  getPendingOperationsCount() {
    return this.pendingOperations.length;
  }

  /**
   * Get pending operations info
   */
  getPendingOperationsInfo() {
    return this.pendingOperations.map(op => ({
      id: op.id,
      attempts: op.attempts,
      maxRetries: op.maxRetries,
      queuedAt: op.queuedAt,
      priority: op.priority
    }));
  }
}

// Global network monitor instance
const networkMonitor = new NetworkMonitor();

/**
 * React hook for network state monitoring
 * @returns {Object} Network state and utilities
 */
export const useNetworkState = () => {
  const [networkState, setNetworkState] = useState(networkMonitor.getNetworkState());
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsubscribe = networkMonitor.addListener((state) => {
      setNetworkState(state);
      setPendingCount(networkMonitor.getPendingOperationsCount());
    });

    return unsubscribe;
  }, []);

  const queueOperation = useCallback((operation, options) => {
    networkMonitor.queueOperation(operation, options);
    setPendingCount(networkMonitor.getPendingOperationsCount());
  }, []);

  const clearPendingOperations = useCallback(() => {
    networkMonitor.clearPendingOperations();
    setPendingCount(0);
  }, []);

  return {
    isOnline: networkState === NETWORK_STATES.ONLINE,
    isOffline: networkState === NETWORK_STATES.OFFLINE,
    networkState,
    pendingCount,
    queueOperation,
    clearPendingOperations,
    getPendingOperationsInfo: () => networkMonitor.getPendingOperationsInfo()
  };
};

/**
 * Higher-order function to wrap operations with network awareness
 * @param {Function} operation - Operation to wrap
 * @param {Object} options - Options for the operation
 * @returns {Function} Network-aware operation
 */
export const withNetworkAwareness = (operation, options = {}) => {
  const {
    queueWhenOffline = true,
    operationId = null,
    priority = 0
  } = options;

  return async (...args) => {
    if (networkMonitor.isOnline) {
      try {
        return await operation(...args);
      } catch (error) {
        // If it's a network error and we should queue, queue the operation
        if (queueWhenOffline && isNetworkError(error)) {
          console.log('📝 Network error detected, queuing operation for retry');
          networkMonitor.queueOperation(
            () => operation(...args),
            { id: operationId, priority }
          );
          throw new Error('Operation queued for retry when network is restored');
        }
        throw error;
      }
    } else if (queueWhenOffline) {
      console.log('📝 Network offline, queuing operation');
      networkMonitor.queueOperation(
        () => operation(...args),
        { id: operationId, priority }
      );
      throw new Error('Operation queued for execution when network is restored');
    } else {
      throw new Error('Network is offline and operation cannot be queued');
    }
  };
};

/**
 * Check if an error is network-related
 * @param {Error} error - Error to check
 * @returns {boolean} True if network error
 */
export const isNetworkError = (error) => {
  if (!error) return false;
  
  const networkErrorPatterns = [
    'network',
    'timeout',
    'connection',
    'unavailable',
    'offline',
    'fetch',
    'axios'
  ];
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';
  
  return networkErrorPatterns.some(pattern => 
    errorMessage.includes(pattern) || errorCode.includes(pattern)
  );
};

/**
 * Network status component props
 */
export const getNetworkStatusProps = (networkState, pendingCount) => {
  const isOffline = networkState === NETWORK_STATES.OFFLINE;
  const hasPendingOperations = pendingCount > 0;
  
  return {
    isOffline,
    hasPendingOperations,
    message: isOffline 
      ? 'You are currently offline. Some features may be limited.'
      : hasPendingOperations
      ? `Syncing ${pendingCount} pending operation${pendingCount > 1 ? 's' : ''}...`
      : 'Connected',
    variant: isOffline ? 'error' : hasPendingOperations ? 'warning' : 'success'
  };
};

/**
 * Utility to create a network-aware Firebase operation
 * @param {Function} firebaseOperation - Firebase operation to wrap
 * @param {Object} options - Options for the operation
 * @returns {Function} Network-aware Firebase operation
 */
export const createNetworkAwareFirebaseOperation = (firebaseOperation, options = {}) => {
  return withNetworkAwareness(firebaseOperation, {
    queueWhenOffline: true,
    ...options
  });
};

export default networkMonitor;
