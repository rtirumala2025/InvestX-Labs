import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../../contexts/AppContext';

const toastVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2, ease: 'easeIn' } },
};

const toneStyles = {
  success: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100 shadow-emerald-500/20',
  error: 'border-rose-400/40 bg-rose-500/15 text-rose-100 shadow-rose-500/20',
  warning: 'border-amber-400/40 bg-amber-500/15 text-amber-100 shadow-amber-500/20',
  info: 'border-sky-400/40 bg-sky-500/15 text-sky-100 shadow-sky-500/20',
};

const ToastViewport = () => {
  const { toastQueue, dismissToast } = useApp();

  useEffect(() => {
    const timers = toastQueue.map((toast) => {
      const now = Date.now();
      const elapsed = now - (toast.createdAt || now);
      const duration = toast.duration ?? 4000;
      const remaining = Math.max(duration - elapsed, 800);
      const timeout = setTimeout(() => dismissToast(toast.id), remaining);
      return timeout;
    });
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [toastQueue, dismissToast]);

  return (
    <div className="pointer-events-none fixed top-6 right-6 z-[9999] flex w-full max-w-sm flex-col gap-3 md:top-8 md:right-8">
      <AnimatePresence>
        {toastQueue.map((toast) => (
          <motion.div
            key={toast.id}
            variants={toastVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`pointer-events-auto overflow-hidden rounded-2xl border backdrop-blur-xl shadow-2xl ${toneStyles[toast.type] || toneStyles.info}`}
          >
            <div className="relative p-4">
              <p className="pr-10 text-sm leading-relaxed">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="absolute top-2 right-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/70 transition hover:bg-white/20 hover:text-white"
              >
                ×
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastViewport;

