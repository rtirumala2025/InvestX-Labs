import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { motion } from 'framer-motion';
import WelcomeStep from './WelcomeStep';
import ProfileStep from './ProfileStep';
import InterestsStep from './InterestsStep';
import RiskToleranceQuiz from './RiskToleranceQuiz';
import DemoPortfolioStep from './DemoPortfolioStep';
import LoadingSpinner from '../common/LoadingSpinner';
import Celebration from '../ui/Celebration';
import ProgressBar from '../ui/ProgressBar';
import { supabase } from '../../services/supabase/config';
import { useAuth } from '../../hooks/useAuth';
import { useAchievements } from '../../contexts/AchievementsContext';

const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const { currentUser } = useAuth();
  const { addAchievement } = useAchievements();
  const navigate = useNavigate();
  const { queueToast } = useApp();

  const steps = useMemo(() => [
    { component: WelcomeStep, title: 'Welcome', icon: '👋' },
    { component: ProfileStep, title: 'Profile', icon: '👤' },
    { component: InterestsStep, title: 'Interests', icon: '🎯' },
    { component: RiskToleranceQuiz, title: 'Risk Assessment', icon: '⚖️' },
    { component: DemoPortfolioStep, title: 'Demo Portfolio', icon: '📊' }
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

      // Show celebration animation
      setShowCelebration(true);

      // Add achievement with celebration
      const achievementResult = await addAchievement(
        'onboarding_complete',
        {
          description: 'Completed the InvestX onboarding journey! 🎉',
          profile: userData,
        },
        { xpReward: 150, allowDuplicates: false }
      );

      if (achievementResult.success) {
        queueToast('Achievement unlocked: First Steps! 🎉', 'success');
      }

      // Navigate after celebration
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (submissionError) {
      console.error('Error saving onboarding data:', submissionError);
      const message = submissionError?.message || 'Unable to save onboarding data. Please try again.';
      setError(message);
      queueToast(message, 'error');
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

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <Celebration
        show={showCelebration}
        onComplete={() => setShowCelebration(false)}
        type="achievement"
        title="Onboarding Complete! 🎉"
        message="You've earned your first achievement badge!"
        icon="🏆"
        duration={3000}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{steps[currentStep]?.icon || '📝'}</span>
              <div>
                <span className="text-sm font-medium text-white/90">
                  Step {currentStep + 1} of {steps.length}: {steps[currentStep]?.title}
                </span>
                <span className="text-sm text-white/60 ml-2">
                  {Math.round(progress)}% Complete
                </span>
              </div>
            </div>
          </div>
          <ProgressBar
            progress={progress}
            height="h-3"
            color="from-blue-400 via-purple-400 to-pink-400"
            animated={true}
          />
        </motion.div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 rounded-lg border border-red-400/40 bg-red-500/15 text-red-200 text-sm"
            >
              ⚠️ {error}
            </motion.div>
          )}
          <CurrentStepComponent
            onNext={handleNext}
            onBack={handleBack}
            userData={userData}
            setUserData={setUserData}
          />
        </motion.div>

        {/* Enhanced Step Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <div className="flex space-x-2">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.2 }}
                className={`w-4 h-4 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-blue-500 scale-125'
                    : index < currentStep
                    ? 'bg-green-500'
                    : 'bg-white/30'
                }`}
                title={step.title}
              />
            ))}
          </div>
          
          <div className="text-sm text-white/70 flex items-center space-x-2">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/90 transition-all"
              >
                ← Back
              </button>
            )}
            {currentStep < steps.length - 1 && (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-all"
              >
                Next →
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
