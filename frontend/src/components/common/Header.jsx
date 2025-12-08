import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Header Component
 *
 * Main navigation header with responsive design.
 * Displays different buttons based on authentication state:
 * - Logged out: Shows Login and Sign Up buttons
 * - Logged in: Shows user welcome message and Logout button
 *
 * Features:
 * - Sticky header with scroll-based styling
 * - Responsive mobile menu
 * - Logout functionality with redirect
 */
const Header = () => {
  const { currentUser: user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /**
   * Handle user logout
   * Signs out the user and redirects to home page
   */
  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      <header
        role="banner"
        className={`
        sticky top-0 z-50 transition-all duration-300 ease-out
        ${
          scrolled
            ? "bg-white/8 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/20 shadow-2xl shadow-black/10"
            : "bg-white/5 backdrop-blur-xl backdrop-saturate-125 border-b border-white/10 shadow-xl shadow-black/5"
        }
      `}
      >
        <div className="w-full mx-auto px-6 lg:px-8 xl:px-12">
          <div className="flex justify-between items-center h-20">
            {/* Logo - Always visible */}
            <div className="flex items-center flex-shrink-0">
              <Link to="/" className="group">
                <h1 className="text-2xl lg:text-3xl font-display font-normal text-white tracking-tight text-gradient-hero group-hover:opacity-90 transition-all duration-300">
                  InvestX Labs
                </h1>
              </Link>
            </div>

            {/* Desktop Navigation - Spread across full width */}
            <nav role="navigation" aria-label="Main navigation" className="hidden lg:flex items-center justify-center flex-1 gap-6 xl:gap-8 2xl:gap-12 px-8">
              <Link
                to="/dashboard"
                className="text-white/90 hover:text-white px-3 py-2 text-sm font-semibold transition-all duration-200 hover:bg-white/10 rounded-xl backdrop-blur-lg border border-transparent hover:border-primary-500/30 focus:outline-none focus:ring-2 focus:ring-primary-500/30 whitespace-nowrap"
                aria-label="Navigate to Dashboard"
              >
                Dashboard
              </Link>
              <Link
                to="/portfolio"
                className="text-white/90 hover:text-white px-3 py-2 text-sm font-semibold transition-all duration-200 hover:bg-white/10 rounded-xl backdrop-blur-lg border border-transparent hover:border-primary-500/30 focus:outline-none focus:ring-2 focus:ring-primary-500/30 whitespace-nowrap"
                aria-label="Navigate to Portfolio"
              >
                Portfolio
              </Link>
              <Link
                to="/suggestions"
                className="text-white/90 hover:text-white px-3 py-2 text-sm font-semibold transition-all duration-200 hover:bg-white/10 rounded-xl backdrop-blur-lg border border-transparent hover:border-primary-500/30 focus:outline-none focus:ring-2 focus:ring-primary-500/30 whitespace-nowrap"
                aria-label="Navigate to AI Suggestions"
              >
                AI Suggestions
              </Link>
              <Link
                to="/education"
                className="text-white/90 hover:text-white px-3 py-2 text-sm font-semibold transition-all duration-200 hover:bg-white/10 rounded-xl backdrop-blur-lg border border-transparent hover:border-primary-500/30 focus:outline-none focus:ring-2 focus:ring-primary-500/30 whitespace-nowrap"
                aria-label="Navigate to Education"
              >
                Education
              </Link>
              <Link
                to="/clubs"
                className="text-white/90 hover:text-white px-3 py-2 text-sm font-semibold transition-all duration-200 hover:bg-white/10 rounded-xl backdrop-blur-lg border border-transparent hover:border-primary-500/30 focus:outline-none focus:ring-2 focus:ring-primary-500/30 whitespace-nowrap"
                aria-label="Navigate to Investment Clubs"
              >
                Clubs
              </Link>
              <Link
                to="/chat"
                className="text-white/90 hover:text-white px-3 py-2 text-sm font-semibold transition-all duration-200 hover:bg-white/10 rounded-xl backdrop-blur-lg border border-transparent hover:border-primary-500/30 focus:outline-none focus:ring-2 focus:ring-primary-500/30 whitespace-nowrap"
                aria-label="Navigate to Chat"
              >
                Chat
              </Link>
              <Link
                to="/simulation"
                className="text-white/90 hover:text-white px-3 py-2 text-sm font-semibold transition-all duration-200 hover:bg-white/10 rounded-xl backdrop-blur-lg border border-transparent hover:border-primary-500/30 focus:outline-none focus:ring-2 focus:ring-primary-500/30 whitespace-nowrap"
                aria-label="Navigate to Trading Simulation"
              >
                Simulation
              </Link>
              <Link
                to="/leaderboard"
                className="text-white/90 hover:text-white px-3 py-2 text-sm font-semibold transition-all duration-200 hover:bg-white/10 rounded-xl backdrop-blur-lg border border-transparent hover:border-primary-500/30 focus:outline-none focus:ring-2 focus:ring-primary-500/30 whitespace-nowrap"
                aria-label="Navigate to Leaderboard"
              >
                Leaderboard
              </Link>
              <Link
                to="/achievements"
                className="text-white/90 hover:text-white px-3 py-2 text-sm font-semibold transition-all duration-200 hover:bg-white/10 rounded-xl backdrop-blur-lg border border-transparent hover:border-primary-500/30 focus:outline-none focus:ring-2 focus:ring-primary-500/30 whitespace-nowrap"
                aria-label="Navigate to Achievements"
              >
                Achievements
              </Link>
              <Link
                to="/privacy"
                className="text-white/90 hover:text-white px-3 py-2 text-sm font-semibold transition-all duration-200 hover:bg-white/10 rounded-xl backdrop-blur-lg border border-transparent hover:border-primary-500/30 focus:outline-none focus:ring-2 focus:ring-primary-500/30 whitespace-nowrap"
                aria-label="Navigate to Privacy Settings"
              >
                Privacy
              </Link>
            </nav>

            {/* Right side - Always visible */}
            <div className="flex items-center space-x-4 lg:space-x-6 flex-shrink-0">
              {user ? (
                <>
                  <span className="hidden xl:block bg-white/85 hover:bg-white/95 text-neutral-700 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border border-white/25 hover:border-white/35 backdrop-blur-xl">
                    Welcome, {user?.profile?.full_name || user?.email || "User"}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-white/85 hover:bg-white/95 text-neutral-700 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border border-white/25 hover:border-white/35 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-accent-500/20"
                    aria-label="Sign out of your account"
                    title="Sign out of your account"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="bg-gradient-primary text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-primary hover:shadow-primary-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 active:scale-[0.98]"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-500/20 active:scale-[0.98]"
                  >
                    Sign Up
                  </Link>
                </>
              )}

              {/* Mobile menu button - Always visible on mobile */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-white hover:bg-white/20 transition-colors duration-200"
                aria-label="Toggle mobile menu"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation - Always visible when open */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-white/20 py-4">
              <nav role="navigation" aria-label="Mobile navigation" className="flex flex-col space-y-3">
                <Link
                  to="/dashboard"
                  className="text-white/90 hover:text-white px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-white/10 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/portfolio"
                  className="text-white/90 hover:text-white px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-white/10 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Portfolio
                </Link>
                <Link
                  to="/suggestions"
                  className="text-white/90 hover:text-white px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-white/10 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  AI Suggestions
                </Link>
                <Link
                  to="/education"
                  className="text-white/90 hover:text-white px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-white/10 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Education
                </Link>
                <Link
                  to="/clubs"
                  className="text-white/90 hover:text-white px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-white/10 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Clubs
                </Link>
                <Link
                  to="/chat"
                  className="text-white/90 hover:text-white px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-white/10 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Chat
                </Link>
                <Link
                  to="/simulation"
                  className="text-white/90 hover:text-white px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-white/10 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Simulation
                </Link>
                <Link
                  to="/leaderboard"
                  className="text-white/90 hover:text-white px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-white/10 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Leaderboard
                </Link>
                <Link
                  to="/achievements"
                  className="text-white/90 hover:text-white px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-white/10 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Achievements
                </Link>
                <Link
                  to="/privacy"
                  className="text-white/90 hover:text-white px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-white/10 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Privacy
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;
