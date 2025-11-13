import React from 'react';
import FinancialTerm from '../education/FinancialTerm';
import { calculatePerformanceMetrics } from '../../services/portfolio/portfolioCalculations';

const PerformanceMetrics = ({ portfolio, liveMetrics, marketData }) => {
  console.log('📊 [PerformanceMetrics] Component rendered with props:');
  console.log('📊 [PerformanceMetrics]   Portfolio:', !!portfolio);
  console.log('📊 [PerformanceMetrics]   Live metrics:', !!liveMetrics);
  console.log('📊 [PerformanceMetrics]   Market data keys:', Object.keys(marketData || {}));
  
  const holdings = liveMetrics?.holdings || portfolio?.holdings || [];
  
  // Use live metrics if available, otherwise calculate from holdings
  const performanceData = React.useMemo(() => {
    console.log('📊 [PerformanceMetrics] Calculating performance data...');
    
    if (liveMetrics && Object.keys(liveMetrics).length > 0) {
      console.log('📊 [PerformanceMetrics] ✅ Using live metrics for performance data');
      // Enhance live metrics with calculated fields
      const staticMetrics = calculatePerformanceMetrics(holdings);
      const result = {
        ...liveMetrics,
        sharpeRatio: staticMetrics.sharpeRatio || 0,
        volatility: staticMetrics.volatility || 0,
        diversificationScore: staticMetrics.diversificationScore || 0,
        sectorAllocation: staticMetrics.sectorAllocation || {}
      };
      console.log('📊 [PerformanceMetrics] 📈 Live performance data:', {
        totalValue: result.totalValue,
        totalGainLoss: result.totalGainLoss,
        dayChange: result.dayChange,
        diversificationScore: result.diversificationScore
      });
      return result;
    }
    
    if (!holdings || holdings.length === 0) {
      console.log('📊 [PerformanceMetrics] ⚠️ Empty portfolio - showing zero performance data');
      return {
        totalValue: 0,
        totalCostBasis: 0,
        totalGainLoss: 0,
        totalGainLossPercentage: 0,
        dayChange: 0,
        dayChangePercentage: 0,
        sharpeRatio: 0,
        volatility: 0,
        diversificationScore: 0,
        sectorAllocation: {}
      };
    }
    
    console.log('📊 [PerformanceMetrics] 🔄 Using static calculations for performance data');
    const result = calculatePerformanceMetrics(holdings);
    console.log('📊 [PerformanceMetrics] 📈 Static performance data:', {
      totalValue: result.totalValue,
      totalGainLoss: result.totalGainLoss,
      diversificationScore: result.diversificationScore
    });
    return result;
  }, [liveMetrics, holdings]);
  
  // Create metrics array from real data
  const metrics = [
    {
      label: 'Total Return',
      value: `${performanceData.totalGainLossPercentage >= 0 ? '+' : ''}${performanceData.totalGainLossPercentage.toFixed(2)}%`,
      change: `${performanceData.totalGainLoss >= 0 ? '+' : ''}$${Math.abs(performanceData.totalGainLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      positive: performanceData.totalGainLoss >= 0,
      icon: '📈',
      description: 'All-time performance'
    },
    {
      label: 'Today\'s Change',
      value: `${(performanceData.dayChange || 0) >= 0 ? '+' : ''}$${Math.abs(performanceData.dayChange || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: `${(performanceData.dayChangePercentage || 0) >= 0 ? '+' : ''}${(performanceData.dayChangePercentage || 0).toFixed(2)}%`,
      positive: (performanceData.dayChange || 0) >= 0,
      icon: '📊',
      description: 'Change since yesterday'
    },
    {
      label: 'Sharpe Ratio',
      value: performanceData.sharpeRatio.toFixed(2),
      change: performanceData.sharpeRatio > 1 ? 'Excellent' : performanceData.sharpeRatio > 0.5 ? 'Good' : 'Fair',
      positive: performanceData.sharpeRatio > 0.5,
      icon: '⚖️',
      description: 'Risk-adjusted returns'
    },
    {
      label: 'Diversification',
      value: `${performanceData.diversificationScore}/100`,
      change: performanceData.diversificationScore > 70 ? 'Well diversified' : performanceData.diversificationScore > 40 ? 'Moderate' : 'Concentrated',
      positive: performanceData.diversificationScore > 40,
      icon: '🛡️',
      description: 'Portfolio diversification score'
    },
    {
      label: 'Volatility',
      value: `${(performanceData.volatility * 100).toFixed(1)}%`,
      change: performanceData.volatility < 0.15 ? 'Low risk' : performanceData.volatility < 0.25 ? 'Medium risk' : 'High risk',
      positive: performanceData.volatility < 0.2,
      icon: '📉',
      description: 'Price fluctuation estimate'
    },
    {
      label: 'Holdings Count',
      value: holdings.length.toString(),
      change: `${Object.keys(performanceData.sectorAllocation).length} sectors`,
      positive: holdings.length > 0,
      icon: '🎯',
      description: 'Number of positions'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.slice(0, 3).map((metric, index) => (
          <div key={index} className="relative group">
            <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl border border-white/20 p-6 backdrop-blur-lg hover:from-white/15 hover:to-white/10 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{metric.icon}</span>
                <div className={`px-2 py-1 rounded-full text-xs ${
                  metric.positive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                }`}>
                  {metric.change}
                </div>
              </div>
              <h3 className="text-sm font-medium text-white/70 mb-2">
                {metric.label === 'Diversification' ? (
                  <FinancialTerm term="diversification">{metric.label}</FinancialTerm>
                ) : metric.label === 'Total Return' ? (
                  <FinancialTerm term="return">{metric.label}</FinancialTerm>
                ) : metric.label === 'Volatility' ? (
                  <FinancialTerm term="volatility">{metric.label}</FinancialTerm>
                ) : (
                  metric.label
                )}
              </h3>
              <p className="text-2xl font-bold text-white mb-1">{metric.value}</p>
              <p className="text-xs text-white/60">{metric.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.slice(3).map((metric, index) => (
          <div key={index} className="relative group">
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-400/20 p-6 backdrop-blur-lg hover:from-blue-500/15 hover:to-purple-500/15 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{metric.icon}</span>
                <div className={`px-2 py-1 rounded-full text-xs ${
                  metric.positive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                }`}>
                  {metric.change}
                </div>
              </div>
              <h3 className="text-sm font-medium text-white/70 mb-2">
                {metric.label === 'Diversification' ? (
                  <FinancialTerm term="diversification">{metric.label}</FinancialTerm>
                ) : metric.label === 'Total Return' ? (
                  <FinancialTerm term="return">{metric.label}</FinancialTerm>
                ) : metric.label === 'Volatility' ? (
                  <FinancialTerm term="volatility">{metric.label}</FinancialTerm>
                ) : (
                  metric.label
                )}
              </h3>
              <p className="text-2xl font-bold text-white mb-1">{metric.value}</p>
              <p className="text-xs text-white/60">{metric.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Summary */}
      {holdings.length > 0 ? (
        <div className={`bg-gradient-to-r ${performanceData.totalGainLoss >= 0 ? 'from-green-500/10 to-emerald-500/10 border-green-400/20' : 'from-red-500/10 to-red-600/10 border-red-400/20'} rounded-xl border p-6 backdrop-blur-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Portfolio Health Score</h3>
              <p className={`${performanceData.totalGainLoss >= 0 ? 'text-green-300' : 'text-red-300'} text-sm`}>
                {performanceData.totalGainLoss >= 0 
                  ? 'Your portfolio is performing well with positive returns'
                  : 'Your portfolio is currently experiencing losses but stay focused on long-term goals'
                }
              </p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${performanceData.diversificationScore > 70 ? 'text-green-400' : performanceData.diversificationScore > 40 ? 'text-yellow-400' : 'text-red-400'} mb-1`}>
                {performanceData.diversificationScore > 70 ? 'A' : performanceData.diversificationScore > 40 ? 'B' : 'C'}
              </div>
              <div className={`text-sm ${performanceData.diversificationScore > 70 ? 'text-green-300' : performanceData.diversificationScore > 40 ? 'text-yellow-300' : 'text-red-300'}`}>
                {performanceData.diversificationScore}/100
              </div>
            </div>
          </div>
          <div className="mt-4 w-full bg-white/20 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ${performanceData.diversificationScore > 70 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : performanceData.diversificationScore > 40 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} 
              style={{ width: `${performanceData.diversificationScore}%` }}
            ></div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-400/20 p-6 backdrop-blur-lg">
          <div className="text-center">
            <div className="text-4xl mb-3">📈</div>
            <h3 className="text-lg font-semibold text-white mb-2">Ready to Start Investing?</h3>
            <p className="text-blue-300 text-sm mb-4">Add your first holding to see detailed performance metrics and portfolio analysis</p>
            <div className="text-2xl font-bold text-blue-400">0%</div>
            <div className="text-sm text-blue-300">Portfolio Performance</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMetrics;
