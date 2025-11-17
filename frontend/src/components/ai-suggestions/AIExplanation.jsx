import React, { useState } from "react";

const AIExplanation = ({ suggestion, onClose }) => {
  const [activeTab, setActiveTab] = useState("reasoning");

  const tabs = [
    { id: "reasoning", label: "Reasoning", icon: "🧠" },
    { id: "factors", label: "Market Factors", icon: "📊" },
    { id: "risks", label: "Risk Analysis", icon: "⚠️" },
    { id: "outlook", label: "Outlook", icon: "🔮" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "reasoning":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              AI Reasoning Process
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {suggestion.reasoning ||
                "Our AI analyzed your portfolio composition, risk tolerance, and current market conditions to generate this recommendation."}
            </p>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Key Considerations:
              </h4>
              <ul className="list-disc list-inside text-blue-800 space-y-1">
                <li>Your current portfolio diversification</li>
                <li>Risk tolerance assessment results</li>
                <li>Market volatility and trends</li>
                <li>Historical performance patterns</li>
                <li>Economic indicators and forecasts</li>
              </ul>
            </div>
          </div>
        );

      case "factors":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Market Factors Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">
                  Positive Factors
                </h4>
                <ul className="list-disc list-inside text-green-800 space-y-1">
                  {suggestion.positiveFactors?.map((factor, index) => (
                    <li key={index}>{factor}</li>
                  )) || [
                    "Strong earnings growth",
                    "Favorable market conditions",
                    "Low interest rates",
                    "Positive industry trends",
                  ]}
                </ul>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">Risk Factors</h4>
                <ul className="list-disc list-inside text-red-800 space-y-1">
                  {suggestion.riskFactors?.map((factor, index) => (
                    <li key={index}>{factor}</li>
                  )) || [
                    "Market volatility",
                    "Economic uncertainty",
                    "Regulatory changes",
                    "Competition pressure",
                  ]}
                </ul>
              </div>
            </div>
          </div>
        );

      case "risks":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Risk Assessment
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {suggestion.riskAssessment ||
                "This recommendation has been evaluated against your risk tolerance and portfolio objectives."}
            </p>

            <div className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">
                  Risk Level: {suggestion.riskLevel || "Medium"}
                </h4>
                <p className="text-yellow-800 text-sm">
                  Based on your risk tolerance profile and current market
                  conditions.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  Risk Mitigation Strategies
                </h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Diversification across sectors</li>
                  <li>Regular portfolio rebalancing</li>
                  <li>Stop-loss orders for protection</li>
                  <li>Gradual position building</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case "outlook":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Market Outlook
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Short-term (1-3 months)
                </h4>
                <p className="text-gray-700 text-sm">
                  {suggestion.shortTermOutlook ||
                    "Short-term outlook based on current market conditions and technical indicators."}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Long-term (6+ months)
                </h4>
                <p className="text-gray-700 text-sm">
                  {suggestion.longTermOutlook ||
                    "Long-term outlook considering fundamental analysis and growth prospects."}
                </p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Disclaimer</h4>
              <p className="text-blue-800 text-sm">
                All predictions and forecasts are based on historical data and
                current market analysis. Past performance does not guarantee
                future results. Always consider your own research and consult
                with a financial advisor before making investment decisions.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">AI Explanation</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {renderTabContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Close
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIExplanation;
