import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import theme from './theme';
import ErrorBoundary from './components/common/ErrorBoundary';
import DisclaimerBanner from './components/common/DisclaimerBanner';
import NetworkStatus from './components/common/NetworkStatus';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import DevTools from './components/dev/DevTools';
import FirebaseDebug from './components/debug/FirebaseDebug';

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

// Developer Tools - Only in development
const DevToolsWrapper = () => {
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <div className="bg-gray-800 bg-opacity-90 p-2 rounded-lg shadow-lg">
          <DevTools />
        </div>
        <div className="bg-gray-800 bg-opacity-90 p-2 rounded-lg shadow-lg">
          <FirebaseDebug />
        </div>
      </div>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <ChatProvider>
          <div className="min-h-screen flex flex-col bg-gray-900 text-white">
          <NetworkStatus />
          <DisclaimerBanner />
          <Header />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              
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
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              
              <Route path="/chat" element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              } />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          
          {/* Developer Tools */}
          <DevToolsWrapper />
          
            <Footer />
          </div>
        </ChatProvider>
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;