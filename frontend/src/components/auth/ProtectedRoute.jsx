import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../common/LoadingSpinner";
import { getSession as getCachedSession } from "../../services/api/auth";

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const [guestSession, setGuestSession] = useState(null);
  const [checkingCachedSession, setCheckingCachedSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const attemptRestoreSession = async () => {
      if (loading || currentUser) {
        if (isMounted) {
          setGuestSession(null);
          setCheckingCachedSession(false);
        }
        return;
      }

      try {
        const cached = await getCachedSession();
        if (isMounted) {
          setGuestSession(cached);
        }
      } finally {
        if (isMounted) {
          setCheckingCachedSession(false);
        }
      }
    };

    attemptRestoreSession();

    return () => {
      isMounted = false;
    };
  }, [currentUser, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    if (checkingCachedSession) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <LoadingSpinner size="large" />
        </div>
      );
    }

    if (guestSession) {
      return (
        <div className="relative">
          <div className="bg-amber-500/20 border border-amber-500 text-amber-100 px-6 py-4 text-sm md:text-base rounded-none md:rounded-md shadow-lg md:m-6 md:mt-6">
            <p className="font-semibold">Offline read-only mode</p>
            <p className="mt-1 text-amber-200/80">
              We could not verify your session with Supabase. You are viewing
              cached data and some actions may be disabled until you reconnect.
            </p>
          </div>
          {children}
        </div>
      );
    }

    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
