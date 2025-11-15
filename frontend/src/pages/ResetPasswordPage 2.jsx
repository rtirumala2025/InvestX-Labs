import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { updatePassword } from '../services/supabase/auth';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';

/**
 * Reset Password Page Component
 * 
 * Allows users to set a new password after clicking the reset link from their email.
 * The Supabase auth session is automatically established from the URL parameters.
 * After successful password update, redirects user to login page.
 */
const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fadeIn = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  /**
   * Handle password update submission
   * Validates passwords match and updates via Supabase
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await updatePassword(password);
      
      // Show success message and redirect
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Password updated successfully! Please log in with your new password.' }
        });
      }, 2000);
    } catch (error) {
      console.error('Password update error:', error);
      setError(error.message || 'Failed to update password. Please try again or request a new reset link.');
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
                Set New Password
              </h1>
              <p className="text-gray-300">
                Choose a strong password for your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-2">
                  Must be at least 6 characters long
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                {loading ? 'Updating Password...' : 'Update Password'}
              </GlassButton>

              <div className="text-center">
                <p className="text-sm text-gray-400">
                  Remember your password?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-blue-300 hover:text-blue-200 font-medium transition-colors"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </form>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

