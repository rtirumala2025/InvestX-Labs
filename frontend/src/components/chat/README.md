# Chat Integration

This directory contains the chatbot integration components for the InvestX Labs frontend.

## Components

### ChatInterface.jsx
The main chat interface component that provides:
- Real-time chat with Finley (AI investment education assistant)
- Message history and conversation management
- Suggestion buttons for quick interactions
- Responsive design for mobile and desktop
- Error handling and retry functionality

### ChatInterface.css
Comprehensive styling for the chat interface including:
- Glass morphism design
- Responsive layout
- Dark mode support
- Smooth animations and transitions
- Mobile-first design

## Services

### chat.js
API service for communicating with the backend chatbot:
- `sendChatMessage()` - Send messages to the chatbot
- `startConversation()` - Initialize new conversations
- `getChatHistory()` - Retrieve conversation history
- `getConversation()` - Get specific conversation details
- `deleteConversation()` - Remove conversations

## Hooks

### useChat.js
Custom React hook for managing chat state:
- Message management
- Loading states
- Error handling
- Conversation initialization
- Retry functionality

## Usage

1. **Import the ChatInterface component:**
```jsx
import ChatInterface from '../components/chat/ChatInterface';
```

2. **Use in a page component:**
```jsx
const ChatPage = () => {
  return (
    <div className="chat-page">
      <ChatInterface />
    </div>
  );
};
```

3. **The component automatically:**
   - Connects to the backend API
   - Manages user authentication
   - Handles conversation state
   - Provides error recovery

## Configuration

Set the API base URL in your environment variables:
```env
REACT_APP_API_BASE_URL=http://localhost:8000
```

## Features

- **Real-time Communication**: Instant responses from the AI assistant
- **Conversation Memory**: Maintains context across messages
- **User Context**: Adapts responses based on user profile
- **Safety Filters**: Age-appropriate content filtering
- **Mobile Responsive**: Works seamlessly on all devices
- **Accessibility**: Full keyboard navigation and screen reader support
- **Error Recovery**: Automatic retry and error handling

## Backend Integration

The chat interface integrates with the AI Investment Backend's chat endpoints:
- `/api/v1/chat/message` - Send messages
- `/api/v1/chat/start` - Start conversations
- `/api/v1/chat/history/{userId}` - Get chat history
- `/api/v1/chat/conversation/{conversationId}` - Get conversation details

## Styling

The chat interface uses a modern glass morphism design with:
- Semi-transparent backgrounds
- Backdrop blur effects
- Smooth gradients
- Subtle shadows and borders
- Responsive breakpoints

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Dependencies

- React 18+
- React Router 6+
- Axios for API calls
- Custom UI components (GlassButton, GlassCard)
