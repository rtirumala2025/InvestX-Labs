import React from 'react';

const SuggestionCard = ({ suggestion, onViewDetails, onDismiss }) => {
  const getSuggestionTypeColor = (type) => {
    switch (type) {
      case 'buy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'sell':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'diversify':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rebalance':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{suggestion.title}</h3>
            <p className="text-sm text-gray-500">AI Generated • {new Date(suggestion.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSuggestionTypeColor(suggestion.type)}`}>
            {suggestion.type.toUpperCase()}
          </span>
          <button
            onClick={() => onDismiss(suggestion.id)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <p className="text-gray-700 mb-4">{suggestion.description}</p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600">Confidence</p>
          <p className={`text-lg font-semibold ${getConfidenceColor(suggestion.confidence)}`}>
            {suggestion.confidence}%
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Expected Impact</p>
          <p className="text-lg font-semibold text-gray-900">{suggestion.expectedImpact}</p>
        </div>
      </div>

      {suggestion.symbol && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{suggestion.symbol}</p>
              <p className="text-sm text-gray-600">{suggestion.companyName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">${suggestion.currentPrice}</p>
              <p className={`text-sm ${suggestion.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {suggestion.priceChange >= 0 ? '+' : ''}{suggestion.priceChange}%
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onViewDetails(suggestion.id)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View Details
          </button>
          <button className="text-gray-600 hover:text-gray-700 text-sm font-medium">
            Learn More
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200">
            Not Interested
          </button>
          <button className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700">
            Consider
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuggestionCard;
