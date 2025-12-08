import React from 'react';
import { motion } from 'framer-motion';
import PortfolioTracker from '../components/portfolio/PortfolioTracker';

export default function PortfolioPage() {
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
        <PortfolioTracker />
      </main>
    </div>
  );
}