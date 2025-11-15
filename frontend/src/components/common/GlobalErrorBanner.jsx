import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassButton from '../ui/GlassButton';
import { useApp } from '../../contexts/AppContext';

const GlobalErrorBanner = () => {
  const { globalError, clearGlobalError, queueToast } = useApp();

  const handleRetry = async () => {
    if (globalError?.onRetry) {
      try {
        await globalError.onRetry();
        clearGlobalError();
        queueToast('Retry succeeded', 'success');
      } catch (retryError) {
        queueToast(retryError.message || 'Retry failed', 'error');
      }
    } else {
      window.location.reload();
    }
  };

  return (
    <AnimatePresence>
      {globalError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed top-0 left-0 right-0 z-50 px-3 py-3 sm:px-6"
        >
          <div className="max-w-4xl mx-auto backdrop-blur-xl bg-red-900/70 border border-red-500/30 rounded-2xl shadow-2xl px-5 py-4 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-red-200/80">
                  Global Error
                </h2>
                <p className="text-base font-medium text-white">
                  {globalError.message || 'Something went wrong.'}
                </p>
                {globalError.detail && (
                  <p className="text-sm text-red-200/80 mt-1">{globalError.detail}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <GlassButton variant="glass" size="small" onClick={handleRetry}>
                  Retry
                </GlassButton>
                <GlassButton variant="primary" size="small" onClick={clearGlobalError}>
                  Dismiss
                </GlassButton>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalErrorBanner;

