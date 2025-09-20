import React from 'react';
import ChatInterfaceDemo from '../components/chat/ChatInterfaceDemo';
import GlassCard from '../components/ui/GlassCard';

const ChatPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            💬 Chat with Finley
          </h1>
          <p className="text-lg text-gray-600">
            Your AI investment education assistant is here to help you learn about investing!
          </p>
        </div>

        {/* Chat Interface */}
        <GlassCard 
          variant="default" 
          padding="none" 
          className="h-[calc(100vh-200px)] min-h-[600px]"
        >
          <ChatInterfaceDemo />
        </GlassCard>

        {/* Help Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard variant="subtle" padding="lg">
            <div className="text-center">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Personalized Learning
              </h3>
              <p className="text-gray-600 text-sm">
                Finley adapts to your age, experience level, and investment goals to provide tailored advice.
              </p>
            </div>
          </GlassCard>

          <GlassCard variant="subtle" padding="lg">
            <div className="text-center">
              <div className="text-3xl mb-3">🛡️</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Safe & Educational
              </h3>
              <p className="text-gray-600 text-sm">
                All responses are designed to be educational and age-appropriate, with safety filters in place.
              </p>
            </div>
          </GlassCard>

          <GlassCard variant="subtle" padding="lg">
            <div className="text-center">
              <div className="text-3xl mb-3">📚</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Comprehensive Knowledge
              </h3>
              <p className="text-gray-600 text-sm">
                Ask about stocks, bonds, mutual funds, compound interest, and more investment topics.
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
