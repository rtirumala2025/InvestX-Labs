import React from "react";
import { useNavigate } from "react-router-dom";

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      id: "buy",
      title: "Buy",
      description: "Purchase stocks, ETFs, or other securities",
      icon: (
        <svg
          className="w-6 h-6 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      ),
      color: "bg-green-100",
      textColor: "text-green-600",
      hoverColor: "hover:bg-green-200",
      onClick: () => navigate("/trade/buy"),
    },
    {
      id: "sell",
      title: "Sell",
      description: "Sell your current holdings",
      icon: (
        <svg
          className="w-6 h-6 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 12H4"
          />
        </svg>
      ),
      color: "bg-red-100",
      textColor: "text-red-600",
      hoverColor: "hover:bg-red-200",
      onClick: () => navigate("/trade/sell"),
    },
    {
      id: "deposit",
      title: "Deposit",
      description: "Add funds to your account",
      icon: (
        <svg
          className="w-6 h-6 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      ),
      color: "bg-blue-100",
      textColor: "text-blue-600",
      hoverColor: "hover:bg-blue-200",
      onClick: () => navigate("/account/deposit"),
    },
    {
      id: "transfer",
      title: "Transfer",
      description: "Move money between accounts",
      icon: (
        <svg
          className="w-6 h-6 text-purple-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
      ),
      color: "bg-purple-100",
      textColor: "text-purple-600",
      hoverColor: "hover:bg-purple-200",
      onClick: () => navigate("/account/transfer"),
    },
    {
      id: "research",
      title: "Research",
      description: "Market research and analysis",
      icon: (
        <svg
          className="w-6 h-6 text-yellow-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      ),
      color: "bg-yellow-100",
      textColor: "text-yellow-600",
      hoverColor: "hover:bg-yellow-200",
      onClick: () => navigate("/research"),
    },
    {
      id: "learn",
      title: "Learn",
      description: "Educational resources",
      icon: (
        <svg
          className="w-6 h-6 text-indigo-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
      color: "bg-indigo-100",
      textColor: "text-indigo-600",
      hoverColor: "hover:bg-indigo-200",
      onClick: () => navigate("/learn"),
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <p className="text-sm text-gray-500 mt-1">
          Frequently used actions to manage your investments
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className={`flex items-start p-4 rounded-lg ${action.color} ${action.hoverColor} transition-colors duration-150 text-left`}
          >
            <div
              className={`p-2 rounded-lg ${action.color} ${action.textColor} mr-3`}
            >
              {action.icon}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{action.title}</h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
        <p className="text-sm text-gray-500">Need help with something else?</p>
        <button
          onClick={() => navigate("/support")}
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Contact Support
        </button>
      </div>
    </div>
  );
};

export default QuickActions;
