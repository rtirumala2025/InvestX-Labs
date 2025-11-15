import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Celebration = ({ 
  show, 
  onComplete, 
  type = 'achievement', 
  title = 'Achievement Unlocked!',
  message = 'Great job!',
  icon = '🎉',
  duration = 3000 
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

  const confettiVariants = {
    initial: { opacity: 0, scale: 0 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: 'spring', 
        stiffness: 200, 
        damping: 15 
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0,
      transition: { duration: 0.3 }
    }
  };

  const emojiVariants = {
    initial: { scale: 0, rotate: -180 },
    animate: { 
      scale: 1, 
      rotate: 0,
      transition: { 
        type: 'spring', 
        stiffness: 200, 
        damping: 15,
        delay: 0.1
      }
    },
    exit: { 
      scale: 0, 
      rotate: 180,
      transition: { duration: 0.3 }
    }
  };

  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1 + Math.random() * 0.5,
  }));

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[10000] pointer-events-none flex items-center justify-center">
          {/* Confetti particles */}
          <div className="absolute inset-0 overflow-hidden">
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  background: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][
                    particle.id % 5
                  ],
                }}
                initial={{ opacity: 0, y: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  y: [0, -100],
                  x: [0, (Math.random() - 0.5) * 100],
                  scale: [0, 1, 0],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>

          {/* Main celebration card */}
          <motion.div
            variants={confettiVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative bg-gradient-to-br from-blue-500/95 via-purple-500/95 to-pink-500/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border-2 border-white/30 max-w-md mx-4 pointer-events-auto"
          >
            <div className="text-center">
              <motion.div
                variants={emojiVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="text-8xl mb-4"
              >
                {icon}
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-white mb-2"
              >
                {title}
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-white/90 text-lg"
              >
                {message}
              </motion.p>

              {/* Sparkle effect */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  style={{
                    left: `${20 + i * 12}%`,
                    top: `${30 + (i % 2) * 40}%`,
                  }}
                  animate={{
                    scale: [0, 1.5, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Celebration;

