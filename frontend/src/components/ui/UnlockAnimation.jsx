import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const UnlockAnimation = ({ 
  show, 
  onComplete, 
  title = 'Unlocked!',
  icon = '🔓',
  duration = 2000 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onComplete) {
          setTimeout(onComplete, 500);
        }
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="fixed inset-0 z-[10000] pointer-events-none flex items-center justify-center"
        >
          <div className="relative">
            {/* Lock icon with unlock animation */}
            <motion.div
              initial={{ rotate: -45, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ 
                type: 'spring', 
                stiffness: 200, 
                damping: 15,
                delay: 0.1
              }}
              className="text-9xl mb-4"
            >
              {icon}
            </motion.div>

            {/* Ripple effect */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 border-4 border-green-400 rounded-full"
                initial={{ scale: 0.5, opacity: 0.8 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.2,
                  repeat: Infinity,
                }}
                style={{
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}

            {/* Title */}
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-white text-center"
            >
              {title}
            </motion.h3>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UnlockAnimation;

