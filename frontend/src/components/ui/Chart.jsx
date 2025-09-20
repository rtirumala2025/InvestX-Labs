import React from 'react';

const Chart = ({ 
  data, 
  type = 'line', 
  height = 300, 
  className = '' 
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div 
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{ height: `${height}px` }}
      >
        <p className="text-gray-500">
          {type.charAt(0).toUpperCase() + type.slice(1)} chart will be displayed here
        </p>
      </div>
    </div>
  );
};

export default Chart;
