# Frontend Integration Guide

Complete guide for integrating the AI Investment Backend with your React frontend.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install axios @tanstack/react-query
# or
yarn add axios @tanstack/react-query
```

### 2. Environment Setup

Create `.env.local`:
```env
REACT_APP_API_BASE_URL=https://api.investx-labs.com
REACT_APP_API_KEY=your-api-key-here
```

### 3. API Client Setup

```typescript
// src/services/api.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const API_KEY = process.env.REACT_APP_API_KEY;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
```

## 🤖 Chat Integration

### Chat Hook

```typescript
// src/hooks/useChat.ts
import { useState, useCallback } from 'react';
import { apiClient } from '../services/api';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestions?: Suggestion[];
}

interface Suggestion {
  type: string;
  title: string;
  action?: string;
  parameters?: any;
}

interface ChatContext {
  age: number;
  budget: number;
  risk_tolerance: string;
  investment_goals?: string[];
  experience_level?: string;
}

export const useChat = (userId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const sendMessage = useCallback(async (
    message: string,
    context: ChatContext
  ) => {
    setLoading(true);
    
    try {
      const response = await apiClient.post('/api/v1/chat/message', {
        user_id: userId,
        message,
        context,
        conversation_id: conversationId,
      });

      const { data } = response.data;
      
      // Add user message
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        type: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: data.message_id,
        type: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        suggestions: data.suggestions,
      };

      setMessages(prev => [...prev, userMessage, assistantMessage]);
      setConversationId(data.conversation_id);
      
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userId, conversationId]);

  const loadChatHistory = useCallback(async () => {
    try {
      const response = await apiClient.get(`/api/v1/chat/history/${userId}`);
      const { data } = response.data;
      
      if (data.conversations.length > 0) {
        const latestConversation = data.conversations[0];
        setMessages(latestConversation.messages);
        setConversationId(latestConversation.conversation_id);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }, [userId]);

  return {
    messages,
    loading,
    sendMessage,
    loadChatHistory,
  };
};
```

### Chat Component

```tsx
// src/components/ChatInterface.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';

interface ChatInterfaceProps {
  userId: string;
  userContext: {
    age: number;
    budget: number;
    risk_tolerance: string;
    investment_goals?: string[];
    experience_level?: string;
  };
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  userId,
  userContext,
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, loading, sendMessage, loadChatHistory } = useChat(userId);

  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const message = inputMessage.trim();
    setInputMessage('');

    try {
      await sendMessage(message, userContext);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Handle error (show toast, etc.)
    }
  };

  const handleSuggestionClick = async (suggestion: any) => {
    if (suggestion.action === 'calculate_compound_interest') {
      const message = `Can you calculate compound interest for $${suggestion.parameters.amount} per month for ${suggestion.parameters.years} years?`;
      await sendMessage(message, userContext);
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h2>💬 Chat with Finley</h2>
        <p>Your AI investment education assistant</p>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="welcome-message">
            <h3>👋 Hey there!</h3>
            <p>I'm Finley, your AI investment education assistant! I'm here to help you learn about investing in a fun and easy way.</p>
            <div className="conversation-starters">
              <h4>Try asking me:</h4>
              <ul>
                <li>"What's the difference between stocks and bonds?"</li>
                <li>"How does compound interest work?"</li>
                <li>"What are index funds?"</li>
                <li>"How much should I invest each month?"</li>
              </ul>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-content">
              {message.type === 'assistant' && (
                <div className="assistant-avatar">🤖</div>
              )}
              <div className="message-text">
                <div className="message-body">
                  {message.content.split('\n').map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="suggestions">
                    {message.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        className="suggestion-button"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="message-timestamp">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}

        {loading && (
          <div className="message assistant">
            <div className="message-content">
              <div className="assistant-avatar">🤖</div>
              <div className="message-text">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask Finley anything about investing..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !inputMessage.trim()}>
          {loading ? '⏳' : '📤'}
        </button>
      </form>
    </div>
  );
};
```

### Chat Styles

```css
/* src/styles/chat.css */
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 600px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  background: #fafafa;
}

.chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  text-align: center;
}

.chat-header h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.chat-header p {
  margin: 0;
  opacity: 0.9;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.welcome-message {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.conversation-starters ul {
  text-align: left;
  max-width: 400px;
  margin: 0 auto;
}

.message {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.message.user {
  align-items: flex-end;
}

.message.assistant {
  align-items: flex-start;
}

.message-content {
  display: flex;
  gap: 0.75rem;
  max-width: 80%;
}

.message.user .message-content {
  flex-direction: row-reverse;
}

.assistant-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.message-text {
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.message.user .message-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.message-body p {
  margin: 0 0 0.5rem 0;
  line-height: 1.5;
}

.message-body p:last-child {
  margin-bottom: 0;
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.suggestion-button {
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 20px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-button:hover {
  background: #e0e0e0;
  transform: translateY(-1px);
}

.typing-indicator {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #999;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.message-timestamp {
  font-size: 0.75rem;
  color: #666;
  margin-left: 3.5rem;
}

.message.user .message-timestamp {
  margin-left: 0;
  margin-right: 3.5rem;
  text-align: right;
}

.chat-input {
  display: flex;
  padding: 1rem;
  background: white;
  border-top: 1px solid #e0e0e0;
  gap: 0.75rem;
}

.chat-input input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 25px;
  font-size: 1rem;
  outline: none;
}

.chat-input input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.chat-input button {
  width: 50px;
  height: 50px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.chat-input button:hover:not(:disabled) {
  transform: scale(1.05);
}

.chat-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

## 📚 Content Integration

### Content Hook

```typescript
// src/hooks/useContent.ts
import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

interface ContentItem {
  content_id: string;
  title: string;
  type: 'article' | 'video' | 'quiz';
  description: string;
  difficulty_level: string;
  estimated_read_time?: string;
  topics: string[];
  relevance_score: number;
  url: string;
  thumbnail_url?: string;
}

export const useContent = (userId: string) => {
  const [recommendations, setRecommendations] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecommendations = async (options?: {
    limit?: number;
    content_types?: string[];
    topics?: string[];
  }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.content_types) params.append('content_types', options.content_types.join(','));
      if (options?.topics) params.append('topics', options.topics.join(','));

      const response = await apiClient.get(
        `/api/v1/educational-content/recommendations/${userId}?${params}`
      );
      
      setRecommendations(response.data.data.recommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchContent = async (query: string, filters?: string[]) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: query });
      if (filters) params.append('filters', filters.join(','));

      const response = await apiClient.get(
        `/api/v1/educational-content/search?${params}`
      );
      
      return response.data.data.results;
    } catch (error) {
      console.error('Error searching content:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [userId]);

  return {
    recommendations,
    loading,
    fetchRecommendations,
    searchContent,
  };
};
```

### Content Component

```tsx
// src/components/ContentRecommendations.tsx
import React from 'react';
import { useContent } from '../hooks/useContent';

interface ContentRecommendationsProps {
  userId: string;
}

export const ContentRecommendations: React.FC<ContentRecommendationsProps> = ({
  userId,
}) => {
  const { recommendations, loading, fetchRecommendations } = useContent(userId);

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'article': return '📄';
      case 'video': return '🎥';
      case 'quiz': return '🧠';
      default: return '📚';
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#666';
    }
  };

  if (loading) {
    return (
      <div className="content-loading">
        <div className="loading-spinner"></div>
        <p>Loading personalized content...</p>
      </div>
    );
  }

  return (
    <div className="content-recommendations">
      <div className="content-header">
        <h2>📚 Recommended for You</h2>
        <p>Content tailored to your interests and learning level</p>
      </div>

      <div className="content-grid">
        {recommendations.map((item) => (
          <div key={item.content_id} className="content-card">
            <div className="content-thumbnail">
              {item.thumbnail_url ? (
                <img src={item.thumbnail_url} alt={item.title} />
              ) : (
                <div className="content-icon">
                  {getContentIcon(item.type)}
                </div>
              )}
              <div className="content-type-badge">
                {item.type.toUpperCase()}
              </div>
            </div>

            <div className="content-info">
              <h3 className="content-title">{item.title}</h3>
              <p className="content-description">{item.description}</p>
              
              <div className="content-meta">
                <span 
                  className="difficulty-badge"
                  style={{ backgroundColor: getDifficultyColor(item.difficulty_level) }}
                >
                  {item.difficulty_level}
                </span>
                {item.estimated_read_time && (
                  <span className="time-badge">
                    ⏱️ {item.estimated_read_time}
                  </span>
                )}
                <span className="relevance-badge">
                  {Math.round(item.relevance_score * 100)}% match
                </span>
              </div>

              <div className="content-topics">
                {item.topics.slice(0, 3).map((topic) => (
                  <span key={topic} className="topic-tag">
                    #{topic.replace('_', ' ')}
                  </span>
                ))}
              </div>

              <button 
                className="content-button"
                onClick={() => window.open(item.url, '_blank')}
              >
                {item.type === 'quiz' ? 'Take Quiz' : 'Read More'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="content-actions">
        <button 
          className="refresh-button"
          onClick={() => fetchRecommendations()}
        >
          🔄 Refresh Recommendations
        </button>
      </div>
    </div>
  );
};
```

## 📊 Market Data Integration

### Market Data Hook

```typescript
// src/hooks/useMarketData.ts
import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

interface MarketExplanation {
  symbol: string;
  company_name: string;
  current_price: number;
  price_change: number;
  price_change_percent: number;
  explanation: {
    summary: string;
    detailed_explanation: string;
    age_appropriate: boolean;
    complexity_level: string;
  };
  educational_notes: string[];
}

export const useMarketData = () => {
  const [loading, setLoading] = useState(false);

  const explainSymbol = async (symbol: string, userAge?: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (userAge) params.append('user_age', userAge.toString());

      const response = await apiClient.get(
        `/api/v1/market-data/explain/${symbol}?${params}`
      );
      
      return response.data.data as MarketExplanation;
    } catch (error) {
      console.error('Error explaining symbol:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getMarketOverview = async (userAge?: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (userAge) params.append('user_age', userAge.toString());

      const response = await apiClient.get(
        `/api/v1/market-data/overview?${params}`
      );
      
      return response.data.data;
    } catch (error) {
      console.error('Error getting market overview:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    explainSymbol,
    getMarketOverview,
  };
};
```

## 🎯 Quiz Integration

### Quiz Hook

```typescript
// src/hooks/useQuiz.ts
import { useState } from 'react';
import { apiClient } from '../services/api';

interface QuizQuestion {
  question_id: string;
  question: string;
  type: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

interface Quiz {
  quiz_id: string;
  title: string;
  description: string;
  difficulty: string;
  estimated_time: string;
  questions: QuizQuestion[];
  total_questions: number;
}

interface QuizResult {
  score: number;
  total_questions: number;
  percentage: number;
  grade: string;
  results: any[];
  badges_earned: string[];
  recommendations: any[];
}

export const useQuiz = () => {
  const [loading, setLoading] = useState(false);

  const getPersonalizedQuiz = async (
    userId: string,
    options?: {
      topic?: string;
      difficulty?: string;
      question_count?: number;
    }
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ user_id: userId });
      if (options?.topic) params.append('topic', options.topic);
      if (options?.difficulty) params.append('difficulty', options.difficulty);
      if (options?.question_count) params.append('question_count', options.question_count.toString());

      const response = await apiClient.get(
        `/api/v1/quiz/personalized?${params}`
      );
      
      return response.data.data as Quiz;
    } catch (error) {
      console.error('Error getting quiz:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = async (
    quizId: string,
    userId: string,
    answers: any[],
    totalTime: number
  ) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/v1/quiz/submit', {
        quiz_id: quizId,
        user_id: userId,
        answers,
        total_time: totalTime,
      });
      
      return response.data.data as QuizResult;
    } catch (error) {
      console.error('Error submitting quiz:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getPersonalizedQuiz,
    submitQuiz,
  };
};
```

## 🔧 Error Handling

### Error Boundary

```tsx
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>😅 Oops! Something went wrong</h2>
          <p>We're having trouble connecting to our AI assistant. Please try refreshing the page.</p>
          <button onClick={() => window.location.reload()}>
            🔄 Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Toast Notifications

```tsx
// src/components/Toast.tsx
import React, { useState, useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  duration = 3000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon">{getToastIcon()}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
};
```

## 📱 Mobile Responsiveness

### Responsive Chat Styles

```css
/* Mobile-first responsive design */
@media (max-width: 768px) {
  .chat-interface {
    height: 100vh;
    border-radius: 0;
  }

  .message-content {
    max-width: 90%;
  }

  .suggestions {
    flex-direction: column;
  }

  .suggestion-button {
    width: 100%;
    text-align: center;
  }

  .content-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .content-card {
    margin-bottom: 1rem;
  }
}

@media (min-width: 769px) {
  .content-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }
}
```

## 🧪 Testing

### Chat Hook Test

```typescript
// src/hooks/__tests__/useChat.test.ts
import { renderHook, act } from '@testing-library/react';
import { useChat } from '../useChat';
import { apiClient } from '../../services/api';

jest.mock('../../services/api');

describe('useChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send message successfully', async () => {
    const mockResponse = {
      data: {
        data: {
          response: 'Hello! How can I help you?',
          message_id: 'msg_123',
          conversation_id: 'conv_456',
          suggestions: [],
        },
      },
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useChat('user_123'));

    await act(async () => {
      await result.current.sendMessage('Hello', {
        age: 16,
        budget: 50,
        risk_tolerance: 'moderate',
      });
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].content).toBe('Hello');
    expect(result.current.messages[1].content).toBe('Hello! How can I help you?');
  });
});
```

This comprehensive frontend integration guide provides everything needed to integrate the AI Investment Backend with your React application, including hooks, components, styling, error handling, and testing examples.
