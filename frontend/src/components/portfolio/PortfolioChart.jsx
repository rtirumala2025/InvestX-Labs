import React from 'react';

const PortfolioChart = ({ portfolio }) => {
  // Mock chart data for demonstration
  const chartData = [
    { date: '1W ago', value: 23500 },
    { date: '6D ago', value: 24100 },
    { date: '5D ago', value: 23800 },
    { date: '4D ago', value: 24500 },
    { date: '3D ago', value: 24200 },
    { date: '2D ago', value: 24800 },
    { date: '1D ago', value: 24173 },
    { date: 'Today', value: 25420 }
  ];

  return (
    <div className="relative">
      {/* Chart Container */}
      <div className="relative h-80 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-orange-500/5 rounded-xl border border-white/10 backdrop-blur-sm overflow-hidden">
        {/* Grid Lines */}
        <div className="absolute inset-0 opacity-20">
          {/* Horizontal lines */}
          {[...Array(5)].map((_, i) => (
            <div 
              key={`h-${i}`}
              className="absolute w-full border-t border-white/20"
              style={{ top: `${(i + 1) * 16.66}%` }}
            />
          ))}
          {/* Vertical lines */}
          {[...Array(7)].map((_, i) => (
            <div 
              key={`v-${i}`}
              className="absolute h-full border-l border-white/20"
              style={{ left: `${(i + 1) * 12.5}%` }}
            />
          ))}
        </div>

        {/* Mock Chart Line */}
        <div className="absolute inset-4 flex items-end justify-between">
          {chartData.map((point, index) => (
            <div key={index} className="flex flex-col items-center group">
              {/* Data Point */}
              <div 
                className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mb-2 group-hover:scale-150 transition-transform duration-200 shadow-lg shadow-blue-500/50"
                style={{ 
                  marginBottom: `${((point.value - 23000) / 3000) * 200}px` 
                }}
              />
              {/* Tooltip on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -top-12 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                ${point.value.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Gradient Fill */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-500/20 via-purple-500/10 to-transparent rounded-b-xl" />

        {/* Center Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-pulse">📈</div>
            <p className="text-white/90 font-medium mb-2">Portfolio Growth Visualization</p>
            <p className="text-white/60 text-sm">Interactive chart coming soon</p>
            <div className="mt-4 flex items-center justify-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mr-2"></div>
                <span className="text-white/70">Portfolio Value</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mr-2"></div>
                <span className="text-white/70">Benchmark</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Indicator */}
        <div className="absolute top-4 right-4 bg-green-500/20 border border-green-400/30 rounded-lg px-3 py-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-300 text-sm font-medium">+5.16% Today</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioChart;
