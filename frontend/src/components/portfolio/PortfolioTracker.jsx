import React from 'react';
import PortfolioChart from './PortfolioChart';
import HoldingsList from './HoldingsList';
import PerformanceMetrics from './PerformanceMetrics';
import AddHolding from './AddHolding';
import { usePortfolio } from '../../hooks/usePortfolio';
import LoadingSpinner from '../common/LoadingSpinner';

const PortfolioTracker = () => {
  const { portfolio, loading } = usePortfolio();

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Portfolio Tracker</h1>
        <p className="text-gray-600 mt-2">Monitor your investments and track performance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <PortfolioChart portfolio={portfolio} />
          <PerformanceMetrics portfolio={portfolio} />
          <HoldingsList portfolio={portfolio} />
        </div>
        
        <div className="space-y-8">
          <AddHolding />
        </div>
      </div>
    </div>
  );
};

export default PortfolioTracker;
