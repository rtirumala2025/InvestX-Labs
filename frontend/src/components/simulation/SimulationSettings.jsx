import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSimulation } from '../../contexts/SimulationContext';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { Settings, RotateCcw, Trash2, AlertTriangle } from 'lucide-react';

const SimulationSettings = ({ className = '' }) => {
  const { resetSimulation, portfolio } = useSimulation();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetSimulation();
      setShowResetConfirm(false);
    } catch (error) {
      console.error('Reset error:', error);
    } finally {
      setResetting(false);
    }
  };

  return (
    <GlassCard variant="floating" padding="large" className={className}>
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5 text-white/60" />
        <h3 className="text-xl font-semibold text-white">Simulation Settings</h3>
      </div>

      <div className="space-y-4">
        {/* Portfolio Info */}
        <div className="bg-white/5 rounded-lg p-4">
          <p className="text-white/60 text-sm mb-2">Portfolio Name</p>
          <p className="text-white font-semibold">
            {portfolio?.name || 'Simulation Portfolio'}
          </p>
        </div>

        <div className="bg-white/5 rounded-lg p-4">
          <p className="text-white/60 text-sm mb-2">Starting Balance</p>
          <p className="text-white font-semibold">
            ${(portfolio?.starting_balance || 10000).toFixed(2)}
          </p>
        </div>

        {/* Reset Portfolio */}
        <div className="border-t border-white/10 pt-4">
          <p className="text-white/70 text-sm mb-3">
            Reset your simulation portfolio to start fresh with $10,000
          </p>
          <GlassButton
            variant="danger"
            size="medium"
            onClick={() => setShowResetConfirm(true)}
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Portfolio
          </GlassButton>
        </div>

        {/* Educational Notice */}
        <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-medium mb-1">Educational Simulation</p>
              <p className="text-white/70 text-sm">
                This is a learning environment using real market data but virtual money. 
                All trades are simulated and no real money is involved.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full mx-4"
          >
            <GlassCard variant="floating" padding="large">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Reset Simulation Portfolio?
                  </h3>
                  <p className="text-white/70 text-sm">
                    This will permanently delete all your holdings and transactions, 
                    and reset your balance to $10,000. This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <GlassButton
                  variant="secondary"
                  size="medium"
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1"
                  disabled={resetting}
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  variant="danger"
                  size="medium"
                  onClick={handleReset}
                  className="flex-1"
                  disabled={resetting}
                >
                  {resetting ? 'Resetting...' : 'Reset Portfolio'}
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </GlassCard>
  );
};

export default SimulationSettings;
