# 📈 Market Service Implementation - Alpha Vantage Integration

## Overview

Production-ready integration of Alpha Vantage real-time market data into InvestX Labs. This implementation provides real-time stock quotes with intelligent caching, rate limit handling, and fallback mechanisms.

---

## 🎯 Features

### Core Functionality
- ✅ Real-time stock quotes via Alpha Vantage API
- ✅ Batch quote fetching for multiple symbols
- ✅ Supabase RPC integration
- ✅ In-memory caching with TTL
- ✅ Symbol whitelist validation
- ✅ Rate limit handling
- ✅ Automatic fallback to mock data
- ✅ Error recovery and logging

### Performance
- ✅ 30-second cache for individual quotes
- ✅ 5-minute cache for batch quotes
- ✅ 1-minute cache for popular symbols
- ✅ Batch API requests to reduce calls
- ✅ Database-level caching

### Security
- ✅ Symbol whitelist (RLS enforced)
- ✅ API key stored securely in Supabase
- ✅ Row Level Security (RLS) policies
- ✅ Input validation
- ✅ Error message sanitization

---

## 📦 Components

### 1. Supabase Migration
**File**: `backend/supabase/migrations/20250125000001_alpha_vantage_integration.sql`

**Creates**:
- `api_configurations` table - Stores API keys securely
- `market_data_cache` table - Caches quotes
- `allowed_symbols` table - Symbol whitelist
- `get_real_quote(symbol)` RPC - Fetch single quote
- `get_batch_market_data(symbols[])` RPC - Fetch batch quotes
- Helper functions for caching and validation

### 2. Supabase Edge Function
**File**: `backend/supabase/functions/fetch-alpha-vantage/index.ts`

**Purpose**: Makes actual HTTP calls to Alpha Vantage API

**Features**:
- Validates symbols against whitelist
- Checks database cache first
- Fetches from Alpha Vantage
- Caches results in database
- Handles errors gracefully

### 3. Frontend Market Service
**File**: `frontend/src/services/marketService.js`

**Methods**:
- `getMarketData(symbol, options)` - Get single quote
- `getBatchMarketData(symbols, options)` - Get batch quotes
- `isSymbolAllowed(symbol)` - Check if symbol is allowed
- `getAllowedSymbols()` - Get list of allowed symbols
- `getMarketDataStats()` - Get cache statistics
- `testConnection()` - Test service connectivity

### 4. Tests
**Files**:
- `frontend/__tests__/marketService.test.js` - Unit tests (mocked)
- `frontend/scripts/testMarketService.js` - Integration tests (real Supabase)

### 5. Environment Validation
**File**: `backend/config/env.validation.js`

**Purpose**: Validates required environment variables at startup

---

## 🚀 Setup Instructions

### Step 1: Get Alpha Vantage API Key

1. Go to https://www.alphavantage.co/support/#api-key
2. Sign up for a free API key
3. Copy your API key

### Step 2: Configure Environment Variables

Create `backend/.env`:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Alpha Vantage Configuration
ALPHA_VANTAGE_API_KEY=YOUR_ALPHA_VANTAGE_API_KEY

# Server Configuration
PORT=3001
NODE_ENV=development
```

Create `frontend/.env`:

```bash
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### Step 3: Apply Supabase Migration

1. Go to Supabase Dashboard → SQL Editor
2. Open `backend/supabase/migrations/20250125000001_alpha_vantage_integration.sql`
3. Run the migration
4. Verify tables and functions were created

### Step 4: Store API Key in Supabase

Run this SQL in Supabase Dashboard:

```sql
INSERT INTO public.api_configurations (service_name, api_key, rate_limit_per_minute)
VALUES ('alpha_vantage', 'YOUR_ALPHA_VANTAGE_API_KEY', 5)
ON CONFLICT (service_name) DO UPDATE
SET api_key = EXCLUDED.api_key;
```

### Step 5: Deploy Edge Function

```bash
cd backend/supabase/functions
supabase functions deploy fetch-alpha-vantage --project-ref your-project-ref
```

Set environment variables for the Edge Function:

```bash
supabase secrets set ALPHA_VANTAGE_API_KEY=YOUR_KEY --project-ref your-project-ref
```

### Step 6: Install Dependencies

```bash
cd frontend
npm install
```

### Step 7: Test the Integration

```bash
# Run unit tests
npm run test:market

# Run integration tests
npm run test:market:integration

# Test connection
node scripts/testMarketService.js
```

---

## 📖 Usage Examples

### Example 1: Get Single Quote

