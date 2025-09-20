import React, { useState } from 'react';

const ProfileStep = ({ onNext, onBack, userData, setUserData }) => {
  const [formData, setFormData] = useState({
    age: userData.age || '',
    occupation: userData.occupation || '',
    annualIncome: userData.annualIncome || '',
    investmentExperience: userData.investmentExperience || '',
    investmentGoals: userData.investmentGoals || []
  });

  const incomeRanges = [
    'Under $25,000',
    '$25,000 - $50,000',
    '$50,000 - $75,000',
    '$75,000 - $100,000',
    '$100,000 - $150,000',
    '$150,000 - $200,000',
    'Over $200,000'
  ];

  const experienceLevels = [
    'Beginner (0-1 years)',
    'Novice (1-3 years)',
    'Intermediate (3-5 years)',
    'Advanced (5-10 years)',
    'Expert (10+ years)'
  ];

  const investmentGoals = [
    'Retirement Planning',
    'Wealth Building',
    'Education Fund',
    'Emergency Fund',
    'Home Purchase',
    'Travel & Lifestyle',
    'Business Investment',
    'Tax Optimization'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGoalToggle = (goal) => {
    setFormData({
      ...formData,
      investmentGoals: formData.investmentGoals.includes(goal)
        ? formData.investmentGoals.filter(g => g !== goal)
        : [...formData.investmentGoals, goal]
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setUserData({ ...userData, ...formData });
    onNext();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Tell us about yourself</h2>
        <p className="text-gray-600">This helps us personalize your investment experience</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
              Age
            </label>
            <input
              type="number"
              id="age"
              name="age"
              min="18"
              max="100"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.age}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-2">
              Occupation
            </label>
            <input
              type="text"
              id="occupation"
              name="occupation"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Software Engineer"
              value={formData.occupation}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label htmlFor="annualIncome" className="block text-sm font-medium text-gray-700 mb-2">
            Annual Income Range
          </label>
          <select
            id="annualIncome"
            name="annualIncome"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.annualIncome}
            onChange={handleChange}
          >
            <option value="">Select income range</option>
            {incomeRanges.map((range) => (
              <option key={range} value={range}>{range}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="investmentExperience" className="block text-sm font-medium text-gray-700 mb-2">
            Investment Experience
          </label>
          <select
            id="investmentExperience"
            name="investmentExperience"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.investmentExperience}
            onChange={handleChange}
          >
            <option value="">Select experience level</option>
            {experienceLevels.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Investment Goals (Select all that apply)
          </label>
          <div className="grid grid-cols-2 gap-3">
            {investmentGoals.map((goal) => (
              <label key={goal} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.investmentGoals.includes(goal)}
                  onChange={() => handleGoalToggle(goal)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{goal}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Back
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileStep;
