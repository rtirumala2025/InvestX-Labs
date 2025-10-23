import React, { useState } from 'react';
import { useAIRecommendations } from '../../hooks/useAIRecommendations';

const AISuggestions = ({ onAction }) => {
  const [expandedSuggestion, setExpandedSuggestion] = useState(null);
  
  // Use the AI recommendations hook
  const { recommendations, loading, error, refresh } = useAIRecommendations();
  
  // Default suggestions if none are provided
  const defaultSuggestions = [
    {
      id: 1,
      type: 'buy',
      symbol: 'AAPL',
      company: 'Apple Inc.',
      confidence: 'high',
      reason: 'Strong earnings growth and market position',
      details: 'Apple has shown consistent revenue growth and has a strong product pipeline with the upcoming iPhone 15 and new services. The stock is currently trading at a reasonable valuation relative to its peers.',
      priceTarget: 195.00,
      currentPrice: 175.50,
      upside: 11.1
    },
    {
      id: 2,
      type: 'hold',
      symbol: 'MSFT',
      company: 'Microsoft Corporation',
      confidence: 'medium',
      reason: 'Stable performer in cloud computing',
      details: 'Microsoft continues to show strength in its cloud computing business with Azure. While growth is steady, current valuation appears fair relative to growth prospects.',
      priceTarget: 340.00,
      currentPrice: 315.25,
      upside: 7.9
    },
    {
      id: 3,
      type: 'sell',
      symbol: 'TSLA',
      company: 'Tesla, Inc.',
      confidence: 'low',
      reason: 'Valuation concerns and increasing competition',
      details: 'Tesla faces increasing competition in the EV market, and its current valuation appears stretched relative to traditional automakers and even other high-growth tech companies.',
      priceTarget: 150.00,
      currentPrice: 165.30,
      downside: 9.3
    }
  ];

  const displaySuggestions = recommendations?.length > 0 ? recommendations : defaultSuggestions;

  const getConfidenceBadge = (confidence) => {
    const confidenceMap = {
      high: { color: 'green', text: 'High' },
      medium: { color: 'yellow', text: 'Medium' },
      low: { color: 'red', text: 'Low' }
    };
    
    const { color, text } = confidenceMap[confidence] || { color: 'gray', text: 'Unknown' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800`}>
        {text} Confidence
      </span>
    );
  };

  const getActionButton = (suggestion) => {
    const baseClasses = 'px-3 py-1 text-sm font-medium rounded-md focus:outline-none';
    
    if (suggestion.type === 'buy') {
      return (
        <button 
          onClick={() => onAction && onAction('buy', suggestion)}
          className={`${baseClasses} bg-green-100 text-green-800 hover:bg-green-200`}
        >
          Buy {suggestion.symbol}
        </button>
      );
    } else if (suggestion.type === 'sell') {
      return (
        <button 
          onClick={() => onAction && onAction('sell', suggestion)}
          className={`${baseClasses} bg-red-100 text-red-800 hover:bg-red-200`}
        >
          Sell {suggestion.symbol}
        </button>
      );
    } else {
      return (
        <button 
          onClick={() => onAction && onAction('hold', suggestion)}
          className={`${baseClasses} bg-blue-100 text-blue-800 hover:bg-blue-200`}
        >
          Hold {suggestion.symbol}
        </button>
      );
    }
  };

  const toggleExpand = (id) => {
    setExpandedSuggestion(expandedSuggestion === id ? null : id);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">AI Investment Suggestions</h2>
          <button 
            onClick={refresh}
            className="text-sm text-blue-600 hover:text-blue-800"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">AI Investment Suggestions</h2>
          <button 
            onClick={refresh}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Retry
          </button>
        </div>
        <div className="text-center py-4 text-red-600">
          Failed to load suggestions. {error.message || 'Please try again later.'}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">AI Investment Suggestions</h2>
          <button 
            onClick={refresh}
            className="text-sm text-blue-600 hover:text-blue-800"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">Personalized recommendations based on your portfolio and market conditions</p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {displaySuggestions.map((suggestion) => (
          <div key={suggestion.id} className="p-4 hover:bg-gray-50 transition-colors duration-150">
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-lg ${
                  suggestion.type === 'buy' ? 'bg-green-100 text-green-600' :
                  suggestion.type === 'sell' ? 'bg-red-100 text-red-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {suggestion.type === 'buy' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  ) : suggestion.type === 'sell' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                    </svg>
                  )}
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-md font-medium text-gray-900">
                      {suggestion.symbol} - {suggestion.company}
                    </h3>
                    {getConfidenceBadge(suggestion.confidence)}
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">
                    {suggestion.reason}
                  </p>
                  
                  {expandedSuggestion === suggestion.id && (
                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      <p className="mb-2">{suggestion.details}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>Current Price: <span className="font-medium">${suggestion.currentPrice?.toFixed(2) || 'N/A'}</span></div>
                        <div>Target Price: <span className="font-medium">${suggestion.priceTarget?.toFixed(2) || 'N/A'}</span></div>
                        <div>Upside/Downside: <span className={suggestion.upside >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {suggestion.upside >= 0 ? `+${suggestion.upside.toFixed(1)}%` : `${suggestion.upside.toFixed(1)}%`}
                        </span></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-2 flex space-x-2">
                    {getActionButton(suggestion)}
                    <button 
                      onClick={() => toggleExpand(suggestion.id)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      {expandedSuggestion === suggestion.id ? 'Show Less' : 'Learn More'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className={`text-right ${suggestion.type === 'sell' ? 'text-red-600' : 'text-green-600'}`}>
                <div className="text-lg font-semibold">
                  {suggestion.type.toUpperCase()}
                </div>
                <div className="text-xs text-gray-500">
                  {suggestion.type === 'buy' ? 'Recommended' : 'Suggestion'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 bg-gray-50 text-center border-t">
        <p className="text-xs text-gray-500">
          AI suggestions are based on your risk profile and market conditions. Past performance is not indicative of future results.
        </p>
      </div>
    </div>
  );
};

export default AISuggestions;
