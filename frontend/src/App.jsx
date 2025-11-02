import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppProvider } from './contexts/AppContext';
import { ChatProvider } from './contexts/ChatContext';
import theme from './theme';
import ErrorBoundary from './components/common/ErrorBoundary';
import DisclaimerBanner from './components/common/DisclaimerBanner';
import NetworkStatus from './components/common/NetworkStatus';
// import ProtectedRoute from './components/auth/ProtectedRoute'; // Commented out for demo - no auth required
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import DevTools from './components/dev/DevTools';
import ConnectionTester from './components/ConnectionTester';

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
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-800 bg-opacity-90 p-2 rounded-lg shadow-lg">
        <DevTools />
      </div>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppProvider>
          <ChatProvider>
              <div className="min-h-screen flex flex-col bg-gray-900 text-white">
                <NetworkStatus />
                <DisclaimerBanner />
                <Header />
                <main className="flex-grow">
                  <ErrorBoundary>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<HomePage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/signup" element={<SignupPage />} />
                      <Route path="/privacy" element={<PrivacyPage />} />
                      
                      {/* Previously Protected Routes - Now Open for Demo */}
                      <Route path="/onboarding" element={<OnboardingPage />} />
                      <Route path="/diagnostic" element={<DiagnosticPage />} />
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/suggestions" element={<SuggestionsPage />} />
                      <Route path="/portfolio" element={<PortfolioPage />} />
                      <Route path="/education" element={<EducationPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/chat" element={<ChatPage />} />
                      
                      {/* Development routes */}
                      {process.env.NODE_ENV === 'development' && (
                        <Route path="/dev/connections" element={<ConnectionTester />} />
                      )}
                      
                      {/* Catch all route */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </ErrorBoundary>
                </main>
                
                {/* Developer Tools */}
                <DevToolsWrapper />
                <Footer />
              </div>
            </ChatProvider>
          </AppProvider>
        </ThemeProvider>
      </ErrorBoundary>
  );
}

export default App;