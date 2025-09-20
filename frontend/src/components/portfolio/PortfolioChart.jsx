import React from 'react';

const PortfolioChart = ({ portfolio }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Portfolio Performance</h2>
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">Portfolio performance chart will be displayed here</p>
      </div>
    </div>
  );
};

export default PortfolioChart;
