import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import WelcomeStep from './WelcomeStep';
import ProfileStep from './ProfileStep';
import InterestsStep from './InterestsStep';
import RiskToleranceQuiz from './RiskToleranceQuiz';
import LoadingSpinner from '../common/LoadingSpinner';
import { supabase } from '../../services/supabase/config';
import { useAuth } from '../../hooks/useAuth';
import { useAchievements } from '../../contexts/AchievementsContext';

const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const { addAchievement } = useAchievements();
  const navigate = useNavigate();
  const { queueToast } = useApp();

  const steps = useMemo(() => [
    { component: WelcomeStep, title: 'Welcome' },
    { component: ProfileStep, title: 'Profile' },
    { component: InterestsStep, title: 'Interests' },
    { component: RiskToleranceQuiz, title: 'Risk Assessment' }
  ], []);

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
    if (!currentUser?.id) {
      queueToast('Please sign in to complete onboarding.', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const profilePayload = {
        id: currentUser.id,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
        ...userData,
      };

      const { error: upsertError } = await supabase
        .from('user_profiles')
        .upsert(profilePayload, { onConflict: 'id' });

      if (upsertError) {
        throw upsertError;
      }

      queueToast('Onboarding complete! Welcome to InvestX Labs.', 'success');

      await addAchievement(
        'onboarding_complete',
        {
          description: 'Completed the InvestX onboarding journey',
          profile: userData,
        },
        { xpReward: 150, allowDuplicates: false }
      );

      navigate('/dashboard');
    } catch (submissionError) {
      console.error('Error saving onboarding data:', submissionError);
      const message = submissionError?.message || 'Unable to save onboarding data. Please try again.';
      setError(message);
      queueToast(message, 'error');
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
          {error && (
            <div className="mb-4 p-4 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm">
              ⚠️ {error}
            </div>
          )}
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
