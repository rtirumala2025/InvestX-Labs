import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAISuggestions } from '../../hooks/useAISuggestions';
import LoadingSpinner from '../common/LoadingSpinner';

const SuggestionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { suggestions, loading } = useAISuggestions();

  const suggestion = suggestions?.find(s => s.id === id);

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  if (!suggestion) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Suggestion Not Found</h1>
          <p className="text-gray-600 mb-6">The suggestion you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/suggestions')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Suggestions
          </button>
        </div>
      </div>
    );
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600 bg-green-50';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/suggestions')}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Suggestions
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{suggestion.title}</h1>
            <p className="text-gray-600">AI Generated • {new Date(suggestion.createdAt).toLocaleDateString()}</p>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(suggestion.confidence)}`}>
            {suggestion.confidence}% Confidence
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Overview */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
            <p className="text-gray-700 leading-relaxed">{suggestion.description}</p>
          </div>

          {/* AI Analysis */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Analysis</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Reasoning</h3>
                <p className="text-gray-600">{suggestion.reasoning || 'Detailed reasoning not available.'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Market Factors</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  {suggestion.marketFactors?.map((factor, index) => (
                    <li key={index}>{factor}</li>
                  )) || ['Market factors analysis not available.']}
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Risk Assessment</h3>
                <p className="text-gray-600">{suggestion.riskAssessment || 'Risk assessment not available.'}</p>
              </div>
            </div>
          </div>

          {/* Expected Outcomes */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Expected Outcomes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Short-term (1-3 months)</h3>
                <p className="text-gray-600">{suggestion.shortTermOutlook || 'Short-term outlook not available.'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Long-term (6+ months)</h3>
                <p className="text-gray-600">{suggestion.longTermOutlook || 'Long-term outlook not available.'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Suggestion Type</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">{suggestion.type}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600">Expected Impact</p>
                <p className="text-lg font-semibold text-gray-900">{suggestion.expectedImpact}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600">Time Horizon</p>
                <p className="text-lg font-semibold text-gray-900">{suggestion.timeHorizon || 'N/A'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600">Risk Level</p>
                <p className="text-lg font-semibold text-gray-900">{suggestion.riskLevel || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Investment Details */}
          {suggestion.symbol && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Symbol</p>
                  <p className="text-lg font-semibold text-gray-900">{suggestion.symbol}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600">Company</p>
                  <p className="text-lg font-semibold text-gray-900">{suggestion.companyName}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Price</p>
                  <p className="text-lg font-semibold text-gray-900">${suggestion.currentPrice}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600">Price Change</p>
                  <p className={`text-lg font-semibold ${suggestion.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {suggestion.priceChange >= 0 ? '+' : ''}{suggestion.priceChange}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                Consider This Suggestion
              </button>
              
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                Add to Watchlist
              </button>
              
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                Learn More
              </button>
              
              <button className="w-full px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500">
                Dismiss Suggestion
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuggestionDetails;
