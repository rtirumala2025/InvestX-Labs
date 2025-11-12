import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase/config';
import { useAchievements } from './AchievementsContext';
import {
  updateUserStats,
  getUserRank,
} from '../services/leaderboard/supabaseLeaderboardService';
import { useApp } from './AppContext';

const SimulationContext = createContext();

export function useSimulation() {
  return useContext(SimulationContext);
}

export function SimulationProvider({ children }) {
  const { currentUser } = useAuth();
  const { addAchievement } = useAchievements();
  const { queueToast, registerContext } = useApp();
  const [portfolio, setPortfolio] = useState(null);
  const [virtualBalance, setVirtualBalance] = useState(10000); // Starting balance
  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load simulation portfolio
   */
  const loadSimulationPortfolio = useCallback(async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    try {
      // Get or create simulation portfolio
      const { data: portfolios, error: portfolioError } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('is_simulation', true)
        .maybeSingle();

      if (portfolioError && portfolioError.code !== 'PGRST116') {
        throw portfolioError;
      }

      let simulationPortfolio = portfolios;

      // Create simulation portfolio if it doesn't exist
      if (!simulationPortfolio) {
        const { data: newPortfolio, error: createError } = await supabase
          .from('portfolios')
          .insert({
            user_id: currentUser.id,
            name: 'Simulation Portfolio',
            description: 'Practice trading with virtual money',
            is_simulation: true,
            virtual_balance: 10000,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) throw createError;
        simulationPortfolio = newPortfolio;

        // Award first simulation achievement
        await addAchievement('simulation_first_portfolio', {
          portfolioId: newPortfolio.id,
          description: 'Started your first simulation portfolio',
        }, { xpReward: 100, allowDuplicates: false });
      }

      setPortfolio(simulationPortfolio);
      setVirtualBalance(simulationPortfolio.virtual_balance || 10000);

      // Load holdings
      const { data: holdingsData, error: holdingsError } = await supabase
        .from('holdings')
        .select('*')
        .eq('portfolio_id', simulationPortfolio.id)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (holdingsError) throw holdingsError;
      setHoldings(holdingsData || []);

      // Load transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('portfolio_id', simulationPortfolio.id)
        .eq('user_id', currentUser.id)
        .order('transaction_date', { ascending: false })
        .limit(50);

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser, addAchievement]);

  /**
   * Update leaderboard
   */
  const updateLeaderboard = useCallback(async () => {
    if (!currentUser || !portfolio) return;

    try {
      const { data: holdingsData, error: holdingsError } = await supabase
        .from('holdings')
        .select('shares, current_price, purchase_price')
        .eq('user_id', currentUser.id)
        .eq('portfolio_id', portfolio.id);

      if (holdingsError) throw holdingsError;

      const holdingsValue = (holdingsData || []).reduce((sum, h) => {
        const price = h.current_price || h.purchase_price || 0;
        return sum + parseFloat(h.shares || 0) * price;
      }, 0);

      const netWorthValue = holdingsValue + (virtualBalance ?? 0);

      let previousNetWorth = 0;
      try {
        const { data: rankData } = await getUserRank(currentUser.id);
        previousNetWorth = Number(rankData?.net_worth || 0);
      } catch (rankError) {
        console.debug?.('Simulation leaderboard rank fetch failed', rankError);
      }

      const netWorthDelta = netWorthValue - previousNetWorth;

      if (Math.abs(netWorthDelta) > 0.5) {
        await updateUserStats(currentUser.id, 0, netWorthDelta);
      }
    } catch (err) {
      queueToast('Failed to sync leaderboard stats.', 'error');
    }
  }, [currentUser, portfolio, queueToast, virtualBalance]);

  /**
   * Buy stock
   */
  const buyStock = useCallback(async (symbol, shares, price) => {
    if (!currentUser || !portfolio) return { success: false, error: 'Not logged in or no portfolio' };

    const totalCost = shares * price;
    const fees = totalCost * 0.001; // 0.1% fee
    const totalWithFees = totalCost + fees;

    if (totalWithFees > virtualBalance) {
      return { success: false, error: 'Insufficient funds' };
    }

    setLoading(true);

    try {
      // Check if holding already exists
      const existingHolding = holdings.find(h => h.symbol === symbol);

      if (existingHolding) {
        // Update existing holding
        const newShares = parseFloat(existingHolding.shares) + parseFloat(shares);
        const newAvgPrice = ((existingHolding.shares * existingHolding.purchase_price) + (shares * price)) / newShares;

        const { error: updateError } = await supabase
          .from('holdings')
          .update({
            shares: newShares,
            purchase_price: newAvgPrice,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingHolding.id)
          .eq('user_id', currentUser.id);

        if (updateError) throw updateError;
      } else {
        // Create new holding
        const { error: insertError } = await supabase
          .from('holdings')
          .insert({
            portfolio_id: portfolio.id,
            user_id: currentUser.id,
            symbol,
            shares,
            purchase_price: price,
            purchase_date: new Date().toISOString().split('T')[0],
            current_price: price,
            asset_type: 'Stock'
          });

        if (insertError) throw insertError;
      }

      // Record transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: currentUser.id,
          portfolio_id: portfolio.id,
          transaction_type: 'buy',
          symbol,
          shares,
          price,
          total_amount: -totalWithFees,
          fees,
          transaction_date: new Date().toISOString()
        });

      if (transactionError) throw transactionError;

      const { error: logError } = await supabase
        .from('simulation_logs')
        .insert({
          user_id: currentUser.id,
          portfolio_id: portfolio.id,
          action: 'buy',
          symbol,
          shares,
          price,
          total_amount: -totalWithFees,
          fees,
          gain_loss: 0,
          created_at: new Date().toISOString(),
        });

      if (logError) {
        console.debug?.('Simulation log (buy) failed', logError);
      }

      // Update virtual balance
      const newBalance = virtualBalance - totalWithFees;
      const { error: balanceError } = await supabase
        .from('portfolios')
        .update({
          virtual_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', portfolio.id)
        .eq('user_id', currentUser.id);

      if (balanceError) throw balanceError;

      setVirtualBalance(newBalance);

      // Reload data
      await loadSimulationPortfolio();

      // Update leaderboard
      await updateLeaderboard();

      // Check for achievements
      await checkAchievements('buy', { symbol, shares, price });

      queueToast(`Successfully bought ${shares} shares of ${symbol.toUpperCase()}`, 'success');
      return { success: true };

    } catch (err) {
      queueToast(err.message || 'Failed to buy stock. Please try again.', 'error');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [currentUser, holdings, portfolio, queueToast, updateLeaderboard, virtualBalance, loadSimulationPortfolio]);

  /**
   * Sell stock
   */
  const sellStock = useCallback(async (symbol, shares, price) => {
    if (!currentUser || !portfolio) return { success: false, error: 'Not logged in or no portfolio' };

    const holding = holdings.find(h => h.symbol === symbol);
    if (!holding) {
      return { success: false, error: 'Stock not found in portfolio' };
    }

    if (parseFloat(holding.shares) < parseFloat(shares)) {
      return { success: false, error: 'Insufficient shares' };
    }

    setLoading(true);

    try {
      const totalProceeds = shares * price;
      const fees = totalProceeds * 0.001; // 0.1% fee
      const totalWithFees = totalProceeds - fees;

      // Update or remove holding
      const remainingShares = parseFloat(holding.shares) - parseFloat(shares);

      if (remainingShares <= 0.01) {
        // Delete holding
        const { error: deleteError } = await supabase
          .from('holdings')
          .delete()
          .eq('id', holding.id)
          .eq('user_id', currentUser.id);

        if (deleteError) throw deleteError;
      } else {
        // Update holding
        const { error: updateError } = await supabase
          .from('holdings')
          .update({
            shares: remainingShares,
            updated_at: new Date().toISOString()
          })
          .eq('id', holding.id)
          .eq('user_id', currentUser.id);

        if (updateError) throw updateError;
      }

      // Record transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: currentUser.id,
          portfolio_id: portfolio.id,
          transaction_type: 'sell',
          symbol,
          shares,
          price,
          total_amount: totalWithFees,
          fees,
          transaction_date: new Date().toISOString()
        });

      if (transactionError) throw transactionError;

      const gainLoss = (price - holding.purchase_price) * shares - fees;
      const { error: logError } = await supabase
        .from('simulation_logs')
        .insert({
          user_id: currentUser.id,
          portfolio_id: portfolio.id,
          action: 'sell',
          symbol,
          shares,
          price,
          total_amount: totalWithFees,
          fees,
          gain_loss: gainLoss,
          created_at: new Date().toISOString(),
        });

      if (logError) {
        console.debug?.('Simulation log (sell) failed', logError);
      }

      // Update virtual balance
      const newBalance = virtualBalance + totalWithFees;
      const { error: balanceError } = await supabase
        .from('portfolios')
        .update({
          virtual_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', portfolio.id)
        .eq('user_id', currentUser.id);

      if (balanceError) throw balanceError;

      setVirtualBalance(newBalance);

      // Reload data
      await loadSimulationPortfolio();

      // Update leaderboard
      await updateLeaderboard();

      if (gainLoss > 0) {
        const xpReward = Math.max(10, Math.round(gainLoss / 10));
        if (xpReward > 0) {
          await updateUserStats(currentUser.id, xpReward, 0);
        }
      }

      // Check for achievements
      await checkAchievements('sell', { symbol, shares, price, gainLoss });

      queueToast(`Successfully sold ${shares} shares of ${symbol.toUpperCase()}`, 'success');
      return { success: true };

    } catch (err) {
      queueToast(err.message || 'Failed to sell stock. Please try again.', 'error');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [currentUser, holdings, portfolio, queueToast, updateLeaderboard, virtualBalance, loadSimulationPortfolio]);

  /**
   * Check for achievements
   */
  const checkAchievements = async (action, data) => {
    if (!currentUser) return;

    try {
      const totalTrades = transactions.length + 1;

      if (totalTrades === 1) {
        await addAchievement(
          'simulation_first_trade',
          {
            symbol: data.symbol,
            description: 'Completed your first simulation trade',
          },
          { xpReward: 100, allowDuplicates: false }
        );
      }

      if (totalTrades === 10) {
        await addAchievement(
          'simulation_active_trader',
          {
            totalTrades,
            description: 'Completed 10 simulation trades',
          },
          { xpReward: 150, allowDuplicates: false }
        );
      }

      if (totalTrades === 50) {
        await addAchievement(
          'simulation_trading_expert',
          {
            totalTrades,
            description: 'Completed 50 simulation trades',
          },
          { xpReward: 250, allowDuplicates: false }
        );
      }

      if (action === 'sell' && data.gainLoss > 0) {
        await addAchievement(
          'simulation_profit_maker',
          {
            symbol: data.symbol,
            gainLoss: data.gainLoss,
            description: 'Logged a profitable simulation trade',
          },
          { xpReward: 0, allowDuplicates: true }
        );
      }

      const uniqueStocks = new Set(holdings.map((h) => h.symbol));
      if (uniqueStocks.size >= 5) {
        await addAchievement(
          'simulation_diversified_portfolio',
          {
            symbols: Array.from(uniqueStocks),
            description: 'Maintained a diversified simulation portfolio',
          },
          { xpReward: 200, allowDuplicates: false }
        );
      }
    } catch (err) {
      console.debug?.('Simulation achievement check failed', err);
    }
  };

  /**
   * Reset simulation
   */
  const resetSimulation = useCallback(async () => {
    if (!currentUser || !portfolio) return;

    setLoading(true);

    try {
      // Delete all holdings for this user's portfolio
      const { error: deleteError } = await supabase
        .from('holdings')
        .delete()
        .eq('portfolio_id', portfolio.id)
        .eq('user_id', currentUser.id);

      if (deleteError) throw deleteError;

      // Reset balance
      const { error: updateError } = await supabase
        .from('portfolios')
        .update({
          virtual_balance: 10000,
          updated_at: new Date().toISOString()
        })
        .eq('id', portfolio.id)
        .eq('user_id', currentUser.id);

      if (updateError) throw updateError;

      setVirtualBalance(10000);
      await loadSimulationPortfolio();
      
      // Update leaderboard after reset
      await updateLeaderboard();
      
      queueToast('Simulation reset successfully', 'success');

    } catch (err) {
      setError(err.message);
      queueToast(err.message || 'Failed to reset simulation. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentUser, portfolio, loadSimulationPortfolio, queueToast, updateLeaderboard]);

  // Load simulation portfolio on mount
  useEffect(() => {
    if (currentUser) {
      loadSimulationPortfolio();
    }
  }, [currentUser, loadSimulationPortfolio]);

  const value = {
    portfolio,
    virtualBalance,
    holdings,
    transactions,
    loading,
    error,
    buyStock,
    sellStock,
    resetSimulation,
    loadSimulationPortfolio
  };

  useEffect(() => {
    let unregister;
    if (registerContext) {
      unregister = registerContext('simulation', {
        portfolioId: portfolio?.id,
        virtualBalance,
        holdingsCount: holdings.length,
        transactionsCount: transactions.length,
        loading,
        error,
      });
    }
    return () => unregister?.();
  }, [error, holdings, loading, portfolio, registerContext, transactions, virtualBalance]);

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}

export default SimulationContext;

