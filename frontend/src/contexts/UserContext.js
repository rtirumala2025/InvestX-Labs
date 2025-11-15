import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const { currentUser, loading: authLoading } = useAuth();

  const value = useMemo(() => {
    const profile = currentUser?.profile || null;
    return {
      user: currentUser || null,
      userProfile: profile,
      loading: authLoading,
      updateUserProfile: async () => {},
      isOnboardingComplete: Boolean(profile?.onboarding_completed || profile?.profile_completed)
    };
  }, [currentUser, authLoading]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

