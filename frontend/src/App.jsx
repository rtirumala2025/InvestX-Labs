import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import DisclaimerBanner from './components/common/DisclaimerBanner';
import NetworkStatus from './components/common/NetworkStatus';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SmartRedirect from './components/common/SmartRedirect';
import SimpleHeader from './components/common/SimpleHeader';

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
              <SimpleHeader />
              
              <main className="flex-1">
                <Routes>
                  {/* Smart Redirect Route */}
                  <Route path="/" element={<SmartRedirect />} />
                  <Route path="/home" element={<HomePage />} />
                  
                  {/* Public Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  
                  {/* Protected Routes */}
                  <Route path="/onboarding" element={
                    <ProtectedRoute>
                      <OnboardingPage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/diagnostic" element={
                    <ProtectedRoute>
                      <DiagnosticPage />
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
                  
                  <Route path="/privacy" element={
                    <ProtectedRoute>
                      <PrivacyPage />
                    </ProtectedRoute>
                  } />
                  
                  {/* Catch all route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              
              {/* Floating Chat Button - appears on all pages */}
              <FloatingChatButton />
            </div>
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
