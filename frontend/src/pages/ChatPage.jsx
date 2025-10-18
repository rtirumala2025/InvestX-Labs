import React from 'react';
import AIChat from '../components/chat/AIChat';

const ChatPage = () => {
  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-hidden">
        <AIChat />
      </div>
    </div>
  );
};

export default ChatPage;