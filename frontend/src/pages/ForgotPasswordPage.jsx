import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from '../services/supabase/auth';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';

/**
 * Forgot Password Page Component
 * 
 * Allows users to request a password reset email.
 * After submission, Supabase sends an email with a secure reset link.
 * The link redirects to /reset-password where the user can set a new password.
 */
const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const fadeIn = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  /**
   * Handle password reset email submission
   * Validates email and sends reset link via Supabase
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    // Basic email validation
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(email);
      setSuccess(true);
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-purple-300 to-orange-300">
                Reset Password
              </h1>
              <p className="text-gray-300">
                Enter your email and we'll send you a link to reset your password
              </p>
            </div>

            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <div className="p-6 rounded-xl bg-green-500/20 border border-green-500/30 backdrop-blur-sm">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-green-400"
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
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Check your email
                  </h3>
                  <p className="text-gray-300">
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>
                  <p className="text-gray-400 text-sm mt-4">
                    Click the link in the email to reset your password. The link will expire in 1 hour.
                  </p>
                </div>

                <div className="text-sm text-gray-400">
                  Didn't receive the email?{' '}
                  <button
                    onClick={() => setSuccess(false)}
                    className="text-blue-300 hover:text-blue-200 font-medium transition-colors"
                  >
                    Try again
                  </button>
                </div>

                <Link
                  to="/login"
                  className="inline-block text-blue-300 hover:text-blue-200 font-medium transition-colors"
                >
                  ← Back to login
                </Link>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 backdrop-blur-sm"
                  >
                    <p className="text-red-300 text-sm">{error}</p>
                  </motion.div>
                )}

                <GlassButton
                  type="submit"
                  disabled={loading}
                  variant="primary"
                  size="large"
                  className="w-full"
                  loading={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </GlassButton>

                <div className="text-center text-sm">
                  <Link to="/login" className="text-blue-300 hover:text-blue-200 transition-colors">
                    ← Back to login
                  </Link>
                </div>
              </form>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

