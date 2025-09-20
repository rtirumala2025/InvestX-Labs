import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useFirestore } from './useFirestore';
import { calculatePerformanceMetrics } from '../services/portfolio/portfolioCalculations';
import { trackPortfolioPerformance } from '../services/portfolio/performanceTracking';
import { analyzeDiversification } from '../services/portfolio/diversificationAnalysis';
import { getPortfolioMarketData } from '../services/market/marketData';

/**
 * Custom hook for portfolio management
 * @returns {Object} Portfolio data and operations
 */
export const usePortfolio = () => {
  const { user } = useAuth();
  const { documents: portfolioData, addDocument, updateDocument } = useFirestore('portfolios', user?.uid);
  const { documents: holdings, addDocument: addHolding, updateDocument: updateHolding, deleteDocument: deleteHolding } = useFirestore('holdings');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [marketData, setMarketData] = useState(null);

  const portfolio = portfolioData?.[0] || null;
  const userHoldings = holdings?.filter(holding => holding.userId === user?.uid) || [];

  // Update portfolio when holdings change
  useEffect(() => {
    if (userHoldings.length > 0) {
      updatePortfolioMetrics();
    }
  }, [userHoldings]);

  // Fetch market data for portfolio holdings
  useEffect(() => {
    if (userHoldings.length > 0) {
      fetchMarketData();
    }
  }, [userHoldings]);

  const fetchMarketData = async () => {
    try {
      const symbols = userHoldings.map(holding => holding.symbol);
      const data = await getPortfolioMarketData(symbols);
      setMarketData(data);
    } catch (err) {
      console.error('Error fetching market data:', err);
    }
  };

  const updatePortfolioMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate performance metrics
      const performanceMetrics = calculatePerformanceMetrics(userHoldings, marketData);
      
      // Track performance over time
      const performanceData = trackPortfolioPerformance(userHoldings, portfolio?.historicalData || []);
      
      // Analyze diversification
      const diversificationAnalysis = analyzeDiversification(userHoldings);
      
      // Update portfolio document
      const updatedPortfolio = {
        ...portfolio,
        totalValue: performanceMetrics.totalValue,
        totalCostBasis: performanceMetrics.totalCostBasis,
        totalGainLoss: performanceMetrics.totalGainLoss,
        totalGainLossPercentage: performanceMetrics.totalGainLossPercentage,
        sectorAllocation: performanceMetrics.sectorAllocation,
        assetTypeAllocation: performanceMetrics.assetTypeAllocation,
        portfolioBeta: performanceMetrics.portfolioBeta,
        sharpeRatio: performanceMetrics.sharpeRatio,
        volatility: performanceMetrics.volatility,
        diversificationScore: performanceMetrics.diversificationScore,
        historicalData: performanceData.historicalData,
        performanceMetrics: performanceData.performanceMetrics,
        diversificationAnalysis,
        lastUpdated: new Date().toISOString()
      };

      if (portfolio) {
        await updateDocument(portfolio.id, updatedPortfolio);
      } else {
        await addDocument({
          ...updatedPortfolio,
          userId: user.uid,
          createdAt: new Date().toISOString()
        });
      }
      
    } catch (err) {
      setError(err.message);
      console.error('Error updating portfolio metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const addHoldingToPortfolio = async (holdingData) => {
    try {
      setLoading(true);
      setError(null);

      const newHolding = {
        ...holdingData,
        userId: user.uid,
        currentPrice: holdingData.purchasePrice, // Initial current price
        value: holdingData.shares * holdingData.purchasePrice,
        gainLoss: 0,
        gainLossPercentage: 0,
        createdAt: new Date().toISOString()
      };

      await addHolding(newHolding);
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateHoldingInPortfolio = async (holdingId, updates) => {
    try {
      setLoading(true);
      setError(null);

      await updateHolding(holdingId, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeHoldingFromPortfolio = async (holdingId) => {
    try {
      setLoading(true);
      setError(null);

      await deleteHolding(holdingId);
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getHoldingById = (holdingId) => {
    return userHoldings.find(holding => holding.id === holdingId);
  };

  const getHoldingsBySector = (sector) => {
    return userHoldings.filter(holding => holding.sector === sector);
  };

  const getHoldingsByAssetType = (assetType) => {
    return userHoldings.filter(holding => holding.assetType === assetType);
  };

  const getTopPerformers = (limit = 5) => {
    return userHoldings
      .sort((a, b) => b.gainLossPercentage - a.gainLossPercentage)
      .slice(0, limit);
  };

  const getWorstPerformers = (limit = 5) => {
    return userHoldings
      .sort((a, b) => a.gainLossPercentage - b.gainLossPercentage)
      .slice(0, limit);
  };

  const getLargestHoldings = (limit = 5) => {
    return userHoldings
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  };

  const refreshPortfolioData = async () => {
    await fetchMarketData();
    await updatePortfolioMetrics();
  };

  return {
    portfolio: {
      ...portfolio,
      holdings: userHoldings
    },
    holdings: userHoldings,
    marketData,
    loading,
    error,
    addHoldingToPortfolio,
    updateHoldingInPortfolio,
    removeHoldingFromPortfolio,
    getHoldingById,
    getHoldingsBySector,
    getHoldingsByAssetType,
    getTopPerformers,
    getWorstPerformers,
    getLargestHoldings,
    refreshPortfolioData,
    updatePortfolioMetrics
  };
};
