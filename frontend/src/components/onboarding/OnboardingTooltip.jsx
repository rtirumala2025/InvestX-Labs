import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';

/**
 * OnboardingTooltip Component
 * 
 * A tooltip component designed for onboarding flows that provides
 * contextual help and guidance to users. Supports keyboard navigation
 * and screen readers.
 * 
 * Features:
 * - WCAG 2.1 AA compliant
 * - Keyboard navigation (Arrow keys, Escape)
 * - Screen reader support
 * - Multiple positioning options
 * - Dismissible with tracking
 */
const OnboardingTooltip = ({
  id,
  targetId,
  title,
  content,
  position = 'bottom',
  isVisible = false,
  onDismiss,
  onNext,
  onPrevious,
  stepNumber,
  totalSteps,
  showProgress = true,
  dismissible = true,
  className = '',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(isVisible);
  const tooltipRef = useRef(null);
  const targetElement = useRef(null);

  useEffect(() => {
    setIsOpen(isVisible);
  }, [isVisible]);

  useEffect(() => {
    if (isOpen && targetId) {
      targetElement.current = document.getElementById(targetId);
      if (targetElement.current) {
        // Scroll target into view if needed
        targetElement.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }
  }, [isOpen, targetId]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          if (dismissible && onDismiss) {
            onDismiss();
            setIsOpen(false);
          }
          break;
        case 'ArrowRight':
          if (onNext) {
            e.preventDefault();
            onNext();
          }
          break;
        case 'ArrowLeft':
          if (onPrevious) {
            e.preventDefault();
            onPrevious();
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, dismissible, onDismiss, onNext, onPrevious]);

  // Calculate position relative to target
  const getPositionStyles = () => {
    if (!targetElement.current || !tooltipRef.current) {
      return {};
    }

    const targetRect = targetElement.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    const positions = {
      top: {
        bottom: `${window.innerHeight - targetRect.top + scrollY + 10}px`,
        left: `${targetRect.left + scrollX + targetRect.width / 2}px`,
        transform: 'translateX(-50%)',
      },
      bottom: {
        top: `${targetRect.bottom + scrollY + 10}px`,
        left: `${targetRect.left + scrollX + targetRect.width / 2}px`,
        transform: 'translateX(-50%)',
      },
      left: {
        top: `${targetRect.top + scrollY + targetRect.height / 2}px`,
        right: `${window.innerWidth - targetRect.left + scrollX + 10}px`,
        transform: 'translateY(-50%)',
      },
      right: {
        top: `${targetRect.top + scrollY + targetRect.height / 2}px`,
        left: `${targetRect.right + scrollX + 10}px`,
        transform: 'translateY(-50%)',
      },
    };

    return positions[position] || positions.bottom;
  };

  const handleDismiss = () => {
    setIsOpen(false);
    if (onDismiss) {
      onDismiss(id);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={dismissible ? handleDismiss : undefined}
            aria-hidden="true"
          />

          {/* Tooltip */}
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed z-50 ${className}`}
            style={getPositionStyles()}
            role="dialog"
            aria-labelledby={title ? `tooltip-title-${id}` : undefined}
            aria-describedby={`tooltip-content-${id}`}
            aria-modal="false"
            {...props}
          >
            <GlassCard
              variant="hero"
              padding="large"
              shadow="xl"
              className="max-w-sm md:max-w-md"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  {title && (
                    <h3
                      id={`tooltip-title-${id}`}
                      className="text-lg font-semibold text-white mb-2"
                    >
                      {title}
                    </h3>
                  )}
                  {showProgress && stepNumber && totalSteps && (
                    <p className="text-sm text-white/70">
                      Step {stepNumber} of {totalSteps}
                    </p>
                  )}
                </div>
                {dismissible && (
                  <button
                    onClick={handleDismiss}
                    className="ml-4 p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    aria-label="Close tooltip"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Content */}
              <div
                id={`tooltip-content-${id}`}
                className="text-white/90 mb-4"
              >
                {typeof content === 'string' ? (
                  <p>{content}</p>
                ) : (
                  content
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-2">
                  {onPrevious && (
                    <GlassButton
                      variant="ghost"
                      size="small"
                      onClick={onPrevious}
                      aria-label="Previous step"
                    >
                      ← Previous
                    </GlassButton>
                  )}
                  {onNext && (
                    <GlassButton
                      variant="primary"
                      size="small"
                      onClick={onNext}
                      aria-label="Next step"
                    >
                      Next →
                    </GlassButton>
                  )}
                </div>
                {dismissible && !onNext && (
                  <GlassButton
                    variant="accent"
                    size="small"
                    onClick={handleDismiss}
                    aria-label="Got it"
                  >
                    Got it
                  </GlassButton>
                )}
              </div>

              {/* Keyboard hint */}
              <p className="mt-3 text-xs text-white/50">
                {onNext && 'Press → for next, '}
                {onPrevious && '← for previous, '}
                {dismissible && 'Esc to close'}
              </p>
            </GlassCard>

            {/* Arrow indicator pointing to target */}
            {targetElement.current && (
              <div
                className={`absolute w-0 h-0 border-8 ${
                  position === 'top'
                    ? 'top-full border-t-blue-500/20 border-l-transparent border-r-transparent border-b-transparent'
                    : position === 'bottom'
                    ? 'bottom-full border-b-blue-500/20 border-l-transparent border-r-transparent border-t-transparent'
                    : position === 'left'
                    ? 'left-full border-l-blue-500/20 border-t-transparent border-b-transparent border-r-transparent'
                    : 'right-full border-r-blue-500/20 border-t-transparent border-b-transparent border-l-transparent'
                }`}
                style={{
                  [position === 'top' ? 'top' : position === 'bottom' ? 'bottom' : position === 'left' ? 'left' : 'right']: '-8px',
                  [position === 'left' || position === 'right' ? 'top' : 'left']: '50%',
                  transform: position === 'left' || position === 'right' 
                    ? 'translateY(-50%)' 
                    : 'translateX(-50%)',
                }}
                aria-hidden="true"
              />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OnboardingTooltip;

