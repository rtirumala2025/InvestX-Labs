import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Header = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="bg-white/85 backdrop-blur-xl border-b border-white/25 sticky top-0 z-50 shadow-apple">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Always visible */}
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0">
                <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">InvestX Labs</h1>
              </Link>
            </div>
          
            {/* Desktop Navigation - Always visible */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                to="/dashboard" 
                className="text-neutral-700 hover:text-accent-600 px-3 py-2 text-sm font-medium transition-all duration-200 hover:underline decoration-accent-500/30 underline-offset-4 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:ring-offset-2 rounded-lg"
              >
                Dashboard
              </Link>
              <Link 
                to="/portfolio" 
                className="text-neutral-700 hover:text-accent-600 px-3 py-2 text-sm font-medium transition-all duration-200 hover:underline decoration-accent-500/30 underline-offset-4 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:ring-offset-2 rounded-lg"
              >
                Portfolio
              </Link>
              <Link 
                to="/suggestions" 
                className="text-neutral-700 hover:text-accent-600 px-3 py-2 text-sm font-medium transition-all duration-200 hover:underline decoration-accent-500/30 underline-offset-4 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:ring-offset-2 rounded-lg"
              >
                AI Suggestions
              </Link>
              <Link 
                to="/education" 
                className="text-neutral-700 hover:text-accent-600 px-3 py-2 text-sm font-medium transition-all duration-200 hover:underline decoration-accent-500/30 underline-offset-4 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:ring-offset-2 rounded-lg"
              >
                Education
              </Link>
              <Link 
                to="/chat" 
                className="text-neutral-700 hover:text-accent-600 px-3 py-2 text-sm font-medium transition-all duration-200 hover:underline decoration-accent-500/30 underline-offset-4 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:ring-offset-2 rounded-lg"
              >
                💬 Chat
              </Link>
              <Link 
                to="/privacy" 
                className="text-neutral-700 hover:text-accent-600 px-3 py-2 text-sm font-medium transition-all duration-200 hover:underline decoration-accent-500/30 underline-offset-4 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:ring-offset-2 rounded-lg"
              >
                Privacy
              </Link>
            </nav>

            {/* Right side - Always visible */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="hidden lg:block text-sm text-neutral-600 font-medium">
                    Welcome, {user.displayName || user.email}
                  </span>
                  <button
                    onClick={logout}
                    className="bg-white/85 hover:bg-white/95 text-neutral-700 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border border-white/25 hover:border-white/35 backdrop-blur-xl shadow-apple hover:shadow-apple-lg focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:ring-offset-2"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-neutral-700 hover:text-accent-600 px-3 py-2 text-sm font-medium transition-all duration-200 hover:underline decoration-accent-500/30 underline-offset-4 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:ring-offset-2 rounded-lg"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-apple hover:shadow-apple-lg focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:ring-offset-2 active:scale-[0.98]"
                  >
                    Sign Up
                  </Link>
                </>
              )}
              
              {/* Mobile menu button - Always visible on mobile */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-neutral-700 hover:bg-white/20 transition-colors duration-200"
                aria-label="Toggle mobile menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
          
          {/* Mobile Navigation - Always visible when open */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-white/20 py-4">
              <nav className="flex flex-col space-y-2">
                <Link 
                  to="/dashboard" 
                  className="text-neutral-700 hover:text-accent-600 px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-white/10 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/portfolio" 
                  className="text-neutral-700 hover:text-accent-600 px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-white/10 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Portfolio
                </Link>
                <Link 
                  to="/suggestions" 
                  className="text-neutral-700 hover:text-accent-600 px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-white/10 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  AI Suggestions
                </Link>
                <Link 
                  to="/education" 
                  className="text-neutral-700 hover:text-accent-600 px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-white/10 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Education
                </Link>
                <Link 
                  to="/chat" 
                  className="text-neutral-700 hover:text-accent-600 px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-white/10 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  💬 Chat
                </Link>
                <Link 
                  to="/privacy" 
                  className="text-neutral-700 hover:text-accent-600 px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-white/10 rounded-lg"
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
