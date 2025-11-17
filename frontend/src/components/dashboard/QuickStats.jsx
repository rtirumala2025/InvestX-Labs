import React from "react";
import { usePortfolio } from "../../hooks/usePortfolio";

const QuickStats = ({ portfolio }) => {
  const { totalValue, totalGainLoss, totalGainLossPercentage } =
    portfolio || {};

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const formatPercentage = (percentage) => {
    return `${(percentage || 0).toFixed(2)}%`;
  };

  const getGainLossColor = (value) => {
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getGainLossBgColor = (value) => {
    if (value > 0) return "bg-green-50";
    if (value < 0) return "bg-red-50";
    return "bg-gray-50";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Portfolio Value */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">
              Total Portfolio Value
            </p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatCurrency(totalValue)}
            </p>
          </div>
        </div>
      </div>

      {/* Total Gain/Loss */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                totalGainLoss >= 0 ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <svg
                className={`w-5 h-5 ${totalGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {totalGainLoss >= 0 ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 11l5-5m0 0l5 5m-5-5v12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 13l-5 5m0 0l-5-5m5 5V6"
                  />
                )}
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Gain/Loss</p>
            <p
              className={`text-2xl font-semibold ${getGainLossColor(totalGainLoss)}`}
            >
              {formatCurrency(totalGainLoss)}
            </p>
          </div>
        </div>
      </div>

      {/* Gain/Loss Percentage */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                totalGainLossPercentage >= 0 ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <svg
                className={`w-5 h-5 ${totalGainLossPercentage >= 0 ? "text-green-600" : "text-red-600"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Gain/Loss %</p>
            <p
              className={`text-2xl font-semibold ${getGainLossColor(totalGainLossPercentage)}`}
            >
              {formatPercentage(totalGainLossPercentage)}
            </p>
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Holdings</p>
            <p className="text-xl font-semibold text-gray-900">
              {portfolio?.holdings?.length || 0}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Diversification</p>
            <p className="text-xl font-semibold text-gray-900">
              {portfolio?.diversificationScore || "N/A"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Risk Score</p>
            <p className="text-xl font-semibold text-gray-900">
              {portfolio?.riskScore || "N/A"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Last Updated</p>
            <p className="text-sm text-gray-900">
              {portfolio?.lastUpdated
                ? new Date(portfolio.lastUpdated).toLocaleDateString()
                : "Never"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickStats;
