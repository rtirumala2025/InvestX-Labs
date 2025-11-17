import React, { createContext, useContext, useEffect, useRef } from 'react';
import { usePortfolio } from '../hooks/usePortfolio';
import { useApp } from './AppContext';

const PortfolioContext = createContext();

export const usePortfolioContext = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolioContext must be used within a PortfolioProvider');
  }
  return context;
};

export const PortfolioProvider = ({ children }) => {
  console.log('[PortfolioProvider] Mounted');
  const portfolioData = usePortfolio();
  const { registerContext } = useApp() || {};
  const isRegisteredRef = useRef(false);
  const unregisterRef = useRef(null);

  useEffect(() => {
    // Only register once - use ref to track registration
    if (registerContext && !isRegisteredRef.current) {
      console.log('[PortfolioProvider] Registering portfolio context');
      unregisterRef.current = registerContext('portfolio', portfolioData);
      isRegisteredRef.current = true;
      console.log('[PortfolioProvider] Loaded portfolio once');
    }
    
    return () => {
      if (unregisterRef.current) {
        unregisterRef.current();
        unregisterRef.current = null;
        isRegisteredRef.current = false;
      }
    };
  }, [registerContext]); // Only depend on registerContext, not portfolioData

  return (
    <PortfolioContext.Provider value={portfolioData}>
      {children}
    </PortfolioContext.Provider>
  );
};

