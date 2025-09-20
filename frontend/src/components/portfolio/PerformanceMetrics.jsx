import React from 'react';

const PerformanceMetrics = ({ portfolio }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Metrics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-600">Total Return</p>
          <p className="text-2xl font-semibold text-gray-900">{portfolio?.totalReturn || '0%'}</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-600">Annualized Return</p>
          <p className="text-2xl font-semibold text-gray-900">{portfolio?.annualizedReturn || '0%'}</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-600">Sharpe Ratio</p>
          <p className="text-2xl font-semibold text-gray-900">{portfolio?.sharpeRatio || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
