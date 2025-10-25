import { createClient } from '@supabase/supabase-js';

// Use environment variables with proper fallbacks
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing required Supabase environment variables. Please check your .env file.');
  // Don't throw in production to allow for graceful degradation
  if (process.env.NODE_ENV === 'development') {
    throw new Error('Missing required Supabase environment variables');
  }
}

// Initialize Supabase client with proper configuration
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
  // Set the API URL to the Supabase REST endpoint
  db: {
    schema: 'public',
  },
  global: {
    // Add any global fetch options here
  }
});

// API Base URL
const API_BASE_URL = '/api';

// Market Data API
export const marketApi = {
  getQuote: async (symbol) => {
    try {
      const { data, error } = await supabase
        .rpc('get_quote', { symbol })
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching market data:', error);
      throw error;
    }
  },
  
  getNews: async () => {
    try {
      const { data, error } = await supabase
        .from('market_news')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching market news:', error);
      throw error;
    }
  }
};

// MCP (Model Control Panel) API
export const mcpApi = {
  getRecommendations: async (userId = 'anonymous') => {
    try {
      const { data, error } = await supabase
        .rpc('get_recommendations', { user_id: userId })
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching MCP recommendations:', error);
      // Return mock data in development if API is not available
      if (process.env.NODE_ENV === 'development') {
        console.warn('Using mock MCP recommendations due to error');
        return [
          { symbol: 'AAPL', action: 'BUY', confidence: 0.85 },
          { symbol: 'MSFT', action: 'HOLD', confidence: 0.72 },
          { symbol: 'GOOGL', action: 'BUY', confidence: 0.78 }
        ];
      }
      throw error;
    }
  },
  
  getContext: async (userId = 'anonymous') => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_context', { user_id: userId })
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching MCP context:', error);
      // Return mock context in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Using mock MCP context due to error');
        return {
          userId,
          preferences: { theme: 'light', notifications: true },
          lastActive: new Date().toISOString()
        };
      }
      throw error;
    }
  }
};

// AI Service API
export const aiService = {
  getHealth: async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_ai_health')
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking AI service health:', error);
      // Return mock health in development
      if (process.env.NODE_ENV === 'development') {
        return { status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() };
      }
      throw error;
    }
  },
  
  getRecommendations: async (query) => {
    try {
      const { data, error } = await supabase
        .rpc('get_ai_recommendations', { query });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      throw error;
    }
  }
};

// Helper function to handle errors consistently
const handleSupabaseError = (error, context = '') => {
  console.error(`Supabase Error [${context}]:`, error);
  throw error;
};

// User Management
export const auth = {
  async signUp(email, password, userData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData?.fullName || '',
          username: userData?.username || ''
        }
      }
    });
    
    if (error) handleSupabaseError(error, 'signUp');
    return data;
  },
  
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) handleSupabaseError(error, 'signIn');
    return data;
  },
  
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) handleSupabaseError(error, 'signOut');
  },
  
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) handleSupabaseError(error, 'getCurrentUser');
    return user;
  },
  
  async updateUserProfile(updates) {
    const { data, error } = await supabase.auth.updateUser(updates);
    if (error) handleSupabaseError(error, 'updateUserProfile');
    return data;
  }
};

// Chat Operations
export const chat = {
  async getChatSessions(userId) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) handleSupabaseError(error, 'getChatSessions');
    return data || [];
  },
  
  async getChatMessages(sessionId) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    
    if (error) handleSupabaseError(error, 'getChatMessages');
    return data || [];
  },
  
  async createChatSession(sessionData) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert([sessionData])
      .select()
      .single();
    
    if (error) handleSupabaseError(error, 'createChatSession');
    return data;
  },
  
  async saveChatMessage(messageData) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([messageData])
      .select()
      .single();
    
    if (error) handleSupabaseError(error, 'saveChatMessage');
    return data;
  }
};

// Analytics
export const analytics = {
  async logEvent(eventType, eventData = {}) {
    const { error } = await supabase
      .from('analytics_events')
      .insert([{
        event_type: eventType,
        event_data: eventData,
        user_agent: navigator.userAgent,
        page_url: window.location.href,
      }]);
    
    if (error) console.error('Failed to log analytics event:', error);
  },
  
  async getEvents(eventType, limit = 100) {
    let query = supabase
      .from('analytics_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (eventType) {
      query = query.eq('event_type', eventType);
    }
    
    const { data, error } = await query;
    if (error) handleSupabaseError(error, 'getEvents');
    return data || [];
  }
};

export default {
  supabase,
  auth,
  chat,
  analytics,
  handleSupabaseError
};
