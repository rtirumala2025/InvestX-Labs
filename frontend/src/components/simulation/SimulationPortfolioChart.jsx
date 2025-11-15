import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import GlassCard from '../ui/GlassCard';

const SimulationPortfolioChart = ({ holdings, portfolioMetrics, marketData }) => {
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

  // Calculate allocation data
  const allocationData = holdings.map(holding => {
    const currentPrice = marketData?.[holding.symbol]?.price || holding.current_price || holding.purchase_price;
    const value = holding.shares * currentPrice;
    
    return {
      name: holding.symbol,
      value: value,
      shares: holding.shares
    };
  });

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  return (
    <GlassCard variant="floating" padding="large">
      <h3 className="text-xl font-semibold text-white mb-6">Portfolio Allocation</h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={allocationData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {allocationData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                background: 'rgba(0, 0, 0, 0.8)', 
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value) => `$${value.toFixed(2)}`}
            />
            <Legend 
              wrapperStyle={{ color: '#fff' }}
              formatter={(value, entry) => `${value}: ${entry.payload.shares.toFixed(2)} shares`}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
};

export default SimulationPortfolioChart;

