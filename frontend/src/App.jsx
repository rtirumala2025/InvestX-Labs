import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import DisclaimerBanner from './components/common/DisclaimerBanner';
import NetworkStatus from './components/common/NetworkStatus';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Header from './components/common/Header';
import Footer from './components/common/Footer';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OnboardingPage from './pages/OnboardingPage';
import DiagnosticPage from './pages/DiagnosticPage';
import DashboardPage from './pages/DashboardPage';
import SuggestionsPage from './pages/SuggestionsPage';
import PortfolioPage from './pages/PortfolioPage';
import EducationPage from './pages/EducationPage';
import ProfilePage from './pages/ProfilePage';
import PrivacyPage from './pages/PrivacyPage';
import ChatPage from './pages/ChatPage';
import FloatingChatButton from './components/chat/FloatingChatButton';

// Styles
import './styles/liquid-glass.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <div className="min-h-screen flex flex-col">
              <DisclaimerBanner />
              <NetworkStatus />
              <Header />
              
              <main className="flex-1">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<HomePage />} />
                  
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  
                  {/* Protected Routes */}
                  <Route path="/onboarding" element={
                    <ProtectedRoute>
                      <OnboardingPage />
                    </ProtectedRoute>
                  } />
                  
                  
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/suggestions" element={
                    <ProtectedRoute>
                      <SuggestionsPage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/portfolio" element={
                    <ProtectedRoute>
                      <PortfolioPage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/education" element={
                    <ProtectedRoute>
                      <EducationPage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/chat" element={
                    <ProtectedRoute>
                      <ChatPage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } />
                  
                  {/* Optional: public privacy page */}
                  <Route path="/privacy" element={<PrivacyPage />} />
                  
                  {/* Catch all route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              
              {/* Floating Chat Button - appears on all pages */}
              <FloatingChatButton />
              <Footer />
            </div>
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
