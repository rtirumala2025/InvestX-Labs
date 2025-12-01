/**
 * Portfolio Engine Service
 * Core portfolio calculations and performance tracking
 */

import { supabase } from '../supabase/config';

/**
 * Calculate portfolio performance metrics
 * @param {Object} portfolio - Portfolio object
 * @param {Array} holdings - Array of holdings
 * @param {Object} marketData - Current market prices
 * @returns {Object} Performance metrics
 */
export const calculatePortfolioPerformance = (portfolio, holdings, marketData) => {
  const startingBalance = portfolio?.starting_balance || 10000;
  const cashBalance = portfolio?.virtual_balance || 0;

  // Calculate holdings value
  let holdingsValue = 0;
  let totalCostBasis = 0;
  let dailyChange = 0;
  let dailyChangePercent = 0;

  const enrichedHoldings = holdings.map(holding => {
    const currentPrice = marketData?.[holding.symbol]?.price || holding.current_price || holding.purchase_price || 0;
    const previousClose = marketData?.[holding.symbol]?.previousClose || holding.purchase_price || 0;
    const shares = parseFloat(holding.shares || 0);
    const purchasePrice = parseFloat(holding.purchase_price || 0);

    const marketValue = shares * currentPrice;
    const costBasis = shares * purchasePrice;
    const unrealizedPL = marketValue - costBasis;
    const unrealizedPLPercent = costBasis > 0 ? (unrealizedPL / costBasis) * 100 : 0;
    const positionDailyChange = shares * (currentPrice - previousClose);
    const positionDailyChangePercent = previousClose > 0 ? ((currentPrice - previousClose) / previousClose) * 100 : 0;

    holdingsValue += marketValue;
    totalCostBasis += costBasis;
    dailyChange += positionDailyChange;

    return {
      ...holding,
      currentPrice,
      marketValue,
      costBasis,
      unrealizedPL,
      unrealizedPLPercent,
      dailyChange: positionDailyChange,
      dailyChangePercent: positionDailyChangePercent
    };
  });

  const totalValue = cashBalance + holdingsValue;
  const totalInvested = startingBalance;
  const totalReturn = totalValue - totalInvested;
  const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  // Calculate daily change percentage
  const previousTotalValue = totalValue - dailyChange;
  dailyChangePercent = previousTotalValue > 0 ? (dailyChange / previousTotalValue) * 100 : 0;

  // Calculate asset allocation
  const assetAllocation = enrichedHoldings.map(holding => ({
    symbol: holding.symbol,
    name: holding.company_name || holding.symbol,
    value: holding.marketValue,
    percentage: holdingsValue > 0 ? (holding.marketValue / holdingsValue) * 100 : 0,
    shares: holding.shares,
    sector: holding.sector || 'Unknown'
  }));

  // Sector allocation
  const sectorAllocation = {};
  enrichedHoldings.forEach(holding => {
    const sector = holding.sector || 'Unknown';
    if (!sectorAllocation[sector]) {
      sectorAllocation[sector] = { value: 0, percentage: 0, count: 0 };
    }
    sectorAllocation[sector].value += holding.marketValue;
    sectorAllocation[sector].count += 1;
  });

  Object.keys(sectorAllocation).forEach(sector => {
    sectorAllocation[sector].percentage = holdingsValue > 0 
      ? (sectorAllocation[sector].value / holdingsValue) * 100 
      : 0;
  });

  return {
    totalValue,
    cashBalance,
    holdingsValue,
    totalInvested,
    totalReturn,
    totalReturnPercent,
    dailyChange,
    dailyChangePercent,
    allTimeHigh: portfolio?.all_time_high || totalValue,
    maxDrawdown: portfolio?.max_drawdown || 0,
    holdings: enrichedHoldings,
    assetAllocation,
    sectorAllocation,
    lastUpdated: new Date().toISOString()
  };
};

/**
 * Record portfolio snapshot for history tracking
 * @param {string} portfolioId - Portfolio ID
 * @param {Object} performance - Performance metrics from calculatePortfolioPerformance
 * @returns {Promise<Object>} Snapshot record
 */
export const recordPortfolioSnapshot = async (portfolioId, performance) => {
  try {
    const { data, error } = await supabase.rpc('record_portfolio_snapshot', {
      p_portfolio_id: portfolioId,
      p_total_value: performance.totalValue,
      p_cash_balance: performance.cashBalance,
      p_invested_value: performance.holdingsValue,
      p_daily_change: performance.dailyChange,
      p_daily_change_percent: performance.dailyChangePercent
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error recording portfolio snapshot:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get portfolio history for charting
 * @param {string} portfolioId - Portfolio ID
 * @param {number} days - Number of days to retrieve (default: 30)
 * @returns {Promise<Array>} Array of historical snapshots
 */
export const getPortfolioHistory = async (portfolioId, days = 30) => {
  try {
    const { data, error } = await supabase
      .from('portfolio_history')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .gte('recorded_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('recorded_at', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching portfolio history:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Update portfolio performance metrics in database
 * @param {string} portfolioId - Portfolio ID
 * @param {Object} performance - Performance metrics
 * @returns {Promise<Object>} Update result
 */
export const updatePortfolioPerformance = async (portfolioId, performance) => {
  try {
    const updates = {
      total_return: performance.totalReturn,
      total_return_percent: performance.totalReturnPercent,
      updated_at: new Date().toISOString()
    };

    // Update all-time high if current value is higher
    if (performance.totalValue > (performance.allTimeHigh || 0)) {
      updates.all_time_high = performance.totalValue;
    }

    // Calculate max drawdown if needed
    if (performance.allTimeHigh > 0) {
      const currentDrawdown = ((performance.allTimeHigh - performance.totalValue) / performance.allTimeHigh) * 100;
      if (currentDrawdown > (performance.maxDrawdown || 0)) {
        updates.max_drawdown = currentDrawdown;
      }
    }

    const { error } = await supabase
      .from('portfolios')
      .update(updates)
      .eq('id', portfolioId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating portfolio performance:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Calculate position size for a given dollar amount
 * @param {number} dollarAmount - Dollar amount to invest
 * @param {number} pricePerShare - Current price per share
 * @returns {number} Number of shares (fractional supported)
 */
export const calculatePositionSize = (dollarAmount, pricePerShare) => {
  if (!pricePerShare || pricePerShare <= 0) return 0;
  return dollarAmount / pricePerShare;
};

/**
 * Calculate dollar amount for a given number of shares
 * @param {number} shares - Number of shares
 * @param {number} pricePerShare - Current price per share
 * @returns {number} Total dollar amount
 */
export const calculateDollarAmount = (shares, pricePerShare) => {
  return shares * pricePerShare;
};

/**
 * Calculate fees for a trade
 * @param {number} tradeValue - Total trade value
 * @param {number} feePercent - Fee percentage (default: 0.1%)
 * @returns {number} Fee amount
 */
export const calculateFees = (tradeValue, feePercent = 0.001) => {
  return tradeValue * feePercent;
};

/**
 * Get benchmark comparison (S&P 500)
 * @param {number} portfolioReturn - Portfolio return percentage
 * @param {Object} sp500Data - S&P 500 performance data
 * @returns {Object} Comparison metrics
 */
export const compareToBenchmark = (portfolioReturn, sp500Data) => {
  const sp500Return = sp500Data?.returnPercent || 0;
  const outperformance = portfolioReturn - sp500Return;

  return {
    portfolioReturn,
    benchmarkReturn: sp500Return,
    outperformance,
    isOutperforming: outperformance > 0,
    comparison: outperformance > 0 ? 'outperforming' : 'underperforming'
  };
};
