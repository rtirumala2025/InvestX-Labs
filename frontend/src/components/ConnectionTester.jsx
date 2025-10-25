import React, { useState, useEffect } from 'react';
import { testConnection as testAIConnection } from '../services/api/aiService';
import { testConnection as testMarketConnection } from '../services/api/marketService';
import { testConnection as testMCPConnection } from '../services/api/mcpService';

const ConnectionTester = () => {
  const [testResults, setTestResults] = useState({
    ai: { loading: false, success: null, error: null },
    market: { loading: false, success: null, error: null },
    mcp: { loading: false, success: null, error: null },
  });
  const [overallStatus, setOverallStatus] = useState('idle');

  const testConnections = async () => {
    setTestResults({
      ai: { loading: true, success: null, error: null },
      market: { loading: true, success: null, error: null },
      mcp: { loading: true, success: null, error: null },
    });
    setOverallStatus('testing');

    try {
      // Test AI Service
      const aiResult = await testAIConnection();
      setTestResults(prev => ({
        ...prev,
        ai: { loading: false, success: aiResult.success, error: aiResult.error }
      }));

      // Test Market Service
      const marketResult = await testMarketConnection();
      setTestResults(prev => ({
        ...prev,
        market: { loading: false, success: marketResult.success, error: marketResult.error }
      }));

      // Test MCP Service
      const mcpResult = await testMCPConnection();
      setTestResults(prev => ({
        ...prev,
        mcp: { loading: false, success: mcpResult.success, error: mcpResult.error }
      }));

      // Check overall status
      const allSuccessful = [aiResult, marketResult, mcpResult].every(r => r.success);
      setOverallStatus(allSuccessful ? 'success' : 'partial');
    } catch (error) {
      console.error('Error testing connections:', error);
      setOverallStatus('error');
    }
  };

  // Run tests when component mounts
  useEffect(() => {
    testConnections();
  }, []);

  const getStatusColor = (status) => {
    if (status.loading) return 'bg-yellow-100 text-yellow-800';
    if (status.success) return 'bg-green-100 text-green-800';
    if (status.error) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    if (status.loading) return 'Testing...';
    if (status.success) return 'Connected';
    if (status.error) return `Error: ${status.error}`;
    return 'Not tested';
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Service Connection Status</h2>
      
      <div className="space-y-4">
        <div className="p-3 rounded">
          <div className="flex justify-between items-center">
            <span className="font-medium">AI Service:</span>
            <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(testResults.ai)}`}>
              {getStatusText(testResults.ai)}
            </span>
          </div>
          {testResults.ai.error && (
            <p className="mt-1 text-sm text-red-600">{testResults.ai.error}</p>
          )}
        </div>

        <div className="p-3 rounded">
          <div className="flex justify-between items-center">
            <span className="font-medium">Market Service:</span>
            <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(testResults.market)}`}>
              {getStatusText(testResults.market)}
            </span>
          </div>
          {testResults.market.error && (
            <p className="mt-1 text-sm text-red-600">{testResults.market.error}</p>
          )}
        </div>

        <div className="p-3 rounded">
          <div className="flex justify-between items-center">
            <span className="font-medium">MCP Service:</span>
            <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(testResults.mcp)}`}>
              {getStatusText(testResults.mcp)}
            </span>
          </div>
          {testResults.mcp.error && (
            <p className="mt-1 text-sm text-red-600">{testResults.mcp.error}</p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={testConnections}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
          disabled={overallStatus === 'testing'}
        >
          {overallStatus === 'testing' ? 'Testing...' : 'Test Connections Again'}
        </button>
      </div>

      {overallStatus === 'success' && (
        <div className="mt-4 p-3 bg-green-50 text-green-800 rounded-md">
          All services are connected successfully!
        </div>
      )}

      {overallStatus === 'partial' && (
        <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded-md">
          Some services are not connected. Please check the error messages above.
        </div>
      )}

      {overallStatus === 'error' && (
        <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-md">
          Failed to test connections. Please check the console for more details.
        </div>
      )}
    </div>
  );
};

export default ConnectionTester;
