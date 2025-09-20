import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ChatInterface from '../ChatInterface';
import { useAuth } from '../../../hooks/useAuth';
import { useChat } from '../../../hooks/useChat';

// Mock the hooks
jest.mock('../../../hooks/useAuth');
jest.mock('../../../hooks/useChat');

// Mock the services
jest.mock('../../../services/chat', () => ({
  sendChatMessage: jest.fn(),
  startConversation: jest.fn(),
  getChatHistory: jest.fn(),
}));

const mockUser = {
  uid: 'test-user-123',
  displayName: 'Test User',
  email: 'test@example.com',
  age: 16,
  budget: 100,
  risk_tolerance: 'moderate',
  investment_goals: ['college', 'car'],
  experience_level: 'beginner',
};

const mockChatHook = {
  messages: [],
  loading: false,
  error: null,
  sendMessage: jest.fn(),
  clearConversation: jest.fn(),
  startNewConversation: jest.fn(),
  retryLastMessage: jest.fn(),
};

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ChatInterface', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({
      user: mockUser,
      logout: jest.fn(),
    });
    
    useChat.mockReturnValue(mockChatHook);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders chat interface for authenticated user', () => {
    renderWithRouter(<ChatInterface />);
    
    expect(screen.getByText('💬 Chat with Finley')).toBeInTheDocument();
    expect(screen.getByText('Your AI investment education assistant')).toBeInTheDocument();
  });

  it('shows login prompt for unauthenticated user', () => {
    useAuth.mockReturnValue({
      user: null,
      logout: jest.fn(),
    });

    renderWithRouter(<ChatInterface />);
    
    expect(screen.getByText('🔒 Please log in to chat')).toBeInTheDocument();
    expect(screen.getByText('You need to be logged in to use the chat feature.')).toBeInTheDocument();
  });

  it('displays welcome message when no messages exist', () => {
    renderWithRouter(<ChatInterface />);
    
    expect(screen.getByText('👋 Hey there!')).toBeInTheDocument();
    expect(screen.getByText("I'm Finley, your AI investment education assistant!")).toBeInTheDocument();
    expect(screen.getByText('Try asking me:')).toBeInTheDocument();
  });

  it('displays conversation starter buttons', () => {
    renderWithRouter(<ChatInterface />);
    
    expect(screen.getByText("What's the difference between stocks and bonds?")).toBeInTheDocument();
    expect(screen.getByText('How does compound interest work?')).toBeInTheDocument();
    expect(screen.getByText('What are index funds?')).toBeInTheDocument();
    expect(screen.getByText('How much should I invest each month?')).toBeInTheDocument();
  });

  it('allows sending messages through input', async () => {
    renderWithRouter(<ChatInterface />);
    
    const input = screen.getByPlaceholderText('Ask Finley anything about investing...');
    const sendButton = screen.getByLabelText('Send message');
    
    fireEvent.change(input, { target: { value: 'Hello Finley!' } });
    fireEvent.click(sendButton);
    
    expect(mockChatHook.sendMessage).toHaveBeenCalledWith('Hello Finley!');
  });

  it('handles Enter key to send messages', async () => {
    renderWithRouter(<ChatInterface />);
    
    const input = screen.getByPlaceholderText('Ask Finley anything about investing...');
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });
    
    expect(mockChatHook.sendMessage).toHaveBeenCalledWith('Test message');
  });

  it('shows loading state when sending message', () => {
    useChat.mockReturnValue({
      ...mockChatHook,
      loading: true,
    });

    renderWithRouter(<ChatInterface />);
    
    expect(screen.getByText('⏳')).toBeInTheDocument();
  });

  it('displays error messages', () => {
    useChat.mockReturnValue({
      ...mockChatHook,
      error: 'Connection failed',
    });

    renderWithRouter(<ChatInterface />);
    
    expect(screen.getByText('⚠️ Connection failed')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('allows starting new conversation', () => {
    renderWithRouter(<ChatInterface />);
    
    const newConversationButton = screen.getByLabelText('Start new conversation');
    fireEvent.click(newConversationButton);
    
    expect(mockChatHook.startNewConversation).toHaveBeenCalled();
  });

  it('handles conversation starter clicks', async () => {
    renderWithRouter(<ChatInterface />);
    
    const starterButton = screen.getByText("What's the difference between stocks and bonds?");
    fireEvent.click(starterButton);
    
    expect(mockChatHook.sendMessage).toHaveBeenCalledWith("What's the difference between stocks and bonds?");
  });

  it('displays character count in input', () => {
    renderWithRouter(<ChatInterface />);
    
    const input = screen.getByPlaceholderText('Ask Finley anything about investing...');
    fireEvent.change(input, { target: { value: 'Hello' } });
    
    expect(screen.getByText('5/1000')).toBeInTheDocument();
  });

  it('prevents sending empty messages', () => {
    renderWithRouter(<ChatInterface />);
    
    const sendButton = screen.getByLabelText('Send message');
    expect(sendButton).toBeDisabled();
  });
});
