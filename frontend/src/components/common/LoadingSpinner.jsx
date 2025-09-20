import React from 'react';

const LoadingSpinner = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
    xlarge: 'h-16 w-16'
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`}></div>
    </div>
  );
};

export const LoadingSpinnerOverlay = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 flex flex-col items-center">
        <LoadingSpinner size="large" />
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  );
};

export const LoadingSpinnerInline = ({ message = 'Loading...', size = 'medium' }) => {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center space-x-3">
        <LoadingSpinner size={size} />
        <span className="text-gray-600">{message}</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
