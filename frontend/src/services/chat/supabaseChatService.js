import { supabase } from '../supabase/config';

export const loadConversation = async (userId) => {
  if (!userId) {
    return { data: [], error: new Error('User not authenticated') };
  }

  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('[supabaseChatService] loadConversation error:', error);
    return { data: [], error };
  }
};

export const sendMessage = async ({ userId, content, role = 'user' }) => {
  if (!userId) {
    const error = new Error('User not authenticated');
    return { data: null, error };
  }

  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: userId,
        content,
        role,
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('[supabaseChatService] sendMessage error:', error);
    return { data: null, error };
  }
};

// Task 12: Improved real-time reliability with exponential backoff
export const subscribeToMessages = (userId, callback, onReconnectStatus) => {
  if (!userId) {
    const error = new Error('User not authenticated');
    return { unsubscribe: () => {}, error };
  }

  let channel = null;
  let reconnectAttempts = 0;
  let reconnectTimeoutId = null;
  const maxReconnectAttempts = 10;
  const baseDelay = 1000; // 1 second
  const maxDelay = 60000; // 60 seconds

  const calculateDelay = (attempt) => {
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    return delay;
  };

  const attemptReconnect = () => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.error('💬 [ChatService] ❌ Max reconnection attempts reached');
      if (onReconnectStatus) {
        onReconnectStatus({ connected: false, error: 'Max reconnection attempts reached' });
      }
      return;
    }

    const delay = calculateDelay(reconnectAttempts);
    console.log(`💬 [ChatService] 🔄 Attempting reconnection ${reconnectAttempts + 1}/${maxReconnectAttempts} in ${delay}ms`);

    if (onReconnectStatus) {
      onReconnectStatus({ 
        connected: false, 
        reconnecting: true, 
        attempt: reconnectAttempts + 1,
        maxAttempts: maxReconnectAttempts
      });
    }

    reconnectTimeoutId = setTimeout(() => {
      reconnectAttempts++;
      try {
        if (channel) {
          supabase.removeChannel(channel);
        }
        channel = supabase
          .channel(`chat-messages-${userId}-${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'chat_messages',
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              if (payload?.new) {
                callback(payload.new);
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('💬 [ChatService] ✅ Chat realtime subscription reconnected');
              reconnectAttempts = 0;
              if (onReconnectStatus) {
                onReconnectStatus({ connected: true, reconnecting: false });
              }
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.warn('💬 [ChatService] ⚠️ Chat realtime connection issue:', status);
              attemptReconnect();
            }
          });
      } catch (error) {
        console.error('[supabaseChatService] Reconnection error:', error);
        attemptReconnect();
      }
    }, delay);
  };

  try {
    channel = supabase
      .channel(`chat-messages-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload?.new) {
            callback(payload.new);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('💬 [ChatService] ✅ Chat realtime subscription connected');
          reconnectAttempts = 0;
          if (onReconnectStatus) {
            onReconnectStatus({ connected: true, reconnecting: false });
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn('💬 [ChatService] ⚠️ Chat realtime connection issue:', status);
          attemptReconnect();
        }
      });

    return {
      unsubscribe: () => {
        if (reconnectTimeoutId) {
          clearTimeout(reconnectTimeoutId);
        }
        if (channel) {
          supabase.removeChannel(channel);
        }
      },
      error: null,
    };
  } catch (error) {
    console.error('[supabaseChatService] subscribeToMessages error:', error);
    return { unsubscribe: () => {}, error };
  }
};
