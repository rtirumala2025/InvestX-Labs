import React from 'react';
import { format } from 'date-fns';

const RecentActivity = ({ activities = [] }) => {
  // Default activities if none provided
  const defaultActivities = [
    {
      id: 1,
      type: 'buy',
      symbol: 'AAPL',
      shares: 5,
      price: 175.50,
      date: new Date('2023-05-15T10:30:00'),
      status: 'completed'
    },
    {
      id: 2,
      type: 'sell',
      symbol: 'MSFT',
      shares: 3,
      price: 315.25,
      date: new Date('2023-05-14T14:15:00'),
      status: 'completed'
    },
    {
      id: 3,
      type: 'dividend',
      symbol: 'VZ',
      amount: 42.50,
      date: new Date('2023-05-10T09:00:00'),
      status: 'completed'
    },
    {
      id: 4,
      type: 'buy',
      symbol: 'GOOGL',
      shares: 2,
      price: 112.75,
      date: new Date('2023-05-08T11:20:00'),
      status: 'completed'
    },
    {
      id: 5,
      type: 'sell',
      symbol: 'AMZN',
      shares: 1,
      price: 105.30,
      date: new Date('2023-05-05T13:45:00'),
      status: 'completed'
    }
  ];

  const displayActivities = activities.length > 0 ? activities : defaultActivities;

  const getActivityIcon = (type) => {
    switch (type) {
      case 'buy':
        return (
          <div className="p-2 rounded-full bg-green-100 text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'sell':
        return (
          <div className="p-2 rounded-full bg-red-100 text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'dividend':
        return (
          <div className="p-2 rounded-full bg-blue-100 text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.616 1.065 2.293 1.17V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.617-1.065-2.293-1.17V5z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="p-2 rounded-full bg-gray-100 text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  const getActivityDescription = (activity) => {
    switch (activity.type) {
      case 'buy':
        return `Bought ${activity.shares} ${activity.shares === 1 ? 'share' : 'shares'} of ${activity.symbol} at $${activity.price.toFixed(2)}`;
      case 'sell':
        return `Sold ${activity.shares} ${activity.shares === 1 ? 'share' : 'shares'} of ${activity.symbol} at $${activity.price.toFixed(2)}`;
      case 'dividend':
        return `Received $${activity.amount.toFixed(2)} dividend from ${activity.symbol}`;
      default:
        return 'Activity completed';
    }
  };

  const getAmount = (activity) => {
    if (activity.type === 'dividend') {
      return `+$${activity.amount.toFixed(2)}`;
    }
    const amount = activity.type === 'buy' 
      ? -activity.shares * activity.price 
      : activity.shares * activity.price;
    return `${amount >= 0 ? '+' : ''}$${amount.toFixed(2)}`;
  };

  const getAmountColor = (activity) => {
    if (activity.type === 'dividend') return 'text-green-600 font-medium';
    if (activity.type === 'buy') return 'text-red-600 font-medium';
    return 'text-green-600 font-medium';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {displayActivities.map((activity) => (
          <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {getActivityIcon(activity.type)}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {getActivityDescription(activity)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(activity.date), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
              <div className={`text-right ${getAmountColor(activity)}`}>
                <p className="text-sm">{getAmount(activity)}</p>
                <p className="text-xs">{activity.status}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 text-center border-t">
        <button className="text-sm font-medium text-blue-600 hover:text-blue-800">
          View All Activity
        </button>
      </div>
    </div>
  );
};

export default RecentActivity;
