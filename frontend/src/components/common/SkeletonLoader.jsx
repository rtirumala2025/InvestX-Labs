import React from 'react';

// Task 19: Skeleton Loaders
export const SkeletonCard = ({ className = '' }) => (
  <div className={`animate-pulse bg-white/10 rounded-lg p-4 ${className}`}>
    <div className="h-4 bg-white/20 rounded w-3/4 mb-3"></div>
    <div className="h-3 bg-white/10 rounded w-full mb-2"></div>
    <div className="h-3 bg-white/10 rounded w-5/6"></div>
  </div>
);

export const SkeletonSuggestion = () => (
  <div className="animate-pulse bg-white/10 rounded-xl p-6 border border-white/10">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <div className="h-5 bg-white/20 rounded w-1/2 mb-3"></div>
        <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-white/10 rounded w-2/3"></div>
      </div>
      <div className="h-8 bg-white/20 rounded w-20"></div>
    </div>
    <div className="h-2 bg-white/10 rounded w-full mb-2"></div>
    <div className="h-2 bg-white/10 rounded w-4/5"></div>
  </div>
);

export const SkeletonHolding = () => (
  <div className="animate-pulse bg-white/10 rounded-xl p-6 border border-white/10">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4 flex-1">
        <div className="w-12 h-12 bg-white/20 rounded-xl"></div>
        <div className="flex-1">
          <div className="h-4 bg-white/20 rounded w-24 mb-2"></div>
          <div className="h-3 bg-white/10 rounded w-32"></div>
        </div>
      </div>
      <div className="text-right">
        <div className="h-5 bg-white/20 rounded w-20 mb-2"></div>
        <div className="h-4 bg-white/10 rounded w-16"></div>
      </div>
    </div>
  </div>
);

export const SkeletonGrid = ({ count = 3, Component = SkeletonCard }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <Component key={i} />
    ))}
  </div>
);

export default SkeletonCard;

