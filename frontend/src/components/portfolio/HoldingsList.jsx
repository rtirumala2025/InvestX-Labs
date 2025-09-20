import React from 'react';

const HoldingsList = ({ portfolio }) => {
  const holdings = portfolio?.holdings || [];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Holdings</h2>
      {holdings.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shares</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gain/Loss</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {holdings.map((holding, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{holding.symbol}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{holding.companyName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{holding.shares}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${holding.currentPrice}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${holding.value}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${holding.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {holding.gainLoss >= 0 ? '+' : ''}${holding.gainLoss}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No holdings found. Add your first investment to get started.</p>
        </div>
      )}
    </div>
  );
};

export default HoldingsList;
