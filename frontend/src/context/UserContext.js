import React, { createContext, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { documents: userData, loading: userDataLoading } = useFirestore('users', user?.uid);

  const userProfile = userData?.[0] || null;
  const loading = authLoading || userDataLoading;

  const updateUserProfile = async (updates) => {
    // This would be implemented with the actual update function
    console.log('Updating user profile:', updates);
  };

  const isOnboardingComplete = userProfile?.onboardingCompleted || false;

  const value = {
    user,
    userProfile,
    loading,
    updateUserProfile,
    isOnboardingComplete
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