```javascript
import { getMarketData } from './services/marketService';

const quote = await getMarketData('AAPL');
console.log(`AAPL Price: $${quote.price}`);
console.log(`Change: ${quote.change} (${quote.percent_change}%)`);
```

### Example 2: Get Batch Quotes

```javascript
import { getBatchMarketData } from './services/marketService';

const batch = await getBatchMarketData(['AAPL', 'MSFT', 'GOOGL']);
batch.quotes.forEach(quote => {
  console.log(`${quote.symbol}: $${quote.price}`);
});
```

### Example 3: Force Refresh (Bypass Cache)

```javascript
const freshQuote = await getMarketData('AAPL', { forceRefresh: true });
```

### Example 4: Check if Symbol is Allowed

```javascript
import { isSymbolAllowed } from './services/marketService';

const allowed = await isSymbolAllowed('AAPL');
if (allowed) {
  const quote = await getMarketData('AAPL');
}
```

### Example 5: Get Allowed Symbols

```javascript
import { getAllowedSymbols } from './services/marketService';

const symbols = await getAllowedSymbols();
symbols.forEach(s => {
  console.log(`${s.symbol}: ${s.name} (${s.exchange})`);
});
```

### Example 6: Get Cache Statistics

```javascript
import { getMarketDataStats } from './services/marketService';

const stats = await getMarketDataStats();
console.log(`Cached: ${stats.active}, Expired: ${stats.expired}`);
```

### Example 7: Clear Cache

```javascript
import { marketServiceUtils } from './services/marketService';

marketServiceUtils.clearCache();
```

### Example 8: Test Connection

```javascript
import { testConnection } from './services/marketService';

const result = await testConnection();
if (result.success) {
  console.log('Market service is working!');
}
```

### Example 9: Prefetch Popular Symbols

```javascript
import { marketServiceUtils } from './services/marketService';

// Warm up cache with popular symbols
await marketServiceUtils.prefetchPopularSymbols();
```

### Example 10: React Component Integration

```javascript
import React, { useState, useEffect } from 'react';
import { getMarketData } from './services/marketService';

function StockQuote({ symbol }) {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const data = await getMarketData(symbol);
        setQuote(data);
      } catch (error) {
        console.error('Error fetching quote:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuote();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchQuote, 30000);
    return () => clearInterval(interval);
  }, [symbol]);
  
  if (loading) return <div>Loading...</div>;
  if (!quote) return <div>Error loading quote</div>;
  
  return (
    <div>
      <h2>{quote.symbol}</h2>
      <p>Price: ${quote.price}</p>
      <p>Change: {quote.change} ({quote.percent_change}%)</p>
    </div>
  );
}
```

---

## 🎯 Caching Strategy

### Cache Levels

1. **Frontend In-Memory Cache**
   - Individual quotes: 30 seconds
   - Popular symbols: 1 minute
   - Batch quotes: 5 minutes

2. **Database Cache**
   - All quotes: 30 seconds
   - Stored in `market_data_cache` table
   - Shared across all users

### Cache Keys

```javascript
// Individual quote
cache.set('quote:AAPL', data, 30000);

// Batch quote
cache.set('batch:AAPL,GOOGL,MSFT', data, 300000);
```

### Cache Invalidation

- **Time-based**: Automatic expiration via TTL
- **Manual**: `clearCache()` method
- **On error**: Cache is bypassed

### Popular Symbols

These symbols get shorter TTL (1 minute) for fresher data:
- AAPL, MSFT, GOOGL, AMZN, META, TSLA, NVDA

---

## ⚡ Performance Optimization

### Rate Limit Handling

Alpha Vantage free tier: **5 API calls per minute**

**Strategies**:
1. **Aggressive caching** - 30-second TTL
2. **Batch requests** - Fetch multiple symbols at once
3. **Database cache** - Shared across users
4. **Popular symbol cache** - Shorter TTL for frequently requested

### Reducing API Calls

```javascript
// ❌ Bad: 5 separate API calls
await getMarketData('AAPL');
await getMarketData('MSFT');
await getMarketData('GOOGL');
await getMarketData('AMZN');
await getMarketData('META');

// ✅ Good: 1 batch API call
await getBatchMarketData(['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META']);
```

### Monitoring

```javascript
// Check cache statistics
const stats = await getMarketDataStats();
console.log(`Cache hit rate: ${stats.active / stats.total_cached * 100}%`);
```

---

## 🛡️ Error Handling

### Error Types

1. **Symbol Not Allowed**
   ```javascript
   Error: Symbol XYZ is not in the allowed list
   ```

