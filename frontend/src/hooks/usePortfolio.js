import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase/config';
import { calculatePerformanceMetrics } from '../services/portfolio/portfolioCalculations';
import { computeServerAnalytics } from '../services/portfolio/analyticsService';
import { trackPortfolioPerformance } from '../services/portfolio/performanceTracking';
import { analyzeDiversification } from '../services/portfolio/diversificationAnalysis';
import { getPortfolioMarketData } from '../services/market/marketData';
import { getBatchMarketData } from '../services/api/marketService';
import { useApp } from '../contexts/AppContext';

const STORAGE_KEYS = {
  portfolio: 'investx.portfolio.snapshot',
  holdings: 'investx.portfolio.holdings',
  transactions: 'investx.portfolio.transactions',
  pendingOps: 'investx.portfolio.pendingOperations'
};

const isBrowser = typeof window !== 'undefined';

const getStorage = () => {
  if (!isBrowser) return null;
  try {
    return window.localStorage;
  } catch (error) {
    console.warn('📊 [usePortfolio] Storage unavailable:', error);
    return null;
  }
};

const cacheSnapshot = (key, value) => {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('📊 [usePortfolio] Failed to cache snapshot:', error);
  }
};

const loadSnapshot = (key, fallback = null) => {
  const storage = getStorage();
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn('📊 [usePortfolio] Failed to read cached snapshot:', error);
    return fallback;
  }
};

const cacheHoldings = (portfolioId, holdings) => {
  if (!portfolioId) return;
  const map = loadSnapshot(STORAGE_KEYS.holdings, {});
  map[portfolioId] = holdings;
  cacheSnapshot(STORAGE_KEYS.holdings, map);
};

const loadCachedHoldings = (portfolioId) => {
  if (!portfolioId) return [];
  const map = loadSnapshot(STORAGE_KEYS.holdings, {});
  return map[portfolioId] || [];
};

const cacheTransactions = (portfolioId, transactions) => {
  if (!portfolioId) return;
  const map = loadSnapshot(STORAGE_KEYS.transactions, {});
  map[portfolioId] = transactions;
  cacheSnapshot(STORAGE_KEYS.transactions, map);
};

const loadCachedTransactions = (portfolioId) => {
  if (!portfolioId) return [];
  const map = loadSnapshot(STORAGE_KEYS.transactions, {});
  return map[portfolioId] || [];
};

const cachePortfolio = (userId, portfolio) => {
  if (!userId) return;
  const map = loadSnapshot(STORAGE_KEYS.portfolio, {});
  map[userId] = portfolio;
  cacheSnapshot(STORAGE_KEYS.portfolio, map);
};

const loadCachedPortfolio = (userId) => {
  if (!userId) return null;
  const map = loadSnapshot(STORAGE_KEYS.portfolio, {});
  return map[userId] || null;
};

const loadPendingOperations = () => loadSnapshot(STORAGE_KEYS.pendingOps, []);

const cachePendingOperations = (ops) => cacheSnapshot(STORAGE_KEYS.pendingOps, ops);

/**
 * usePortfolio
 *
 * Synchronizes the authenticated user's primary portfolio with Supabase by
 * loading holdings, transactions, and portfolio metadata, wiring realtime
 * listeners, refreshing market data, and exposing mutation helpers that keep
 * dashboard/portfolio UI in sync with live data.
 *
 * @returns {Object} Portfolio state, metrics helpers, and mutation methods.
 */
