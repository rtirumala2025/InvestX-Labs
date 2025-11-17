import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AppContextProvider } from "./contexts/AppContext";
import theme from "./theme";
import ErrorBoundary from "./components/common/ErrorBoundary";
import DisclaimerBanner from "./components/common/DisclaimerBanner";
import NetworkStatus from "./components/common/NetworkStatus";
import GlobalErrorBanner from "./components/common/GlobalErrorBanner";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import ToastViewport from "./components/common/ToastViewport";
import LoadingSpinner from "./components/common/LoadingSpinner";

// Critical pages - load immediately for better UX
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

// Lazy load other pages for code splitting and performance
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const DiagnosticPage = lazy(() => import("./pages/DiagnosticPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const SuggestionsPage = lazy(() => import("./pages/SuggestionsPage"));
const PortfolioPage = lazy(() => import("./pages/PortfolioPage"));
const EducationPage = lazy(() => import("./pages/EducationPage"));
const LessonView = lazy(() => import("./pages/LessonView"));
const ClubsPage = lazy(() => import("./pages/ClubsPage"));
const ClubDetailPage = lazy(() => import("./pages/ClubDetailPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const SimulationPage = lazy(() => import("./pages/SimulationPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const AchievementsPage = lazy(() => import("./pages/AchievementsPage"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <LoadingSpinner size="large" />
  </div>
);

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
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route
                      path="/forgot-password"
                      element={<ForgotPasswordPage />}
                    />
                    <Route
                      path="/reset-password"
                      element={<ResetPasswordPage />}
                    />
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
                </Suspense>
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
