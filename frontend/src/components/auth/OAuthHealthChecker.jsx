/**
 * OAuth Health Checker Component
 * 
 * Automatically checks OAuth health when mounted and displays warnings
 * if configuration is incorrect. This prevents users from clicking sign-in
 * only to get an error.
 */

import React, { useEffect, useState } from 'react';
import { checkOAuthHealth, OAuthHealthStatus } from '../../services/supabase/oauthHealthCheck';

const OAuthHealthChecker = ({ onHealthCheck }) => {
  const [healthStatus, setHealthStatus] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const performHealthCheck = async () => {
      try {
        console.log('🔍 [OAuthHealthChecker] Starting health check...');
        const health = await checkOAuthHealth();
        
        if (mounted) {
          console.log('🔍 [OAuthHealthChecker] Health check complete:', {
            status: health.status,
            healthy: health.healthy,
            canAttemptSignIn: health.canAttemptSignIn,
            errors: health.errors.length
          });
          
          setHealthStatus(health);
          setChecking(false);
          
          // Notify parent component if callback provided
          if (onHealthCheck) {
            onHealthCheck(health);
          }
        }
      } catch (error) {
        console.error('🔍 [OAuthHealthChecker] Health check error:', error);
        if (mounted) {
          setChecking(false);
        }
      }
    };

    // Perform health check after a short delay to avoid blocking initial render
    const timeout = setTimeout(performHealthCheck, 500);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [onHealthCheck]);

  // Don't render anything if health check passed or is still checking
  if (checking || !healthStatus) {
    return null;
  }

  // Only show warning if unhealthy
  if (healthStatus.status === OAuthHealthStatus.HEALTHY) {
    return null;
  }

  // Show warning banner
  return (
    <div className="mb-4 p-4 rounded-lg bg-yellow-500/20 border border-yellow-500/30 backdrop-blur-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-300">
            Google Sign-In Configuration Issue
          </h3>
          <div className="mt-2 text-sm text-yellow-200">
            <p className="mb-2">Google sign-in is not properly configured. To fix:</p>
            <ul className="list-disc list-inside space-y-1">
              {healthStatus.fixes.slice(0, 3).map((fix, index) => (
                <li key={index}>{fix}</li>
              ))}
            </ul>
            {healthStatus.fixes.length > 3 && (
              <p className="mt-2 text-xs">
                Open browser console (F12) and run <code className="bg-yellow-900/50 px-1 rounded">diagnoseGoogleOAuth()</code> for more details.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OAuthHealthChecker;

