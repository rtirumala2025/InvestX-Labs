import React, { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { registerChartJS } from '../../utils/chartConfig';
import { getPortfolioHistory } from '../../services/simulation/portfolioEngine';
import GlassCard from '../ui/GlassCard';
import { Calendar, TrendingUp } from 'lucide-react';

// Ensure Chart.js is registered
registerChartJS();

const PerformanceChart = ({ portfolioId, currentValue, className = '' }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30); // days

  useEffect(() => {
    if (!portfolioId) return;

    const loadHistory = async () => {
      setLoading(true);
      try {
        const result = await getPortfolioHistory(portfolioId, timeRange);
        if (result.success) {
          setHistory(result.data || []);
        }
      } catch (error) {
        console.error('Error loading portfolio history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [portfolioId, timeRange]);

  const chartData = useMemo(() => {
    if (!history || history.length === 0) {
      // If no history, create a single point with current value
      return {
        labels: [new Date().toLocaleDateString()],
        datasets: [{
          label: 'Portfolio Value',
          data: [currentValue || 10000],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }]
      };
    }

    // Sort by date
    const sortedHistory = [...history].sort((a, b) => 
      new Date(a.recorded_at) - new Date(b.recorded_at)
    );

    // Add current value as last point if available
    const dataPoints = sortedHistory.map(h => parseFloat(h.total_value || 0));
    const labels = sortedHistory.map(h => {
      const date = new Date(h.recorded_at);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    // Add current value if it's different from last point
    if (currentValue && dataPoints.length > 0) {
      const lastValue = dataPoints[dataPoints.length - 1];
      if (Math.abs(currentValue - lastValue) > 0.01) {
        dataPoints.push(currentValue);
        labels.push('Now');
      }
    }

    return {
      labels,
      datasets: [{
        label: 'Portfolio Value',
        data: dataPoints,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }]
    };
  }, [history, currentValue]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            return `$${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          display: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          maxTicksLimit: 8
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          callback: (value) => {
            return '$' + (value / 1000).toFixed(1) + 'k';
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  }), []);

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (!history || history.length === 0) {
      return {
        startValue: currentValue || 10000,
        endValue: currentValue || 10000,
        change: 0,
        changePercent: 0
      };
    }

    const sortedHistory = [...history].sort((a, b) => 
      new Date(a.recorded_at) - new Date(b.recorded_at)
    );

    const startValue = parseFloat(sortedHistory[0]?.total_value || currentValue || 10000);
    const endValue = currentValue || parseFloat(sortedHistory[sortedHistory.length - 1]?.total_value || 10000);
    const change = endValue - startValue;
    const changePercent = startValue > 0 ? (change / startValue) * 100 : 0;

    return {
      startValue,
      endValue,
      change,
      changePercent
    };
  }, [history, currentValue]);

  if (loading) {
    return (
      <GlassCard variant="floating" padding="large" className={className}>
        <div className="h-80 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="floating" padding="large" className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance Over Time
          </h3>
          <p className="text-white/60 text-sm">
            {timeRange === 7 ? 'Last 7 days' : 
             timeRange === 30 ? 'Last 30 days' : 
             timeRange === 90 ? 'Last 90 days' : 
             'All time'}
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90, 365].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                timeRange === days
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {days === 365 ? '1Y' : `${days}D`}
            </button>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <p className="text-white/60 text-sm mb-1">Start Value</p>
          <p className="text-white font-semibold">
            ${performanceMetrics.startValue.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-white/60 text-sm mb-1">Current Value</p>
          <p className="text-white font-semibold">
            ${performanceMetrics.endValue.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-white/60 text-sm mb-1">Change</p>
          <p className={`font-semibold ${
            performanceMetrics.change >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {performanceMetrics.change >= 0 ? '+' : ''}${performanceMetrics.change.toFixed(2)}
            <span className="text-sm ml-1">
              ({performanceMetrics.changePercent >= 0 ? '+' : ''}{performanceMetrics.changePercent.toFixed(2)}%)
            </span>
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <Line data={chartData} options={chartOptions} />
      </div>

      {history.length === 0 && (
        <div className="mt-4 text-center text-white/60 text-sm">
          <p>No historical data yet. Start trading to see your performance over time!</p>
        </div>
      )}
    </GlassCard>
  );
};

export default PerformanceChart;
