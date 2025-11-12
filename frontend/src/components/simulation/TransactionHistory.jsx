import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../ui/GlassCard';

const TransactionHistory = ({ transactions }) => {
  if (!transactions || transactions.length === 0) {
    return (
      <GlassCard variant="floating" padding="large">
        <h3 className="text-xl font-semibold text-white mb-4">Transaction History</h3>
        <div className="text-center py-12">
          <p className="text-white/60 text-lg mb-2">No transactions yet</p>
          <p className="text-white/40 text-sm">Your trading history will appear here</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="floating" padding="large">
      <h3 className="text-xl font-semibold text-white mb-6">Transaction History</h3>
      
      <div className="space-y-3">
        {transactions.map((transaction, index) => (
          <motion.div
            key={transaction.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white/10 rounded-lg p-4 hover:bg-white/15 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  transaction.transaction_type === 'buy' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {transaction.transaction_type === 'buy' ? '↑' : '↓'}
                </div>
                <div>
                  <p className="text-white font-semibold">
                    {transaction.transaction_type === 'buy' ? 'Bought' : 'Sold'} {transaction.symbol}
                  </p>
                  <p className="text-white/60 text-sm">
                    {transaction.shares} shares @ ${transaction.price?.toFixed(2)}
                  </p>
                  <p className="text-white/40 text-xs">
                    {new Date(transaction.transaction_date).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${
                  transaction.transaction_type === 'buy' ? 'text-red-400' : 'text-green-400'
                }`}>
                  {transaction.transaction_type === 'buy' ? '-' : '+'}
                  ${Math.abs(transaction.total_amount).toFixed(2)}
                </p>
                {transaction.fees > 0 && (
                  <p className="text-white/40 text-xs">
                    Fee: ${transaction.fees.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
};

export default TransactionHistory;

