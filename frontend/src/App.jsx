import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppContextProvider } from './contexts/AppContext';
import theme from './theme';
import ErrorBoundary from './components/common/ErrorBoundary';
import DisclaimerBanner from './components/common/DisclaimerBanner';
import NetworkStatus from './components/common/NetworkStatus';
import GlobalErrorBanner from './components/common/GlobalErrorBanner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import ToastViewport from './components/common/ToastViewport';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import OnboardingPage from './pages/OnboardingPage';
import DiagnosticPage from './pages/DiagnosticPage';
import DashboardPage from './pages/DashboardPage';
import SuggestionsPage from './pages/SuggestionsPage';
import PortfolioPage from './pages/PortfolioPage';
import EducationPage from './pages/EducationPage';
import LessonView from './pages/LessonView';
import ClubsPage from './pages/ClubsPage';
import ClubDetailPage from './pages/ClubDetailPage';
import ProfilePage from './pages/ProfilePage';
import PrivacyPage from './pages/PrivacyPage';
import ChatPage from './pages/ChatPage';
import SimulationPage from './pages/SimulationPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AchievementsPage from './pages/AchievementsPage';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppContextProvider>
          <div className="min-h-screen flex flex-col bg-gray-900 text-white">
                <ToastViewport />
                <GlobalErrorBanner />
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
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="/reset-password" element={<ResetPasswordPage />} />
                      <Route path="/verify-email" element={<VerifyEmailPage />} />
                      <Route path="/privacy" element={<PrivacyPage />} />
                      
                      <Route
                        path="/onboarding"
                        element={
                          <ProtectedRoute>
                            <OnboardingPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/diagnostic"
                        element={
                          <ProtectedRoute>
                            <DiagnosticPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute>
                            <DashboardPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/suggestions"
                        element={
                          <ProtectedRoute>
                            <SuggestionsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/portfolio"
                        element={
                          <ProtectedRoute>
                            <PortfolioPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/education"
                        element={
                          <ProtectedRoute>
                            <EducationPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/education/lessons/:lessonId"
                        element={
                          <ProtectedRoute>
                            <LessonView />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/clubs"
                        element={
                          <ProtectedRoute>
                            <ClubsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/clubs/:clubId"
                        element={
                          <ProtectedRoute>
                            <ClubDetailPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <ProfilePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/chat"
                        element={
                          <ProtectedRoute>
                            <ChatPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/simulation"
                        element={
                          <ProtectedRoute>
                            <SimulationPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/leaderboard"
                        element={
                          <ProtectedRoute>
                            <LeaderboardPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/achievements"
                        element={
                          <ProtectedRoute>
                            <AchievementsPage />
                          </ProtectedRoute>
                        }
                      />
                      
                      {/* Catch all route */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </ErrorBoundary>
                </main>
                
                <Footer />
              </div>
        </AppContextProvider>
        </ThemeProvider>
      </ErrorBoundary>
  );
}

export default App;