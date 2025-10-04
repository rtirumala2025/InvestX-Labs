import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from './GlassCard';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'default',
  className = '' 
}) => {
  const sizeClasses = {
    small: 'max-w-md',
    default: 'max-w-lg',
    large: 'max-w-2xl',
    xlarge: 'max-w-4xl'
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 50
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      transition: {
        duration: 0.2
      }
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
        >
          {/* Enhanced Glass Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl backdrop-saturate-150" />
          
          <motion.div
            className={`relative w-full ${sizeClasses[size]} ${className}`}
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()}
          >
            <GlassCard 
              variant="hero" 
              padding="none" 
              shadow="xl"
              className="overflow-hidden"
            >
              {title && (
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5 backdrop-blur-xl">
                  <h2 className="text-xl font-semibold text-white bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                    {title}
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 backdrop-blur-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              <div className="p-6 text-white">
                {children}
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
