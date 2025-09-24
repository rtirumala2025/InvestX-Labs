import { renderHook, act } from '@testing-library/react';

// Mock auth hook to provide a user
jest.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'uid_123' } })
}));

// Mock market data functions used by the hook
jest.mock('../../src/services/market/marketData', () => ({
  getPortfolioMarketData: jest.fn(async () => ({ AAPL: { price: 150 } }))
}));

// Mock portfolio calculations to keep deterministic
jest.mock('../../src/services/portfolio/portfolioCalculations', () => ({
  calculatePerformanceMetrics: () => ({
    totalValue: 100,
    totalCostBasis: 80,
    totalGainLoss: 20,
    totalGainLossPercentage: 25,
    sectorAllocation: {},
    assetTypeAllocation: {},
    portfolioBeta: 1,
    sharpeRatio: 1,
    volatility: 1,
    diversificationScore: 50,
  })
}));

jest.mock('../../src/services/portfolio/performanceTracking', () => ({
  trackPortfolioPerformance: () => ({ historicalData: [], performanceMetrics: {} })
}));

jest.mock('../../src/services/portfolio/diversificationAnalysis', () => ({
  analyzeDiversification: () => ({})
}));

// Mock the firestore service used by useFirestore hook
const subscribers = new Map();
jest.mock('../../src/services/firebase/firestore', () => ({
  __esModule: true,
  subscribeToCollection: (collectionName, constraints, cb) => {
    subscribers.set(collectionName, cb);
    // initial empty emission
    setTimeout(() => cb([]), 0);
    return () => subscribers.delete(collectionName);
  },
  subscribeToDocument: (collectionName, docId, cb) => {
    const key = `${collectionName}/${docId}`;
    subscribers.set(key, cb);
    setTimeout(() => cb(null), 0);
    return () => subscribers.delete(key);
  },
  addDocument: jest.fn(async () => 'holding_1'),
  updateDocument: jest.fn(async () => {}),
  deleteDocument: jest.fn(async () => {}),
  getDocument: jest.fn(async () => ({ id: 'uid_123', name: 'User' })),
  getDocuments: jest.fn(async () => ([])),
}));

import * as firestoreSvc from '../../src/services/firebase/firestore';
import { usePortfolio } from '../../src/hooks/usePortfolio';

const emit = (collectionName, items) => {
  const cb = subscribers.get(collectionName);
  if (cb) cb(items);
};

describe('usePortfolio with users/{uid}/portfolio subcollection', () => {
  test('subscribes to user holdings subcollection and exposes holdings on portfolio', async () => {
    const { result, waitForNextUpdate } = renderHook(() => usePortfolio());

    // Wait for initial subscriptions
    await waitForNextUpdate();

    // Emit two holdings for the user subcollection
    await act(async () => {
      emit('users/uid_123/portfolio', [
        { id: 'h1', symbol: 'AAPL', shares: 1, purchasePrice: 100 },
        { id: 'h2', symbol: 'MSFT', shares: 2, purchasePrice: 200 },
      ]);
    });

    expect(result.current.holdings).toHaveLength(2);
    expect(result.current.portfolio.holdings).toHaveLength(2);
  });

  test('addHoldingToPortfolio writes via subcollection', async () => {
    const { result, waitForNextUpdate } = renderHook(() => usePortfolio());
    await waitForNextUpdate();

    await act(async () => {
      await result.current.addHoldingToPortfolio({ symbol: 'AAPL', shares: 1, purchasePrice: 100 });
    });

    expect(firestoreSvc.addDocument).toHaveBeenCalledWith('users/uid_123/portfolio', expect.any(Object));
  });
});
