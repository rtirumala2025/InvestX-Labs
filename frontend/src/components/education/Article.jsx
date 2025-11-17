import React from "react";

const Article = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <article className="bg-white rounded-lg shadow-sm border p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Understanding Portfolio Diversification
        </h1>
        <div className="text-gray-600 mb-6">
          <span>By InvestX Labs Team</span> •{" "}
          <span>Published on {new Date().toLocaleDateString()}</span>
        </div>
        <div className="prose max-w-none">
          <p className="text-lg text-gray-700 mb-6">
            Portfolio diversification is a fundamental principle of investing
            that helps reduce risk by spreading investments across different
            asset classes, sectors, and geographic regions.
          </p>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            What is Diversification?
          </h2>
          <p className="text-gray-700 mb-4">
            Diversification is the practice of spreading your investments across
            different assets to reduce the impact of any single investment's
            performance on your overall portfolio.
          </p>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Benefits of Diversification
          </h2>
          <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
            <li>Reduces overall portfolio risk</li>
            <li>Smooths out investment returns</li>
            <li>Provides exposure to different market opportunities</li>
            <li>Helps protect against market volatility</li>
          </ul>
        </div>
      </article>
    </div>
  );
};

export default Article;
