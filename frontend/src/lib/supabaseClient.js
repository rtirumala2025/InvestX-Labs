import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing required Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

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
