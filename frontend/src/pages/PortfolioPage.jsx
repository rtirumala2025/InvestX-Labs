import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PortfolioTracker from '../components/portfolio/PortfolioTracker';
import UploadCSV from '../components/portfolio/UploadCSV';
import GlassCard from '../components/ui/GlassCard';

export default function PortfolioPage() {
  const [showUploadSection, setShowUploadSection] = useState(false);
  
  const fadeIn = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ 
      background: 'var(--bg-base, #0a0f1a)',
      backgroundImage: 'var(--bg-gradient-primary), var(--bg-pattern-grid), var(--bg-pattern-noise)',
      backgroundSize: '100% 100%, 60px 60px, 400px 400px',
      backgroundAttachment: 'fixed'
    }}>
      {/* Orbs - Growth themed */}
      <motion.div
        className="absolute -top-32 -left-28 w-80 h-80 bg-gradient-to-r from-primary-500/40 to-primary-600/30 rounded-full blur-3xl"
        animate={{ y: [0, 16, 0] }}
        transition={{ repeat: Infinity, duration: 14, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-36 -right-24 w-[24rem] h-[24rem] bg-gradient-to-r from-accent-500/30 to-accent-600/20 rounded-full blur-3xl"
        animate={{ y: [0, -22, 0] }}
        transition={{ repeat: Infinity, duration: 18, ease: 'easeInOut' }}
      />

      <main className="relative z-10">
        <div className="w-full max-w-[1920px] mx-auto px-3 lg:px-4 xl:px-6 py-4 lg:py-6">
          {/* CSV Upload Section - Visible at top */}
          <motion.div 
            variants={fadeIn} 
            initial="hidden" 
            animate="visible"
            className="mb-6"
          >
            <GlassCard variant="default" padding="large" shadow="large">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-2">CSV Upload & Analysis</h2>
                  <p className="text-white/70 text-sm">
                    Upload your spending data or portfolio transactions to analyze patterns and get investment insights.
                  </p>
                </div>
                <button
                  onClick={() => setShowUploadSection(!showUploadSection)}
                  className={`px-4 py-2 text-sm rounded-lg transition-all ${
                    showUploadSection
                      ? 'bg-blue-500/30 text-white border border-blue-400/30'
                      : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
                  }`}
                >
                  {showUploadSection ? 'Hide Upload' : 'Show Upload'}
                </button>
              </div>
              
              {showUploadSection && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <UploadCSV 
                    mode="transactions"
                    onUploadComplete={(data) => {
                      console.log('CSV upload completed:', data);
                      setShowUploadSection(false);
                    }}
                  />
                </motion.div>
              )}
            </GlassCard>
          </motion.div>

          {/* Portfolio Tracker */}
          <PortfolioTracker />
        </div>
      </main>
    </div>
  );
}