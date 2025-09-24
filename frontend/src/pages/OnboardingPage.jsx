import React from 'react';
import { motion } from 'framer-motion';
import Card from '../components/ui/Card';
import Onboarding from '../components/onboarding/Onboarding';

export default function OnboardingPage() {
  const fadeIn = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

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

        <motion.div variants={fadeIn} initial="hidden" animate="visible">
          <Card className="p-6 md:p-8">
            <Onboarding />
          </Card>
        </motion.div>
      </main>
    </div>
  );
}