export const usePortfolio = () => {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const { queueToast, isOnline } = useApp();
  
  const [portfolio, setPortfolio] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [offline, setOffline] = useState(false);
  const [pendingOperations, setPendingOperations] = useState(() => loadPendingOperations());
  
  // Track subscribed portfolio ID to prevent duplicate subscriptions
  const subscribedPortfolioIdRef = useRef(null);

  const persistPending = useCallback((queue) => {
    setPendingOperations(queue);
    cachePendingOperations(queue);
  }, []);

  const enqueueOperation = useCallback(
    (operation) => {
      persistPending([...pendingOperations, operation]);
    },
    [pendingOperations, persistPending]
  );

  /**
   * Load holdings for a portfolio
   */
  const loadHoldings = useCallback(async (portfolioId) => {
    if (!portfolioId) {
      console.log('📊 [usePortfolio] No portfolio ID, skipping holdings load');
      setHoldings([]);
      return;
    }

    try {
      console.log('📊 [usePortfolio] Loading holdings for portfolio:', portfolioId);

      // Select holdings - handle case where purchase_price might not exist yet
      // Try with purchase_price first, fallback to basic columns if it fails
      let holdingsData, holdingsError;
      
      try {
        const result = await supabase
          .from('holdings')
          .select('id,portfolio_id,symbol,shares,purchase_price,current_price,purchase_date,created_at,updated_at')
          .eq('portfolio_id', portfolioId)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        holdingsData = result.data;
        holdingsError = result.error;
        
        // If error is about missing column, try without purchase_price
        // Note: This is a temporary fallback for PostgREST schema cache issues
        // The column exists in the database but PostgREST cache may take 1-2 minutes to refresh
        if (holdingsError && holdingsError.code === '42703' && holdingsError.message?.includes('purchase_price')) {
          console.debug('📊 [usePortfolio] PostgREST cache issue: purchase_price column exists but not yet visible to API. Using fallback query.');
          const fallbackResult = await supabase
            .from('holdings')
            .select('id,portfolio_id,symbol,shares,current_price,purchase_date,created_at,updated_at')
            .eq('portfolio_id', portfolioId)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
          
          holdingsData = fallbackResult.data;
          holdingsError = fallbackResult.error;
          
          // Add purchase_price as current_price or 0 for compatibility
          if (holdingsData) {
            holdingsData = holdingsData.map(h => ({
              ...h,
              purchase_price: h.current_price || 0
            }));
          }
        } else if (holdingsError) {
          // Log other errors for debugging
          console.error('📊 [usePortfolio] Holdings query error:', JSON.stringify(holdingsError, null, 2));
        }
      } catch (err) {
        holdingsError = err;
      }

      if (holdingsError) {
        console.error('📊 [usePortfolio] Error loading holdings:', holdingsError);
        throw holdingsError;
      }

      console.log('📊 [usePortfolio] ✅ Loaded', holdingsData?.length || 0, 'holdings');
      const normalizedHoldings = holdingsData || [];
      setHoldings(normalizedHoldings);
      cacheHoldings(portfolioId, normalizedHoldings);
      setOffline(false);
      return { data: holdingsData || [], error: null };

    } catch (err) {
      console.error('📊 [usePortfolio] ❌ Error loading holdings:', err);
      const cached = loadCachedHoldings(portfolioId);
      if (cached.length) {
        setHoldings(cached);
        setOffline(true);
        queueToast('Holdings are in offline mode. Data may be stale.', 'warning', { id: 'portfolio-holdings-offline' });
        return { data: cached, error: err };
      }
      queueToast(`Failed to load holdings: ${err.message}`, 'error');
      return { data: [], error: err };
    }
  }, [queueToast, userId]);

  /**
   * Load transactions for a portfolio
   */
  const loadTransactions = useCallback(async (portfolioId) => {
    if (!portfolioId) {
      setTransactions([]);
      return { data: [], error: null };
    }

    try {
      console.log('📊 [usePortfolio] Loading transactions for portfolio:', portfolioId);

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('id,portfolio_id,symbol,transaction_type,shares,price,total_amount,transaction_date,created_at')
        .eq('portfolio_id', portfolioId)
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false, nullsFirst: false })
        .limit(100);

      if (transactionsError) {
        throw transactionsError;
      }

      const normalizedTransactions = transactionsData || [];
      setTransactions(normalizedTransactions);
      cacheTransactions(portfolioId, normalizedTransactions);
      setOffline(false);
      return { data: transactionsData || [], error: null };
    } catch (err) {
      console.error('📊 [usePortfolio] ❌ Error loading transactions:', err);
      const cached = loadCachedTransactions(portfolioId);
      if (cached.length) {
        setTransactions(cached);
        setOffline(true);
        queueToast('Transactions are in offline mode. Data may be stale.', 'warning', { id: 'portfolio-transactions-offline' });
        return { data: cached, error: err };
      }
      queueToast(`Failed to load transactions: ${err.message}`, 'error');
      return { data: [], error: err };
    }
  }, [queueToast, userId]);

  console.log('📊 [usePortfolio] Hook initialized for user:', userId || 'No user');

  /**
   * Load user's portfolio from Supabase
   */
  const loadPortfolio = useCallback(async () => {
    if (!userId) {
      console.log('📊 [usePortfolio] No user ID, skipping portfolio load');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      console.log('📊 [usePortfolio] Loading portfolio for user:', userId);

      // Load portfolio (non-simulation portfolio)
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolios')
        .select('id,user_id,name,description,virtual_balance,is_simulation,created_at,updated_at')
        .eq('user_id', userId)
        .eq('is_simulation', false)
        .maybeSingle();

      if (portfolioError && portfolioError.code !== 'PGRST116') {
        console.error('📊 [usePortfolio] Error loading portfolio:', portfolioError);
        throw portfolioError;
      }

      console.log('📊 [usePortfolio] Portfolio loaded:', portfolioData ? 'Found' : 'Not found');

      let finalPortfolio = portfolioData;

      // If no portfolio exists, create one
      if (!portfolioData) {
        console.log('📊 [usePortfolio] Creating new portfolio for user:', userId);
        const { data: newPortfolio, error: createError } = await supabase
          .from('portfolios')
          .insert({
            user_id: userId,
            name: 'My Portfolio',
            description: 'Main investment portfolio',
            is_simulation: false,
            virtual_balance: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) throw createError;
        finalPortfolio = newPortfolio;
        console.log('📊 [usePortfolio] ✅ Created new portfolio:', newPortfolio.id);
        queueToast('Portfolio created successfully', 'success');
      }

      setPortfolio(finalPortfolio);
      setOffline(false);
      cachePortfolio(userId, finalPortfolio);

      // Load holdings for this portfolio
      if (finalPortfolio?.id) {
        await Promise.all([
          loadHoldings(finalPortfolio.id),
          loadTransactions(finalPortfolio.id)
        ]);
      }

    } catch (err) {
      console.error('📊 [usePortfolio] ❌ Error loading portfolio:', err);
      setError(err.message);
      const cachedPortfolio = loadCachedPortfolio(userId);
      if (cachedPortfolio) {
        setPortfolio(cachedPortfolio);
        setHoldings(loadCachedHoldings(cachedPortfolio.id));
        setTransactions(loadCachedTransactions(cachedPortfolio.id));
        setOffline(true);
        queueToast('Portfolio is in offline mode. Showing cached data.', 'warning', { id: 'portfolio-offline' });
      } else {
        queueToast(`Failed to load portfolio: ${err.message}`, 'error');
      }
      // Ensure loading state is cleared even on error
      setLoading(false);
    }
  }, [queueToast, userId, loadHoldings, loadTransactions]);
  // Load portfolio when user changes
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!userId) {
        setPortfolio(null);
        setHoldings([]);
        setTransactions([]);
        setOffline(false);
        persistPending([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        await loadPortfolio();
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Only depend on userId - loadPortfolio is stable and depends on userId

  const fetchMarketData = useCallback(async () => {
    try {
      const symbols = holdings.map(holding => holding.symbol).filter(Boolean);
      if (symbols.length === 0) {
        setMarketData(null);
        return;
      }

      console.log('📊 [usePortfolio] Fetching market data for symbols:', symbols);
      try {
        const data = await getPortfolioMarketData(symbols);
        setMarketData(data);
        console.log('📊 [usePortfolio] ✅ Market data fetched for', Object.keys(data).length, 'symbols');
      } catch (primaryError) {
        console.warn('📊 [usePortfolio] Primary market data fetch failed, falling back to Supabase batch data:', primaryError.message);
        const fallback = await getBatchMarketData(symbols);
        setMarketData({ quotes: fallback, lastUpdated: new Date().toISOString() });
      }
    } catch (err) {
      console.error('📊 [usePortfolio] Error fetching market data:', err);
    }
  }, [holdings]);

  useEffect(() => {
    if (holdings.length > 0) {
      fetchMarketData();
    } else {
      setMarketData(null);
    }
  }, [holdings, fetchMarketData]);

  /**
   * Update portfolio metrics
   */
  const updatePortfolioMetrics = useCallback(async (options = {}) => {
    const { notify = true, showLoader = notify } = options;

    if (!portfolio || !userId) return;

    console.log('📊 [usePortfolio] Updating portfolio metrics for', holdings.length, 'holdings');

    try {
      if (showLoader) {
        setLoading(true);
      }
      setError(null);

      // Prefer server-side analytics; fallback to client-side calculations
      let performanceMetrics = await computeServerAnalytics({
        holdings: holdings.map(h => ({
          symbol: h.symbol,
          shares: h.shares,
          currentPrice: h.current_price ?? h.currentPrice ?? h.purchase_price,
          costBasis: h.purchase_price ?? h.costBasis ?? h.avgCost,
          sector: h.sector,
          assetType: h.asset_type
        })),
        transactions,
        marketData
      });

      if (!performanceMetrics) {
        performanceMetrics = calculatePerformanceMetrics(holdings, marketData);
      }
      console.log('📊 [usePortfolio] Performance metrics calculated:', {
        totalValue: performanceMetrics.totalValue,
        totalGainLoss: performanceMetrics.totalGainLoss,
        diversificationScore: performanceMetrics.diversificationScore
      });

      // Track performance over time
      const historical = portfolio.metadata?.historicalData || [];
      const performanceData = trackPortfolioPerformance(holdings, historical);

      // Analyze diversification
      const diversificationAnalysis = analyzeDiversification(holdings);

      // Update portfolio in Supabase (store metrics in metadata JSONB column)
      const { error: updateError } = await supabase
        .from('portfolios')
        .update({
          metadata: {
            ...(portfolio.metadata || {}),
            totalValue: performanceMetrics.totalValue,
            totalCostBasis: performanceMetrics.totalCostBasis,
            totalGainLoss: performanceMetrics.totalGainLoss,
            totalGainLossPercentage: performanceMetrics.totalGainLossPercentage,
            sectorAllocation: performanceMetrics.sectorAllocation,
            assetTypeAllocation: performanceMetrics.assetTypeAllocation,
            diversificationScore: performanceMetrics.diversificationScore,
            historicalData: performanceData.historicalData,
            diversificationAnalysis,
            lastCalculated: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', portfolio.id)
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Update local state (merge with existing metadata)
      setPortfolio({
        ...portfolio,
        metadata: {
          ...(portfolio.metadata || {}),
          ...performanceMetrics,
          historicalData: performanceData.historicalData,
          diversificationAnalysis
        }
      });

      console.log('📊 [usePortfolio] ✅ Portfolio metrics updated successfully');
      if (notify) {
        queueToast('Portfolio updated', 'success');
      }

    } catch (err) {
      console.error('📊 [usePortfolio] ❌ Error updating portfolio metrics:', err);
      setError(err.message);
      queueToast(`Failed to update portfolio: ${err.message}`, 'error');
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, [holdings, marketData, portfolio, queueToast, userId, transactions]);

  /**
   * Add a holding to the portfolio
   */
  const addHoldingToPortfolio = useCallback(
    async (holdingData) => {
      if (!portfolio || !userId) {
        queueToast('Portfolio not loaded. Please try again.', 'error');
        return { success: false, error: 'Portfolio not loaded' };
      }

      console.log('📊 [usePortfolio] Adding holding:', holdingData.symbol, holdingData.shares, 'shares');

      const baseHolding = {
        portfolio_id: portfolio.id,
        user_id: userId,
        symbol: holdingData.symbol,
        company_name: holdingData.companyName || holdingData.symbol,
        shares: parseFloat(holdingData.shares),
        purchase_price: parseFloat(holdingData.purchasePrice || holdingData.price),
        purchase_date: holdingData.purchaseDate || new Date().toISOString().split('T')[0],
        current_price: parseFloat(holdingData.currentPrice || holdingData.purchasePrice || holdingData.price),
        sector: holdingData.sector || 'Unknown',
        asset_type: holdingData.assetType || 'Stock',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      try {
        setLoading(true);
        setError(null);

        const { data: createdHolding, error: insertError } = await supabase
          .from('holdings')
          .insert([baseHolding])
          .select()
          .single();

        if (insertError) throw insertError;

        console.log('📊 [usePortfolio] ✅ Holding added successfully:', createdHolding.id);
        queueToast(`Added ${holdingData.symbol} to portfolio`, 'success');

        // Reload holdings
        await loadHoldings(portfolio.id);

        // Update portfolio metrics
        await updatePortfolioMetrics();

        return { success: true, data: createdHolding, queued: false };
      } catch (err) {
        console.error('📊 [usePortfolio] ❌ Error adding holding:', err);
        setError(err.message);
        const offlineHolding = {
          ...baseHolding,
          id: `offline-holding-${Date.now()}`,
          offlineQueued: true
        };
        setHoldings((prev) => {
          const next = [offlineHolding, ...prev];
          cacheHoldings(portfolio.id, next);
          return next;
        });
        enqueueOperation({
          id: offlineHolding.id,
          type: 'createHolding',
          payload: {
            portfolioId: portfolio.id,
            holding: offlineHolding
          }
        });
        setOffline(true);
        queueToast(`Offline: queued ${holdingData.symbol}. We will sync when you reconnect.`, 'warning');
        return { success: true, data: offlineHolding, queued: true };
      } finally {
        setLoading(false);
      }
    },
    [portfolio, queueToast, updatePortfolioMetrics, loadHoldings, userId, enqueueOperation]
  );

  /**
   * Update a holding
   */
  const updateHoldingInPortfolio = useCallback(async (holdingId, updates) => {
    if (!userId) {
      queueToast('Not authenticated', 'error');
      return { success: false, error: 'Not authenticated' };
    }

    try {
      setLoading(true);
      setError(null);

      console.log('📊 [usePortfolio] Updating holding:', holdingId);

      const { error: updateError } = await supabase
        .from('holdings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', holdingId)
        .eq('user_id', userId);

      if (updateError) throw updateError;

      console.log('📊 [usePortfolio] ✅ Holding updated successfully');
      queueToast('Holding updated', 'success');

      // Reload holdings
      if (portfolio?.id) {
        await loadHoldings(portfolio.id);
        await updatePortfolioMetrics();
      }

      return { success: true, queued: false };

    } catch (err) {
      console.error('📊 [usePortfolio] ❌ Error updating holding:', err);
      setError(err.message);
      const offlineUpdate = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      setHoldings((prev) => {
        const next = prev.map((holding) =>
          holding.id === holdingId ? { ...holding, ...offlineUpdate, offlineQueued: true } : holding
        );
        if (portfolio?.id) {
          cacheHoldings(portfolio.id, next);
        }
        return next;
      });
      enqueueOperation({
        id: `update-${holdingId}-${Date.now()}`,
        type: 'updateHolding',
        payload: {
          portfolioId: portfolio?.id,
          holdingId,
          updates: offlineUpdate
        }
      });
      setOffline(true);
      queueToast('Holding update queued offline. We will sync when you reconnect.', 'warning');
      return { success: true, queued: true };
    } finally {
      setLoading(false);
    }
  }, [portfolio, queueToast, updatePortfolioMetrics, loadHoldings, userId, enqueueOperation]);

  /**
   * Remove a holding from the portfolio
   */
  const removeHoldingFromPortfolio = useCallback(async (holdingId) => {
    if (!userId) {
      queueToast('Not authenticated', 'error');
      return { success: false, error: 'Not authenticated' };
    }

    try {
      setLoading(true);
      setError(null);

      console.log('📊 [usePortfolio] Removing holding:', holdingId);

      const { error: deleteError } = await supabase
        .from('holdings')
        .delete()
        .eq('id', holdingId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      console.log('📊 [usePortfolio] ✅ Holding removed successfully');
      queueToast('Holding removed', 'success');

      // Reload holdings
      if (portfolio?.id) {
        await loadHoldings(portfolio.id);
        await updatePortfolioMetrics();
      }

      return { success: true, queued: false };

    } catch (err) {
      console.error('📊 [usePortfolio] ❌ Error removing holding:', err);
      setError(err.message);
      setHoldings((prev) => {
        const next = prev.filter((holding) => holding.id !== holdingId);
        if (portfolio?.id) {
          cacheHoldings(portfolio.id, next);
        }
        return next;
      });
      enqueueOperation({
        id: `delete-${holdingId}-${Date.now()}`,
        type: 'deleteHolding',
        payload: {
          portfolioId: portfolio?.id,
          holdingId
        }
      });
      setOffline(true);
      queueToast('Holding removal queued offline. We will sync when you reconnect.', 'warning');
      return { success: true, queued: true };
    } finally {
      setLoading(false);
    }
  }, [portfolio, queueToast, updatePortfolioMetrics, loadHoldings, userId, enqueueOperation]);

  // Helper functions
  const getHoldingById = useCallback((holdingId) => {
    return holdings.find(holding => holding.id === holdingId);
  }, [holdings]);

  const getHoldingsBySector = useCallback((sector) => {
    return holdings.filter(holding => holding.sector === sector);
  }, [holdings]);

  const getHoldingsByAssetType = useCallback((assetType) => {
    return holdings.filter(holding => holding.asset_type === assetType);
  }, [holdings]);

  const getTopPerformers = useCallback((limit = 5) => {
    return holdings
      .map(h => ({
        ...h,
        gainLoss: (h.current_price - h.purchase_price) * h.shares,
        gainLossPercentage: ((h.current_price - h.purchase_price) / h.purchase_price) * 100
      }))
      .sort((a, b) => (b.gainLossPercentage || 0) - (a.gainLossPercentage || 0))
      .slice(0, limit);
  }, [holdings]);

  const getWorstPerformers = useCallback((limit = 5) => {
    return holdings
      .map(h => ({
        ...h,
        gainLoss: (h.current_price - h.purchase_price) * h.shares,
        gainLossPercentage: ((h.current_price - h.purchase_price) / h.purchase_price) * 100
      }))
      .sort((a, b) => (a.gainLossPercentage || 0) - (b.gainLossPercentage || 0))
      .slice(0, limit);
  }, [holdings]);

  const getLargestHoldings = useCallback((limit = 5) => {
    return holdings
      .map(h => ({
        ...h,
        value: (h.current_price || h.purchase_price) * h.shares
      }))
      .sort((a, b) => (b.value || 0) - (a.value || 0))
      .slice(0, limit);
  }, [holdings]);

  const refreshPortfolioData = useCallback(async () => {
    if (userId && portfolio?.id) {
      await fetchMarketData();
      await updatePortfolioMetrics({ notify: false, showLoader: true });
      queueToast('Portfolio refreshed', 'success');
    }
  }, [fetchMarketData, portfolio, queueToast, updatePortfolioMetrics, userId]);

  const lastMetricsSnapshot = useRef(null);

  const flushPendingOperations = useCallback(async () => {
    if (!pendingOperations.length || !isOnline || !portfolio?.id) return;

    const remaining = [];

    for (const operation of pendingOperations) {
      try {
        if (operation.type === 'createHolding') {
          const holding = { ...operation.payload.holding };
          delete holding.id;
          delete holding.offlineQueued;
          await supabase.from('holdings').insert([holding]);
        } else if (operation.type === 'updateHolding') {
          await supabase
            .from('holdings')
            .update(operation.payload.updates)
            .eq('id', operation.payload.holdingId);
        } else if (operation.type === 'deleteHolding') {
          await supabase
            .from('holdings')
            .delete()
            .eq('id', operation.payload.holdingId);
        }
      } catch (flushError) {
        console.warn('📊 [usePortfolio] Failed to flush pending operation:', operation.type, flushError);
        remaining.push(operation);
      }
    }

    if (!remaining.length) {
      queueToast('Portfolio updates synced.', 'success', { id: 'portfolio-sync' });
      await loadHoldings(portfolio.id);
      await updatePortfolioMetrics({ notify: false });
      setOffline(false);
    } else {
      queueToast('Some portfolio updates could not sync yet.', 'warning', { id: 'portfolio-sync-warning' });
    }

    persistPending(remaining);
  }, [isOnline, loadHoldings, pendingOperations, persistPending, portfolio?.id, queueToast, updatePortfolioMetrics]);

  useEffect(() => {
    if (!portfolio?.id || holdings.length === 0 || !marketData) {
      return;
    }

    const holdingsKey = holdings
      .map((holding) => `${holding.id}:${holding.shares}:${holding.current_price || holding.purchase_price || 0}`)
      .join('|');

    const marketKey = Object.entries(marketData.quotes || marketData || {})
      .map(([symbol, data]) => `${symbol}:${data?.price ?? data?.price_close ?? 0}`)
      .join('|');

    const snapshotKey = `${portfolio.id}:${holdingsKey}:${marketKey}`;

    if (lastMetricsSnapshot.current === snapshotKey) {
      return;
    }

    lastMetricsSnapshot.current = snapshotKey;
    updatePortfolioMetrics({ notify: false });
  }, [portfolio?.id, holdings, marketData, updatePortfolioMetrics]);

  // Realtime subscriptions - only create once per portfolio ID
  useEffect(() => {
    if (!userId || !portfolio?.id) {
      // Clean up if portfolio is removed
      if (subscribedPortfolioIdRef.current) {
        console.log('📊 [usePortfolio] Cleaning up realtime subscriptions (no portfolio)');
        subscribedPortfolioIdRef.current = null;
      }
      return;
    }

    // Only subscribe if we haven't already subscribed to this portfolio
    if (subscribedPortfolioIdRef.current === portfolio.id) {
      return;
    }

    // Clean up previous subscription if portfolio ID changed
    if (subscribedPortfolioIdRef.current && subscribedPortfolioIdRef.current !== portfolio.id) {
      console.log('📊 [usePortfolio] Portfolio ID changed, cleaning up old subscription:', subscribedPortfolioIdRef.current);
      // Channels will be cleaned up by the cleanup function below
    }

    console.log('📊 [usePortfolio] Registering realtime channels for portfolio:', portfolio.id);
    subscribedPortfolioIdRef.current = portfolio.id;

    const holdingsChannel = supabase
      .channel(`portfolio-holdings-${portfolio.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'holdings',
          filter: `portfolio_id=eq.${portfolio.id}`,
        },
        async (payload) => {
          console.log('📊 [usePortfolio] Holdings realtime event:', payload.eventType);
          await loadHoldings(portfolio.id);
          await fetchMarketData();
          await updatePortfolioMetrics({ notify: false, showLoader: false });
          queueToast('Portfolio holdings synced', 'success', { id: 'portfolio-holdings-sync' });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('📊 [usePortfolio] ✅ Holdings realtime subscription connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('📊 [usePortfolio] ⚠️ Holdings realtime connection issue:', status);
          queueToast('Lost realtime connection for holdings. Some data may be stale.', 'error', {
            id: 'portfolio-holdings-sync',
            duration: 6000,
          });
        }
      });

    const transactionsChannel = supabase
      .channel(`portfolio-transactions-${portfolio.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `portfolio_id=eq.${portfolio.id}`,
        },
        async (payload) => {
          console.log('📊 [usePortfolio] Transactions realtime event:', payload.eventType);
          await loadTransactions(portfolio.id);
          queueToast('New transaction synced', 'success', { id: 'portfolio-transactions-sync' });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('📊 [usePortfolio] ✅ Transactions realtime subscription connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('📊 [usePortfolio] ⚠️ Transactions realtime connection issue:', status);
          queueToast('Lost realtime connection for transactions.', 'error', {
            id: 'portfolio-transactions-sync',
            duration: 6000,
          });
        }
      });

    return () => {
      console.log('📊 [usePortfolio] Cleaning up realtime subscriptions for portfolio:', portfolio.id);
      supabase.removeChannel(holdingsChannel);
      supabase.removeChannel(transactionsChannel);
      if (subscribedPortfolioIdRef.current === portfolio.id) {
        subscribedPortfolioIdRef.current = null;
      }
    };
  }, [portfolio?.id, userId]); // Only depend on portfolio.id and userId - callbacks are stable

  useEffect(() => {
    if (isOnline && pendingOperations.length && portfolio?.id) {
      flushPendingOperations();
    }
  }, [flushPendingOperations, isOnline, pendingOperations.length, portfolio?.id]);

  // Memoize return value to prevent object recreation on every render
  return useMemo(() => ({
    portfolio: portfolio ? {
      ...portfolio,
      holdings: holdings
    } : null,
    holdings,
    transactions,
    marketData,
    loading,
    error,
    offline,
    pendingOperations,
    addHoldingToPortfolio,
    updateHoldingInPortfolio,
    removeHoldingFromPortfolio,
    getHoldingById,
    getHoldingsBySector,
    getHoldingsByAssetType,
    getTopPerformers,
    getWorstPerformers,
    getLargestHoldings,
    refreshPortfolioData,
    updatePortfolioMetrics,
    reloadPortfolio: loadPortfolio
  }), [
    portfolio,
    holdings,
    transactions,
    marketData,
    loading,
    error,
    offline,
    pendingOperations,
    addHoldingToPortfolio,
    updateHoldingInPortfolio,
    removeHoldingFromPortfolio,
    getHoldingById,
    getHoldingsBySector,
    getHoldingsByAssetType,
    getTopPerformers,
    getWorstPerformers,
    getLargestHoldings,
    refreshPortfolioData,
    updatePortfolioMetrics,
    loadPortfolio
  ]);
};
