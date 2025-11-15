import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { resendVerificationEmail } from '../services/supabase/auth';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';

/**
 * Email Verification Page Component
 * 
 * Displays after user clicks email verification link from their inbox.
 * Shows verification status and allows resending verification email if needed.
 * Automatically detects verification from URL parameters set by Supabase.
 */
const VerifyEmailPage = () => {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const fadeIn = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  /**
   * Check if email is verified and redirect to onboarding if yes
   */
  useEffect(() => {
    if (currentUser && currentUser.email_confirmed_at) {
      // Email is verified, redirect to onboarding after short delay
      setTimeout(() => {
        navigate('/onboarding');
      }, 2000);
    }
  }, [currentUser, navigate]);

  /**
   * Handle resending verification email
   */
  const handleResendEmail = async () => {
    if (!currentUser?.email) {
      setError('No email address found. Please sign up again.');
      return;
    }

    setResending(true);
    setError('');
    setResent(false);

    try {
      await resendVerificationEmail(currentUser.email);
      setResent(true);
    } catch (err) {
      console.error('Resend verification error:', err);
      setError(err.message || 'Failed to resend verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // Check if email was just verified
  const isVerified = currentUser?.email_confirmed_at;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden font-sans">
      {/* Floating gradient orbs */}
      <motion.div
        className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-r from-blue-500/40 to-purple-500/30 rounded-full blur-3xl"
        animate={{ y: [0, 20, 0] }}
        transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-40 right-0 w-[28rem] h-[28rem] bg-gradient-to-r from-orange-400/30 to-pink-400/20 rounded-full blur-3xl"
        animate={{ y: [0, -30, 0] }}
        transition={{ repeat: Infinity, duration: 18, ease: 'easeInOut' }}
      />

      <div className="relative z-10 flex items-center justify-center min-h-screen px-6 py-12">
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          <GlassCard 
            variant="hero" 
            padding="xl" 
            shadow="xl" 
            className="max-w-md w-full"
          >
            <div className="text-center">
              {isVerified ? (
                // Email is verified
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  <div className="p-6 rounded-xl bg-green-500/20 border border-green-500/30 backdrop-blur-sm">
                    <svg
                      className="w-20 h-20 mx-auto mb-4 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h1 className="text-3xl font-bold mb-4 text-white">
                      Email Verified!
                    </h1>
                    <p className="text-gray-300">
                      Your email has been successfully verified.
                    </p>
                    <p className="text-gray-400 text-sm mt-4">
                      Redirecting to complete your profile...
                    </p>
                  </div>
                </motion.div>
              ) : (
                // Email not yet verified
                <div className="space-y-6">
                  <div className="mb-8">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <svg
                        className="w-10 h-10 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-purple-300 to-orange-300">
                      Verify Your Email
                    </h1>
                    <p className="text-gray-300">
                      We've sent a verification link to
                    </p>
                    <p className="text-white font-semibold mt-2">
                      {currentUser?.email || 'your email'}
                    </p>
                  </div>

                  <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm text-left">
                    <h3 className="font-semibold text-white mb-3">Next steps:</h3>
                    <ol className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start">
                        <span className="text-blue-400 mr-2">1.</span>
                        Check your email inbox (and spam folder)
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-400 mr-2">2.</span>
                        Click the verification link in the email
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-400 mr-2">3.</span>
                        You'll be automatically redirected to complete your profile
                      </li>
                    </ol>
                  </div>

                  {resent && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-green-500/20 border border-green-500/30 backdrop-blur-sm"
                    >
                      <p className="text-green-300 text-sm">
                        ✓ Verification email sent! Check your inbox.
                      </p>
                    </motion.div>
                  )}

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 backdrop-blur-sm"
                    >
                      <p className="text-red-300 text-sm">{error}</p>
                    </motion.div>
                  )}

                  <div className="space-y-4">
                    <p className="text-sm text-gray-400">
                      Didn't receive the email?
                    </p>
                    <GlassButton
                      onClick={handleResendEmail}
                      disabled={resending}
                      variant="glass"
                      size="large"
                      className="w-full"
                      loading={resending}
                    >
                      {resending ? 'Sending...' : 'Resend Verification Email'}
                    </GlassButton>
                  </div>

                  <div className="text-sm">
                    <button
                      onClick={() => navigate('/login')}
                      className="text-blue-300 hover:text-blue-200 transition-colors"
                    >
                      ← Back to login
                    </button>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;

