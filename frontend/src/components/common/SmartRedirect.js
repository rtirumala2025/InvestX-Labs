import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

const SmartRedirect = () => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to dashboard if authenticated, otherwise to home page
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/home" replace />;
};

export default SmartRedirect;
