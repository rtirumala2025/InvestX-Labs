// Supabase Edge Function for Alpha Vantage API Integration
// Deploy: supabase functions deploy fetch-alpha-vantage

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALPHA_VANTAGE_API_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface AlphaVantageGlobalQuote {
  '01. symbol': string
  '02. open': string
  '03. high': string
  '04. low': string
  '05. price': string
  '06. volume': string
  '07. latest trading day': string
  '08. previous close': string
  '09. change': string
  '10. change percent': string
}

interface QuoteResponse {
  symbol: string
  price: number
  change: number
  percent_change: number
  volume: number
  open: number
  high: number
  low: number
  previous_close: number
  last_updated: string
  source: string
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate API key
    if (!ALPHA_VANTAGE_API_KEY) {
      throw new Error('ALPHA_VANTAGE_API_KEY not configured')
    }

    // Parse request
    const { symbol, symbols } = await req.json()

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

    // Handle batch request
    if (symbols && Array.isArray(symbols)) {
      const quotes = await Promise.all(
        symbols.map(async (sym: string) => {
          try {
            return await fetchQuote(sym, supabase)
          } catch (error) {
            console.error(`Error fetching ${sym}:`, error)
            return null
          }
        })
      )

      return new Response(
        JSON.stringify({
          quotes: quotes.filter(q => q !== null),
          count: quotes.filter(q => q !== null).length,
          fetched_at: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Handle single quote request
    if (symbol) {
      const quote = await fetchQuote(symbol, supabase)

      return new Response(
        JSON.stringify(quote),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    throw new Error('Missing symbol or symbols parameter')

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function fetchQuote(symbol: string, supabase: any): Promise<QuoteResponse> {
  // Check if symbol is allowed
  const { data: allowedSymbol, error: symbolError } = await supabase
    .from('allowed_symbols')
    .select('symbol')
    .eq('symbol', symbol.toUpperCase())
    .eq('is_active', true)
    .single()

  if (symbolError || !allowedSymbol) {
    throw new Error(`Symbol ${symbol} is not allowed`)
  }

  // Check cache first
  const { data: cachedData } = await supabase
    .from('market_data_cache')
    .select('data, expires_at')
    .eq('symbol', symbol.toUpperCase())
    .single()

  if (cachedData && new Date(cachedData.expires_at) > new Date()) {
    console.log(`Cache hit for ${symbol}`)
    return cachedData.data
  }

  // Fetch from Alpha Vantage
  console.log(`Fetching ${symbol} from Alpha Vantage`)
  const ALPHA_VANTAGE_BASE_URL = Deno.env.get('ALPHA_VANTAGE_BASE_URL') || 'https://www.alphavantage.co/query'
  const url = `${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol.toUpperCase()}&apikey=${ALPHA_VANTAGE_API_KEY}`

  const response = await fetch(url)
  const data = await response.json()

  // Check for API errors
  if (data['Error Message']) {
    throw new Error(`Alpha Vantage API error: ${data['Error Message']}`)
  }

  if (data['Note']) {
    throw new Error(`Alpha Vantage rate limit: ${data['Note']}`)
  }

  const globalQuote = data['Global Quote'] as AlphaVantageGlobalQuote

  if (!globalQuote || !globalQuote['05. price']) {
    throw new Error(`No data returned for symbol ${symbol}`)
  }

  // Parse and format the quote
  const quote: QuoteResponse = {
    symbol: globalQuote['01. symbol'],
    price: parseFloat(globalQuote['05. price']),
    change: parseFloat(globalQuote['09. change']),
    percent_change: parseFloat(globalQuote['10. change percent'].replace('%', '')),
    volume: parseInt(globalQuote['06. volume']),
    open: parseFloat(globalQuote['02. open']),
    high: parseFloat(globalQuote['03. high']),
    low: parseFloat(globalQuote['04. low']),
    previous_close: parseFloat(globalQuote['08. previous close']),
    last_updated: globalQuote['07. latest trading day'],
    source: 'alpha_vantage',
  }

  // Cache the result (30 seconds TTL)
  const expiresAt = new Date(Date.now() + 30 * 1000).toISOString()
  await supabase
    .from('market_data_cache')
    .upsert({
      symbol: symbol.toUpperCase(),
      data: quote,
      cached_at: new Date().toISOString(),
      expires_at: expiresAt,
    })

  return quote
}

/* Example usage:
 * 
 * Single quote:
 * POST https://your-project.supabase.co/functions/v1/fetch-alpha-vantage
 * { "symbol": "AAPL" }
 * 
 * Batch quotes:
 * POST https://your-project.supabase.co/functions/v1/fetch-alpha-vantage
 * { "symbols": ["AAPL", "MSFT", "GOOGL"] }
 */
