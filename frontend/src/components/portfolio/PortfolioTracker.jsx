import React, { useState } from 'react';
import PortfolioChart from './PortfolioChart';
import HoldingsList from './HoldingsList';
import PerformanceMetrics from './PerformanceMetrics';
import AddHolding from './AddHolding';
import { usePortfolio } from '../../hooks/usePortfolio';
import LoadingSpinner from '../common/LoadingSpinner';
import Card from '../ui/Card';
import Modal from '../ui/Modal';

const PortfolioTracker = () => {
  const { portfolio, loading } = usePortfolio();
  const [isAddOpen, setIsAddOpen] = useState(false);

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-accent-500 to-accent-700">Portfolio</h1>
        <p className="text-neutral-600 mt-2">Monitor your investments and track performance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-4">
            <PortfolioChart portfolio={portfolio} />
          </Card>
          <Card className="p-4">
            <PerformanceMetrics portfolio={portfolio} />
          </Card>
          <Card className="p-4">
            <HoldingsList portfolio={portfolio} />
          </Card>
        </div>
        
        <div className="space-y-8">
          <Card className="p-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Add Holding</h3>
              <p className="text-sm text-neutral-600">Record a new position in your simulated portfolio.</p>
            </div>
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent-500 to-accent-700 text-white font-medium hover:opacity-95 transition"
            >
              Add
            </button>
          </Card>
        </div>
      </div>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Holding" size="default">
        <AddHolding />
      </Modal>
    </div>
  );
};

export default PortfolioTracker;
