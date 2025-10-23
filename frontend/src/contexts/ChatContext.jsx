import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Action types
const ACTIONS = {
  ADD_MESSAGE: 'ADD_MESSAGE',
  SET_MESSAGES: 'SET_MESSAGES',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  QUEUE_MESSAGE: 'QUEUE_MESSAGE',
  CLEAR_QUEUE: 'CLEAR_QUEUE',
  UPDATE_USER_PROFILE: 'UPDATE_USER_PROFILE',
};

// Initial state
const initialState = {
  messages: [],
  isLoading: false,
  error: null,
  offlineQueue: [],
  userProfile: {
    id: null,
    name: 'Guest',
    experienceLevel: 'beginner',
    riskTolerance: 'moderate',
    interests: [],
    portfolioValue: 0,
  },
  isOnline: true,
};

// Reducer function
const chatReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.ADD_MESSAGE:
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    
    case ACTIONS.SET_MESSAGES:
      return {
        ...state,
        messages: action.payload,
      };
    
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };
    
    case ACTIONS.QUEUE_MESSAGE:
      return {
        ...state,
        offlineQueue: [...state.offlineQueue, action.payload],
      };
    
    case ACTIONS.CLEAR_QUEUE:
      return {
        ...state,
        offlineQueue: [],
      };
    
    case ACTIONS.UPDATE_USER_PROFILE:
      return {
        ...state,
        userProfile: {
          ...state.userProfile,
          ...action.payload,
        },
      };
    
    case 'SET_ONLINE_STATUS':
      return {
        ...state,
        isOnline: action.payload,
      };
    
    default:
      return state;
  }
};

// Create context
const ChatContext = createContext();

// Provider component
export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    const loadState = () => {
      try {
        const savedState = localStorage.getItem('chatState');
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          // Don't load loading state from localStorage
          const { isLoading, ...rest } = parsedState;
          dispatch({ type: ACTIONS.SET_MESSAGES, payload: rest.messages || [] });
          dispatch({ type: ACTIONS.UPDATE_USER_PROFILE, payload: rest.userProfile || initialState.userProfile });
        }
      } catch (error) {
        console.error('Failed to load chat state from localStorage:', error);
      }
    };

    // Set up online/offline detection
    const handleOnline = () => {
      dispatch({ type: 'SET_ONLINE_STATUS', payload: true });
      // Process any queued messages
      if (state.offlineQueue.length > 0) {
        // In a real app, you would process the queue here
        console.log('Back online. Process queued messages:', state.offlineQueue);
        // For now, we'll just clear the queue
        dispatch({ type: ACTIONS.CLEAR_QUEUE });
      }
    };

    const handleOffline = () => {
      dispatch({ type: 'SET_ONLINE_STATUS', payload: false });
    };

    loadState();
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial online status
    dispatch({ type: 'SET_ONLINE_STATUS', payload: navigator.onLine });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    try {
      // Don't save loading state to localStorage
      const { isLoading, ...stateToSave } = state;
      localStorage.setItem('chatState', JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Failed to save chat state to localStorage:', error);
    }
  }, [state.messages, state.userProfile, state.offlineQueue, state.isOnline]);

  // Context value
  const value = {
    ...state,
    addMessage: (message) => {
      const messageWithId = {
        ...message,
        id: message.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: message.timestamp || new Date().toISOString(),
      };
      
      // If offline and message is from user, add to queue
      if (!state.isOnline && message.role === 'user') {
        dispatch({ 
          type: ACTIONS.QUEUE_MESSAGE, 
          payload: messageWithId 
        });
        return;
      }
      
      dispatch({ type: ACTIONS.ADD_MESSAGE, payload: messageWithId });
    },
    setMessages: (messages) => {
      dispatch({ type: ACTIONS.SET_MESSAGES, payload: messages });
    },
    setLoading: (isLoading) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: isLoading });
    },
    setError: (error) => {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error });
    },
    updateUserProfile: (updates) => {
      dispatch({ type: ACTIONS.UPDATE_USER_PROFILE, payload: updates });
    },
    clearError: () => {
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });
    },
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// Custom hook for using the chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;