2. **API Rate Limit**
   ```javascript
   Error: Alpha Vantage rate limit exceeded
   ```

3. **Network Error**
   ```javascript
   Error: Failed to fetch quote
   ```

4. **Invalid Response**
   ```javascript
   Error: No data returned for symbol
   ```

### Fallback Behavior

**Development Mode**:
- Returns mock data on error
- Logs warnings
- Continues execution

**Production Mode**:
- Throws error
- Logs error details
- Caller handles error

### Example Error Handling

```javascript
try {
  const quote = await getMarketData('AAPL');
  console.log('Quote:', quote);
} catch (error) {
  if (error.message.includes('not allowed')) {
    console.error('Symbol not in whitelist');
  } else if (error.message.includes('rate limit')) {
    console.error('API rate limit exceeded, try again later');
  } else {
    console.error('Error fetching quote:', error);
  }
}
```

---

## 🧪 Testing

### Unit Tests

```bash
npm run test:market
```

**Tests**:
- ✅ Fetch single quote
- ✅ Fetch batch quotes
- ✅ Cache hit/miss behavior
- ✅ Symbol validation
- ✅ Error handling
- ✅ Mock data fallback

### Integration Tests

```bash
npm run test:market:integration
```

**Tests**:
- ✅ Real Supabase connection
- ✅ RPC function calls
- ✅ Database caching
- ✅ Symbol whitelist
- ✅ Cache statistics
- ✅ Force refresh

### Manual Testing

```bash
node frontend/scripts/testMarketService.js
```

---

## 📊 Data Schema

### Quote Response

```typescript
interface Quote {
  symbol: string;           // Stock symbol (e.g., "AAPL")
  price: number;            // Current price
  change: number;           // Price change
  percent_change: number;   // Percent change
  volume: number;           // Trading volume
  open: number;             // Opening price
  high: number;             // Day high
  low: number;              // Day low
  previous_close: number;   // Previous close
  last_updated: string;     // ISO timestamp
  source: string;           // "alpha_vantage" or "mock"
}
```

### Batch Response

```typescript
interface BatchResponse {
  quotes: Quote[];          // Array of quotes
  count: number;            // Number of quotes
  fetched_at: string;       // ISO timestamp
}
```

### Cache Statistics

```typescript
interface CacheStats {
  total_cached: number;     // Total cached entries
  expired: number;          // Expired entries
  active: number;           // Active entries
  oldest_cache: string;     // Oldest cache timestamp
  newest_cache: string;     // Newest cache timestamp
}
```

---

## 🔧 Troubleshooting

### Issue: "Symbol not in allowed list"

**Solution**: Add symbol to whitelist

```sql
INSERT INTO public.allowed_symbols (symbol, name, exchange)
VALUES ('TSLA', 'Tesla Inc.', 'NASDAQ');
```

### Issue: "Alpha Vantage rate limit exceeded"

**Solutions**:
1. Wait 1 minute for rate limit to reset
2. Use cached data
3. Upgrade to Alpha Vantage premium plan

### Issue: "API key not configured"

**Solution**: Store API key in Supabase

```sql
INSERT INTO public.api_configurations (service_name, api_key)
VALUES ('alpha_vantage', 'YOUR_API_KEY');
```

### Issue: Cache not working

**Check**:
1. Cache TTL hasn't expired
2. Using `useCache: true` option
3. Not using `forceRefresh: true`

### Issue: Edge Function not deployed

**Solution**:

```bash
supabase functions deploy fetch-alpha-vantage
supabase secrets set ALPHA_VANTAGE_API_KEY=YOUR_KEY
```

---

## 📈 Next Steps

### Phase 4: Advanced Features

1. **Historical Data**
   - Implement `getHistoricalData(symbol, range)`
   - Cache historical data with longer TTL

2. **Real-Time WebSocket**
   - Subscribe to live price updates
   - Push notifications for price changes

3. **Advanced Analytics**
   - Technical indicators (RSI, MACD, etc.)
   - Sentiment analysis
   - News integration

4. **Portfolio Tracking**
   - Track multiple symbols
   - Calculate portfolio value
   - Performance metrics

---

## 🎉 Success Criteria

- [x] Alpha Vantage integration complete
- [x] Supabase RPCs implemented
- [x] Frontend service updated
- [x] Caching implemented
- [x] Tests passing
- [x] Documentation complete
- [x] Error handling robust
- [x] Rate limiting handled

**Status**: ✅ Production Ready

---

**Last Updated**: January 25, 2025  
**Version**: 1.0.0  
**Author**: InvestX Labs Team
