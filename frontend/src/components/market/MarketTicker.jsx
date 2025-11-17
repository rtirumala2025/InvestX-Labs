import React from "react";
import { motion } from "framer-motion";
import { useMarketData } from "../../contexts/MarketContext";
import { ArrowUp, ArrowDown, RefreshCw } from "lucide-react";

const MarketTicker = () => {
  const { marketData, loading, error, lastUpdated, refresh } = useMarketData();

  // Format price with 2 decimal places
  const formatPrice = (price) => {
    return parseFloat(price).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Format percentage change with 2 decimal places
  const formatPercent = (percent) => {
    return `${parseFloat(percent).toFixed(2)}%`;
  };

  // Get color based on value (positive/negative)
  const getChangeColor = (value) => {
    if (value > 0) return "text-green-500";
    if (value < 0) return "text-red-500";
    return "text-gray-500";
  };

  // Get icon based on value
  const getChangeIcon = (value) => {
    if (value > 0) return <ArrowUp className="w-4 h-4 inline" />;
    if (value < 0) return <ArrowDown className="w-4 h-4 inline" />;
    return null;
  };

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        <p>Error loading market data: {error}</p>
        <button
          onClick={refresh}
          className="mt-2 text-sm bg-red-100 hover:bg-red-200 px-3 py-1 rounded flex items-center"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Retry
        </button>
      </div>
    );
  }

  if (loading && Object.keys(marketData).length === 0) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading market data...</span>
      </div>
    );
  }

  const symbols = Object.keys(marketData);

  if (symbols.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        No market data available. Try refreshing the page.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-medium text-gray-900">Market Watch</h3>
        <div className="flex items-center text-xs text-gray-500">
          {lastUpdated && (
            <span className="mr-2">
              Updated: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={refresh}
            className="text-blue-600 hover:text-blue-800 flex items-center"
            disabled={loading}
          >
            <RefreshCw
              className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Symbol
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Change
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                % Change
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {symbols.map((symbol) => {
              const data = marketData[symbol];
              const change = parseFloat(data.change || 0);
              const changePercent = parseFloat(data.changePercent || 0);

              return (
                <motion.tr
                  key={symbol}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                    {symbol}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {formatPrice(data.price || 0)}
                  </td>
                  <td
                    className={`px-4 py-3 whitespace-nowrap text-right ${getChangeColor(change)}`}
                  >
                    {getChangeIcon(change)}
                    {formatPrice(Math.abs(change))}
                  </td>
                  <td
                    className={`px-4 py-3 whitespace-nowrap text-right ${getChangeColor(changePercent)}`}
                  >
                    {getChangeIcon(changePercent)}
                    {formatPercent(Math.abs(changePercent))}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 text-right">
        Data provided by InvestX Labs
      </div>
    </div>
  );
};

export default MarketTicker;
