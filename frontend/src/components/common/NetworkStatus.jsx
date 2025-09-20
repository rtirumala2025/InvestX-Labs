import React from 'react';
import { useNetworkState, getNetworkStatusProps } from '../../utils/networkMonitor';

/**
 * Network Status Component
 * Displays network connectivity status and pending operations
 */
const NetworkStatus = ({ 
  showWhenOnline = false, 
  position = 'top-right',
  className = '',
  style = {}
}) => {
  const { networkState, pendingCount } = useNetworkState();
  const { isOffline, hasPendingOperations, message, variant } = getNetworkStatusProps(networkState, pendingCount);

  // Don't show when online unless explicitly requested
  if (!isOffline && !hasPendingOperations && !showWhenOnline) {
    return null;
  }

  const getStatusIcon = () => {
    if (isOffline) return '📴';
    if (hasPendingOperations) return '🔄';
    return '🌐';
  };

  const getStatusColor = () => {
    switch (variant) {
      case 'error': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'success': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left': return 'top-4 left-4';
      case 'top-right': return 'top-4 right-4';
      case 'bottom-left': return 'bottom-4 left-4';
      case 'bottom-right': return 'bottom-4 right-4';
      case 'top-center': return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-center': return 'bottom-4 left-1/2 transform -translate-x-1/2';
      default: return 'top-4 right-4';
    }
  };

  return (
    <div 
      className={`fixed ${getPositionClasses()} z-50 max-w-sm ${className}`}
      style={style}
    >
      <div className={`
        flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg
        ${getStatusColor()} text-white
        transition-all duration-300 ease-in-out
        ${isOffline ? 'animate-pulse' : ''}
      `}>
        <span className="text-lg">{getStatusIcon()}</span>
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
          {hasPendingOperations && (
            <p className="text-xs opacity-90">
              {pendingCount} operation{pendingCount > 1 ? 's' : ''} pending
            </p>
          )}
        </div>
        {hasPendingOperations && (
          <div className="flex-shrink-0">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkStatus;
