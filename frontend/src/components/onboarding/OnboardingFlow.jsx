import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WelcomeStep from './WelcomeStep';
import ProfileStep from './ProfileStep';
import InterestsStep from './InterestsStep';
import RiskToleranceQuiz from './RiskToleranceQuiz';
import { useFirestore } from '../../hooks/useFirestore';
import LoadingSpinner from '../common/LoadingSpinner';

const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(false);
  const { addDocument } = useFirestore('users');
  const navigate = useNavigate();

  const steps = [
    { component: WelcomeStep, title: 'Welcome' },
    { component: ProfileStep, title: 'Profile' },
    { component: InterestsStep, title: 'Interests' },
    { component: RiskToleranceQuiz, title: 'Risk Assessment' }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Save user profile data to Firestore
      await addDocument({
        ...userData,
        onboardingCompleted: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving user data:', error);
      // Handle error - maybe show a toast or error message
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Setting up your account...</p>
        </div>
      </div>
    );
  }

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <CurrentStepComponent
            onNext={handleNext}
            onBack={handleBack}
            userData={userData}
            setUserData={setUserData}
          />
        </div>

        {/* Step Navigation */}
        <div className="mt-8 flex justify-between">
          <div className="flex space-x-2">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index === currentStep
                    ? 'bg-blue-600'
                    : index < currentStep
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
                title={step.title}
              />
            ))}
          </div>
          
          <div className="text-sm text-gray-500">
            {steps[currentStep].title}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
