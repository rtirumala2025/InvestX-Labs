import React from 'react';
import { motion } from 'framer-motion';
import Card from '../components/ui/Card';
import SuggestionsList from '../components/ai-suggestions/SuggestionsList';

export default function SuggestionsPage() {
  const fadeIn = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">
      {/* Orbs */}
      <motion.div
        className="absolute -top-32 -left-28 w-80 h-80 bg-gradient-to-r from-blue-500/40 to-purple-500/30 rounded-full blur-3xl"
        animate={{ y: [0, 16, 0] }}
        transition={{ repeat: Infinity, duration: 14, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-36 -right-24 w-[24rem] h-[24rem] bg-gradient-to-r from-orange-400/30 to-pink-400/20 rounded-full blur-3xl"
        animate={{ y: [0, -22, 0] }}
        transition={{ repeat: Infinity, duration: 18, ease: 'easeInOut' }}
      />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-purple-300 to-orange-300">
            AI Investment Suggestions
          </h1>
          <p className="text-gray-300 mt-2">Personalized recommendations based on your portfolio and market analysis</p>
        </motion.div>

        <motion.div variants={fadeIn} initial="hidden" animate="visible">
          <Card className="p-4 md:p-6">
            <SuggestionsList />
          </Card>
        </motion.div>
      </main>
    </div>
  );
}