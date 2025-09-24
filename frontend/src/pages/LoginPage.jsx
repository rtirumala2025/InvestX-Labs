import React from 'react';
import { motion } from 'framer-motion';
import Card from '../components/ui/Card';
import LoginForm from '../components/auth/LoginForm';

const LoginPage = () => {
  return (
    <div className="relative min-h-[80vh] bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200 overflow-hidden flex items-center justify-center px-4 py-16">
      {/* Floating gradient orbs */}
      <motion.div
        className="absolute -top-32 -left-24 w-72 h-72 bg-accent-200 rounded-full blur-3xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 0.25, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute -bottom-32 -right-24 w-80 h-80 bg-accent-400 rounded-full blur-3xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 0.2, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
      />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative z-10">
        <Card className="p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-accent-500 to-accent-700">Welcome back</h1>
            <p className="text-neutral-600 mt-2">Sign in to continue</p>
          </div>
          <LoginForm />
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;
