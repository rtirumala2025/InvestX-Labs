import React, { useState } from 'react';
import SuggestionCard from './SuggestionCard';
import { useAISuggestions } from '../../hooks/useAISuggestions';
import LoadingSpinner from '../common/LoadingSpinner';

const SuggestionsList = () => {
  const { suggestions, loading, dismissSuggestion } = useAISuggestions();
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('confidence');

  const filterOptions = [
    { value: 'all', label: 'All Suggestions' },
    { value: 'buy', label: 'Buy Recommendations' },
    { value: 'sell', label: 'Sell Recommendations' },
    { value: 'hold', label: 'Hold Recommendations' },
    { value: 'diversify', label: 'Diversification' },
    { value: 'rebalance', label: 'Rebalancing' }
  ];

  const sortOptions = [
    { value: 'confidence', label: 'Confidence' },
    { value: 'date', label: 'Date' },
    { value: 'impact', label: 'Expected Impact' }
  ];

  const filteredSuggestions = suggestions?.filter(suggestion => 
    filter === 'all' || suggestion.type === filter
  ) || [];

  const sortedSuggestions = [...filteredSuggestions].sort((a, b) => {
    switch (sortBy) {
      case 'confidence':
        return b.confidence - a.confidence;
      case 'date':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'impact':
        return b.expectedImpact.localeCompare(a.expectedImpact);
      default:
        return 0;
    }
  });

  const handleViewDetails = (suggestionId) => {
    // Navigate to suggestion details page
    console.log('View details for suggestion:', suggestionId);
  };

  const handleDismiss = async (suggestionId) => {
    try {
      await dismissSuggestion(suggestionId);
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Investment Suggestions</h1>
        <p className="text-gray-600">
          Personalized recommendations based on your portfolio and market analysis
        </p>
      </div>

      {/* Filters and Sorting */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-wrap items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {filterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Suggestions Count */}
      <div className="mb-6">
        <p className="text-sm text-gray-600">
          Showing {sortedSuggestions.length} of {suggestions?.length || 0} suggestions
        </p>
      </div>

      {/* Suggestions Grid */}
      {sortedSuggestions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedSuggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onViewDetails={handleViewDetails}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No suggestions available</h3>
          <p className="text-gray-600 mb-4">
            {filter === 'all' 
              ? "We're analyzing your portfolio and market conditions to generate personalized suggestions."
              : `No ${filter} suggestions available at the moment.`
            }
          </p>
          <button className="text-blue-600 hover:text-blue-700 font-medium">
            Refresh Suggestions
          </button>
        </div>
      )}

      {/* Load More Button */}
      {sortedSuggestions.length > 0 && (
        <div className="text-center mt-8">
          <button className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Load More Suggestions
          </button>
        </div>
      )}
    </div>
  );
};

export default SuggestionsList;
