import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useCallback,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import {
  loadConversation,
  sendMessage as sendMessageToSupabase,
  subscribeToMessages,
} from '../services/chat/supabaseChatService';
import { supabase } from '../services/supabase/config';
import { useApp } from './AppContext';

const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_SENDING: 'SET_SENDING',
  SET_ERROR: 'SET_ERROR',
  SET_MESSAGES: 'SET_MESSAGES',
  ADD_OPTIMISTIC_MESSAGE: 'ADD_OPTIMISTIC_MESSAGE',
  REPLACE_OPTIMISTIC_MESSAGE: 'REPLACE_OPTIMISTIC_MESSAGE',
  UPSERT_MESSAGE: 'UPSERT_MESSAGE',
  REMOVE_MESSAGE: 'REMOVE_MESSAGE',
  CLEAR_MESSAGES: 'CLEAR_MESSAGES',
};

const initialState = {
  messages: [],
  loading: false,
  sending: false,
  error: null,
};

const sortMessages = (messages) =>
  [...messages].sort((a, b) => new Date(a.created_at || a.timestamp) - new Date(b.created_at || b.timestamp));

const chatReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case ACTIONS.SET_SENDING:
      return { ...state, sending: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    case ACTIONS.SET_MESSAGES:
      return { ...state, messages: sortMessages(action.payload || []) };
    case ACTIONS.ADD_OPTIMISTIC_MESSAGE:
      return { ...state, messages: sortMessages([...state.messages, action.payload]) }; 
    case ACTIONS.REPLACE_OPTIMISTIC_MESSAGE: {
      const { tempId, message } = action.payload;
      const updated = state.messages.map((msg) =>
        msg.id === tempId ? { ...message, pending: false } : msg
      );
      return { ...state, messages: sortMessages(updated) };
    }
    case ACTIONS.UPSERT_MESSAGE: {
      const incoming = { ...action.payload, pending: false };
      const existsIndex = state.messages.findIndex((msg) => msg.id === incoming.id);
      if (existsIndex >= 0) {
        const updated = [...state.messages];
        updated[existsIndex] = { ...updated[existsIndex], ...incoming };
        return { ...state, messages: sortMessages(updated) };
      }
      // Avoid duplicating optimistic message if it matches by content/timestamp
      const optimisticIndex = state.messages.findIndex(
        (msg) => msg.pending && msg.content === incoming.content && msg.role === incoming.role
      );
      if (optimisticIndex >= 0) {
        const updated = [...state.messages];
        updated[optimisticIndex] = { ...incoming };
        return { ...state, messages: sortMessages(updated) };
      }
      return { ...state, messages: sortMessages([...state.messages, incoming]) };
    }
    case ACTIONS.REMOVE_MESSAGE:
      return {
        ...state,
        messages: state.messages.filter((msg) => msg.id !== action.payload),
      };
    case ACTIONS.CLEAR_MESSAGES:
      return { ...state, messages: [] };
    default:
      return state;
  }
};

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const subscriptionRef = useRef(null);
  const reconnectStatusRef = useRef({ connected: false, reconnecting: false });
  const { isOnline, queueToast, registerContext } = useApp();

  useEffect(() => {
    dispatch({ type: ACTIONS.CLEAR_MESSAGES });
    dispatch({ type: ACTIONS.SET_ERROR, payload: null });

    if (!userId) {
      return undefined;
    }

    let isMounted = true;

    const fetchMessages = async () => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      const { data, error } = await loadConversation(userId);
      if (!isMounted) return;

      if (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: error.message || 'Unable to load chat history',
        });
      } else {
        dispatch({ type: ACTIONS.SET_MESSAGES, payload: data });
      }
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    };

    fetchMessages();

    return () => {
      isMounted = false;
    };
  }, [queueToast, userId]);

  useEffect(() => {
    if (!userId) {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      return undefined;
    }

    const handleReconnectStatus = (status) => {
      reconnectStatusRef.current = status;
      if (status.reconnecting && !status.connected) {
        queueToast(`Reconnecting to chat... (${status.attempt}/${status.maxAttempts})`, 'warning', { id: 'chat-reconnecting' });
      } else if (status.connected && !status.reconnecting) {
        queueToast('Chat reconnected successfully', 'success', { id: 'chat-reconnected' });
      }
    };

    const subscription = subscribeToMessages(userId, (message) => {
      if (!message) return;
      dispatch({ type: ACTIONS.UPSERT_MESSAGE, payload: message });
    }, handleReconnectStatus);

    if (subscription.error) {
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: subscription.error.message || 'Unable to subscribe to chat messages',
      });
    }

    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [queueToast, userId]);

  const clearConversation = useCallback(async () => {
    dispatch({ type: ACTIONS.CLEAR_MESSAGES });
    dispatch({ type: ACTIONS.SET_ERROR, payload: null });

    if (!userId) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.debug?.('ChatContext clearConversation error', error);
      queueToast(error.message || 'Unable to clear conversation', 'error');
    }
  }, [userId]);

  const sendMessage = useCallback(async (content, role = 'user') => {
    if (!userId) {
      queueToast('Please sign in to chat', 'error');
      return { data: null, error: new Error('User not authenticated') };
    }

    const trimmed = content?.trim();
    if (!trimmed) {
      return { data: null, error: new Error('Message cannot be empty') };
    }

    dispatch({ type: ACTIONS.SET_ERROR, payload: null });

    const tempId = uuidv4();
    const optimisticMessage = {
      id: tempId,
      role,
      content: trimmed,
      created_at: new Date().toISOString(),
      pending: true,
    };

    dispatch({ type: ACTIONS.ADD_OPTIMISTIC_MESSAGE, payload: optimisticMessage });
    dispatch({ type: ACTIONS.SET_SENDING, payload: true });

    const { data, error } = await sendMessageToSupabase({
      userId,
      content: trimmed,
      role,
    });

    dispatch({ type: ACTIONS.SET_SENDING, payload: false });

    if (error) {
      dispatch({ type: ACTIONS.REMOVE_MESSAGE, payload: tempId });
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message || 'Unable to send message' });
      return { data: null, error };
    }

    dispatch({
      type: ACTIONS.REPLACE_OPTIMISTIC_MESSAGE,
      payload: { tempId, message: data },
    });

    return { data, error: null };
  }, [userId]);

  const retryLastMessage = useCallback(async () => {
    const lastUserMessage = [...state.messages]
      .reverse()
      .find((message) => message.role === 'user');

    if (!lastUserMessage) return;

    await sendMessage(lastUserMessage.content, 'user');
  }, [sendMessage, state.messages]);

  const startNewConversation = useCallback(async () => {
    await clearConversation();
    if (userId) {
      const { data, error } = await loadConversation(userId);
      if (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message || 'Unable to load chat history' });
      } else {
        dispatch({ type: ACTIONS.SET_MESSAGES, payload: data });
      }
    }
  }, [clearConversation, userId]);

  const refreshMessages = useCallback(async () => {
    if (!userId) return;
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    const { data, error } = await loadConversation(userId);
    if (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message || 'Unable to load chat history' });
    } else {
      dispatch({ type: ACTIONS.SET_MESSAGES, payload: data });
    }
    dispatch({ type: ACTIONS.SET_LOADING, payload: false });
  }, [userId]);

  const value = useMemo(
    () => ({
      messages: state.messages,
      loading: state.loading,
      sending: state.sending,
      error: state.error,
      isOnline,
      sendMessage,
      retryLastMessage,
      startNewConversation,
      clearConversation,
      refreshMessages,
      setError: (err) => dispatch({ type: ACTIONS.SET_ERROR, payload: err }),
    }),
    [
      state.messages,
      state.loading,
      state.sending,
      state.error,
      isOnline,
      sendMessage,
      retryLastMessage,
      startNewConversation,
      clearConversation,
      refreshMessages,
    ]
  );

  useEffect(() => {
    let unregister;
    if (registerContext) {
      unregister = registerContext('chat', {
        messageCount: state.messages.length,
        loading: state.loading,
        sending: state.sending,
        error: state.error,
        isOnline,
      });
    }
    return () => unregister?.();
  }, [isOnline, registerContext, state.error, state.loading, state.messages.length, state.sending]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;
