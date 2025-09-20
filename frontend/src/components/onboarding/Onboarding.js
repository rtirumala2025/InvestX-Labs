import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../common/LoadingSpinner';

const Onboarding = () => {
  const navigate = useNavigate();
  const { updateUserProfile } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    age: '',
    monthlyAllowance: '',
    interests: [],
    riskTolerance: '',
    investmentGoals: [],
    experienceLevel: 'beginner'
  });

  const totalSteps = 4;

  // Investment interests options
  const interestOptions = [
    { id: 'technology', label: 'Technology', emoji: '💻' },
    { id: 'gaming', label: 'Gaming', emoji: '🎮' },
    { id: 'renewable-energy', label: 'Renewable Energy', emoji: '🌱' },
    { id: 'healthcare', label: 'Healthcare', emoji: '🏥' },
    { id: 'entertainment', label: 'Entertainment', emoji: '🎬' },
    { id: 'sports', label: 'Sports', emoji: '⚽' },
    { id: 'fashion', label: 'Fashion', emoji: '👕' },
    { id: 'food', label: 'Food & Beverage', emoji: '🍕' },
    { id: 'transportation', label: 'Transportation', emoji: '🚗' },
    { id: 'finance', label: 'Finance', emoji: '💰' }
  ];

  // Risk tolerance options with explanations
  const riskToleranceOptions = [
    {
      id: 'conservative',
      label: 'Conservative',
      emoji: '🛡️',
      description: 'I prefer safe investments with steady, predictable returns. I\'m okay with lower growth if it means less risk.',
      color: 'bg-green-50 border-green-200 text-green-800'
    },
    {
      id: 'moderate',
      label: 'Moderate',
      emoji: '⚖️',
      description: 'I want a balance between growth and safety. I can handle some ups and downs for better long-term returns.',
      color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
    },
    {
      id: 'aggressive',
      label: 'Aggressive',
      emoji: '🚀',
      description: 'I\'m comfortable with higher risk for potentially higher rewards. I can handle significant market fluctuations.',
      color: 'bg-red-50 border-red-200 text-red-800'
    }
  ];

  // Investment goals options
  const goalOptions = [
    { id: 'college', label: 'Save for College', emoji: '🎓' },
    { id: 'car', label: 'Buy a Car', emoji: '🚗' },
    { id: 'travel', label: 'Travel & Experiences', emoji: '✈️' },
    { id: 'wealth', label: 'Build Long-term Wealth', emoji: '💎' },
    { id: 'learn', label: 'Learn About Investing', emoji: '📚' },
    { id: 'emergency', label: 'Emergency Fund', emoji: '🆘' },
    { id: 'business', label: 'Start a Business', emoji: '🏢' },
    { id: 'house', label: 'Save for a House', emoji: '🏠' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleInterestToggle = (interestId) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }));
  };

  const handleGoalToggle = (goalId) => {
    setFormData(prev => ({
      ...prev,
      investmentGoals: prev.investmentGoals.includes(goalId)
        ? prev.investmentGoals.filter(id => id !== goalId)
        : [...prev.investmentGoals, goalId]
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.age || formData.age < 13 || formData.age > 19) {
          setError('Please enter a valid age between 13 and 19');
          return false;
        }
        if (!formData.monthlyAllowance || formData.monthlyAllowance < 0) {
          setError('Please enter a valid monthly allowance amount');
          return false;
        }
        return true;
      case 2:
        if (formData.interests.length === 0) {
          setError('Please select at least one interest');
          return false;
        }
        return true;
      case 3:
        if (!formData.riskTolerance) {
          setError('Please select your risk tolerance');
          return false;
        }
        return true;
      case 4:
        if (formData.investmentGoals.length === 0) {
          setError('Please select at least one investment goal');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    setError('');

    try {
      const profileData = {
        profile: {
          age: parseInt(formData.age),
          monthlyAllowance: parseFloat(formData.monthlyAllowance),
          interests: formData.interests,
          riskTolerance: formData.riskTolerance,
          investmentGoals: formData.investmentGoals,
          experienceLevel: formData.experienceLevel
        },
        profileCompleted: true
      };

      await updateUserProfile(profileData);
      
      setSuccess(true);
      
      // Show success message for 2 seconds before redirecting
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
      <div 
        className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${(currentStep / totalSteps) * 100}%` }}
      ></div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us about yourself! 👋</h2>
        <p className="text-gray-600">This helps us personalize your investment experience</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How old are you? 🎂
          </label>
          <input
            type="number"
            min="13"
            max="19"
            value={formData.age}
            onChange={(e) => handleInputChange('age', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your age"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What's your monthly allowance/budget? 💰
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.monthlyAllowance}
              onChange={(e) => handleInputChange('monthlyAllowance', e.target.value)}
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">This helps us suggest appropriate investment amounts</p>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What interests you? 🎯</h2>
        <p className="text-gray-600">Select the industries you're curious about investing in</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {interestOptions.map((option) => (
          <label
            key={option.id}
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
              formData.interests.includes(option.id)
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="checkbox"
              checked={formData.interests.includes(option.id)}
              onChange={() => handleInterestToggle(option.id)}
              className="sr-only"
            />
            <span className="text-2xl mr-3">{option.emoji}</span>
            <span className="font-medium text-sm">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What's your risk style? 🎲</h2>
        <p className="text-gray-600">Choose the approach that feels right for you</p>
      </div>

      <div className="space-y-4">
        {riskToleranceOptions.map((option) => (
          <label
            key={option.id}
            className={`block p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
              formData.riskTolerance === option.id
                ? `${option.color} border-current`
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="riskTolerance"
              value={option.id}
              checked={formData.riskTolerance === option.id}
              onChange={(e) => handleInputChange('riskTolerance', e.target.value)}
              className="sr-only"
            />
            <div className="flex items-start">
              <span className="text-3xl mr-4">{option.emoji}</span>
              <div>
                <h3 className="font-bold text-lg mb-2">{option.label}</h3>
                <p className="text-sm opacity-80">{option.description}</p>
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What are your goals? 🎯</h2>
        <p className="text-gray-600">Select what you want to achieve with investing</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {goalOptions.map((option) => (
          <label
            key={option.id}
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
              formData.investmentGoals.includes(option.id)
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="checkbox"
              checked={formData.investmentGoals.includes(option.id)}
              onChange={() => handleGoalToggle(option.id)}
              className="sr-only"
            />
            <span className="text-2xl mr-3">{option.emoji}</span>
            <span className="font-medium text-sm">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return renderStep1();
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Complete!</h2>
            <p className="text-gray-600 mb-4">Your investment journey starts now!</p>
            <div className="flex justify-center">
              <LoadingSpinner size="small" />
            </div>
            <p className="text-sm text-gray-500 mt-2">Redirecting to your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Progress Bar */}
          {renderProgressBar()}

          {/* Step Indicator */}
          <div className="text-center mb-8">
            <span className="text-sm font-medium text-gray-500">
              Step {currentStep} of {totalSteps}
            </span>
          </div>

          {/* Current Step Content */}
          {renderCurrentStep()}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            {currentStep < totalSteps ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span className="ml-2">Saving...</span>
                  </>
                ) : (
                  'Complete Setup 🚀'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
