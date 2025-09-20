import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const FloatingChatButton = () => {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  if (!user) {
    return null; // Don't show for non-logged in users
  }

  return (
    <div className="floating-chat-button">
      <Link 
        to="/chat"
        className="chat-link"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={`chat-button ${isHovered ? 'hovered' : ''}`}>
          <div className="chat-icon">
            💬
          </div>
          {isHovered && (
            <div className="chat-tooltip">
              Chat with Finley
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default FloatingChatButton;
