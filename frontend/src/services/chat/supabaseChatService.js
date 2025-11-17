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

export const subscribeToMessages = (userId, callback) => {
  if (!userId) {
    const error = new Error('User not authenticated');
    return { unsubscribe: () => {}, error };
  }

  try {
    const channel = supabase
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
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('💬 [ChatService] ⚠️ Chat realtime connection issue:', status);
        }
      });

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
      error: null,
    };
  } catch (error) {
    console.error('[supabaseChatService] subscribeToMessages error:', error);
    return { unsubscribe: () => {}, error };
  }
};
