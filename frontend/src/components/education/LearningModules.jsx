import React from "react";

const LearningModules = () => {
  const modules = [
    {
      id: 1,
      title: "Investment Basics",
      description: "Learn the fundamentals of investing",
      progress: 75,
    },
    {
      id: 2,
      title: "Portfolio Diversification",
      description: "Understand how to diversify your portfolio",
      progress: 50,
    },
    {
      id: 3,
      title: "Risk Management",
      description: "Learn about managing investment risks",
      progress: 25,
    },
    {
      id: 4,
      title: "Market Analysis",
      description: "How to analyze market trends",
      progress: 0,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Learning Modules
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <div
            key={module.id}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {module.title}
            </h3>
            <p className="text-gray-600 mb-4">{module.description}</p>
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{module.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${module.progress}%` }}
                ></div>
              </div>
            </div>
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
              {module.progress === 0 ? "Start Module" : "Continue"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LearningModules;
