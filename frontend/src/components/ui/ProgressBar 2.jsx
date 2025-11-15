import React from 'react';
import { motion } from 'framer-motion';

const ProgressBar = ({ 
  progress, 
  label, 
  showLabel = true, 
  showPercentage = true,
  height = 'h-3',
  color = 'from-blue-400 via-green-400 to-orange-400',
  animated = true,
  className = ''
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      {showLabel && label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-white/80">{label}</span>
          {showPercentage && (
            <span className="text-sm text-white/70">{Math.round(clampedProgress)}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-white/20 rounded-full ${height} overflow-hidden`}>
        <motion.div
          className={`bg-gradient-to-r ${color} ${height} rounded-full transition-all duration-1000`}
          initial={animated ? { width: 0 } : undefined}
          animate={{ width: `${clampedProgress}%` }}
          transition={animated ? { duration: 1, ease: 'easeOut' } : undefined}
        />
      </div>
    </div>
  );
};

export default ProgressBar;

