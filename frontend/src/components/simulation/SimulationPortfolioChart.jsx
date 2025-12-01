import React, { useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import { registerChartJS } from '../../utils/chartConfig';
import GlassCard from '../ui/GlassCard';

// Ensure Chart.js is registered
registerChartJS();

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const SimulationPortfolioChart = ({ holdings, portfolioMetrics, marketData }) => {
  // Calculate allocation data for Chart.js
  const chartData = useMemo(() => {
    if (!holdings || holdings.length === 0) {
      return {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 2,
        }],
        shares: [],
      };
    }
    const labels = holdings.map(holding => holding.symbol);
    const values = holdings.map(holding => {
      const currentPrice = marketData?.[holding.symbol]?.price || holding.current_price || holding.purchase_price;
      return holding.shares * currentPrice;
    });
    const shares = holdings.map(holding => holding.shares);

    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: COLORS.slice(0, holdings.length),
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 2,
        },
      ],
      shares, // Store shares for tooltip
    };
  }, [holdings, marketData]);

  const chartOptions = useMemo(() => {
    if (!holdings || holdings.length === 0) {
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
      };
    }
    
    return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: 'rgba(255, 255, 255, 0.9)',
          font: { size: 12 },
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const shares = data.shares?.[i] || 0;
                const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                const percent = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                return {
                  text: `${label}: ${shares.toFixed(2)} shares (${percent}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].borderColor,
                  lineWidth: data.datasets[0].borderWidth,
                  hidden: false,
                  index: i,
                };
              });
            }
            return [];
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const shares = chartData.shares?.[context.dataIndex] || 0;
            const total = chartData.datasets[0].data.reduce((a, b) => a + b, 0);
            const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return [
              `${label}: $${value.toFixed(2)}`,
              `Shares: ${shares.toFixed(2)}`,
              `Allocation: ${percent}%`,
            ];
          },
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
        padding: 12,
        cornerRadius: 8,
      },
    },
  };
  }, [chartData, holdings]);

  if (!holdings || holdings.length === 0) {
    return (
      <GlassCard variant="floating" padding="large">
        <h3 className="text-xl font-semibold text-white mb-4">Portfolio Allocation</h3>
        <div className="text-center py-12">
          <p className="text-white/60">No holdings to display</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="floating" padding="large">
      <h3 className="text-xl font-semibold text-white mb-6">Portfolio Allocation</h3>
      
      <div className="h-80">
        <Pie data={chartData} options={chartOptions} />
      </div>
    </GlassCard>
  );
};

export default SimulationPortfolioChart;

