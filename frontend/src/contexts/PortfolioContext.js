import React, { createContext, useContext, useEffect } from 'react';
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
  const portfolioData = usePortfolio();
  const { registerContext } = useApp() || {};

  useEffect(() => {
    let unregister;
    if (registerContext) {
      unregister = registerContext('portfolio', portfolioData);
    }
    return () => unregister?.();
  }, [portfolioData, registerContext]);

  return (
    <PortfolioContext.Provider value={portfolioData}>
      {children}
    </PortfolioContext.Provider>
  );
};

