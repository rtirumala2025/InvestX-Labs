import React from 'react';

const Badges = () => {
  const badges = [
    { id: 1, name: 'First Investment', description: 'Added your first holding', earned: true, icon: '🎯' },
    { id: 2, name: 'Diversification Master', description: 'Diversified across 5+ sectors', earned: false, icon: '🎨' },
    { id: 3, name: 'Risk Taker', description: 'Completed risk assessment', earned: true, icon: '⚡' },
    { id: 4, name: 'Learning Champion', description: 'Completed 3 learning modules', earned: false, icon: '📚' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Achievement Badges</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {badges.map(badge => (
          <div key={badge.id} className={`bg-white rounded-lg shadow-sm border p-6 text-center ${badge.earned ? 'border-green-200' : 'border-gray-200 opacity-60'}`}>
            <div className="text-4xl mb-4">{badge.icon}</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{badge.name}</h3>
            <p className="text-gray-600 text-sm mb-4">{badge.description}</p>
            {badge.earned ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Earned
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Locked
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Badges;
