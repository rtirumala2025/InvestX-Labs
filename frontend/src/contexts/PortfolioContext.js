import React, { createContext, useContext } from 'react';
import { usePortfolio } from '../hooks/usePortfolio';

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

  return (
    <PortfolioContext.Provider value={portfolioData}>
      {children}
    </PortfolioContext.Provider>
  );
};

