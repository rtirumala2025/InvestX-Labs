import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Card from '../components/ui/Card';
import Onboarding from '../components/onboarding/Onboarding';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';

// Task 28: Save/Resume functionality
const saveProgress = (currentStep, answers) => {
  try {
    localStorage.setItem('onboarding-progress', JSON.stringify({
      currentStep,
      answers,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Failed to save onboarding progress:', error);
  }
};

const loadProgress = () => {
  try {
    const saved = localStorage.getItem('onboarding-progress');
    if (saved) {
      const data = JSON.parse(saved);
      // Check if saved data is less than 24 hours old
      const age = Date.now() - (data.timestamp || 0);
      if (age < 24 * 60 * 60 * 1000) {
        return data;
      } else {
        localStorage.removeItem('onboarding-progress');
      }
    }
  } catch (error) {
    console.error('Failed to load onboarding progress:', error);
  }
  return null;
};

export default function OnboardingPage() {
  const [hasResumed, setHasResumed] = useState(false);
  const [savedProgress, setSavedProgress] = useState(null);

  const fadeIn = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  // Task 28: Load saved progress on mount
  useEffect(() => {
    const progress = loadProgress();
    if (progress) {
      setSavedProgress(progress);
    }
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">
      {/* Orbs */}
      <motion.div
        className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-r from-blue-500/40 to-purple-500/30 rounded-full blur-3xl"
        animate={{ y: [0, 18, 0] }}
        transition={{ repeat: Infinity, duration: 16, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-r from-orange-400/30 to-pink-400/20 rounded-full blur-3xl"
        animate={{ y: [0, -24, 0] }}
        transition={{ repeat: Infinity, duration: 20, ease: 'easeInOut' }}
      />

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-purple-300 to-orange-300">
            Get Started
          </h1>
          <p className="text-gray-300 mt-2">Complete your profile to personalize your experience</p>
        </motion.div>

        {/* Task 28: Resume prompt */}
        {savedProgress && !hasResumed && (
          <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mb-6">
            <GlassCard variant="accent" padding="large" glow>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Resume Onboarding</h3>
                  <p className="text-white/70 text-sm">
                    You have saved progress from {new Date(savedProgress.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-3">
                  <GlassButton
                    variant="glass"
                    onClick={() => {
                      localStorage.removeItem('onboarding-progress');
                      setSavedProgress(null);
                    }}
                  >
                    Start Fresh
                  </GlassButton>
                  <GlassButton
                    variant="primary"
                    onClick={() => setHasResumed(true)}
                  >
                    Resume
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        <motion.div variants={fadeIn} initial="hidden" animate="visible">
          <Card className="p-6 md:p-8">
            <Onboarding 
              savedProgress={hasResumed ? savedProgress : null}
              onProgressChange={(step, answers) => saveProgress(step, answers)}
            />
          </Card>
        </motion.div>
      </main>
    </div>
  );
}