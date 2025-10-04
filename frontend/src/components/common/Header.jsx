import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Header = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`
        sticky top-0 z-50 transition-all duration-300 ease-out
        ${scrolled 
          ? 'bg-white/8 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/20 shadow-2xl shadow-black/10' 
          : 'bg-white/5 backdrop-blur-xl backdrop-saturate-125 border-b border-white/10 shadow-xl shadow-black/5'
        }
      `}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Always visible */}
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 group">
                <h1 className="text-2xl font-semibold text-white tracking-tight bg-gradient-to-r from-blue-300 via-purple-300 to-orange-300 bg-clip-text text-transparent group-hover:from-blue-200 group-hover:via-purple-200 group-hover:to-orange-200 transition-all duration-300">
                  InvestX Labs
                </h1>
              </Link>
            </div>
          
            {/* Desktop Navigation - Always visible */}
            <nav className="hidden md:flex items-center space-x-2">
              <Link 
                to="/dashboard" 
                className="text-white/80 hover:text-white px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-white/10 rounded-xl backdrop-blur-lg border border-transparent hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2 focus:ring-offset-transparent"
              >
                Dashboard
              </Link>
              <Link 
                to="/portfolio" 
                className="text-white/80 hover:text-white px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-white/10 rounded-xl backdrop-blur-lg border border-transparent hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2 focus:ring-offset-transparent"
              >
                Portfolio
              </Link>
              <Link 
                to="/suggestions" 
                className="text-white/80 hover:text-white px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-white/10 rounded-xl backdrop-blur-lg border border-transparent hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2 focus:ring-offset-transparent"
              >
                AI Suggestions
              </Link>
              <Link 
                to="/education" 
                className="text-white/80 hover:text-white px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-white/10 rounded-xl backdrop-blur-lg border border-transparent hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2 focus:ring-offset-transparent"
              >
                Education
              </Link>
              <Link 
                to="/chat" 
                className="text-white/80 hover:text-white px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-white/10 rounded-xl backdrop-blur-lg border border-transparent hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2 focus:ring-offset-transparent"
              >
                💬 Chat
              </Link>
              <Link 
                to="/privacy" 
                className="text-white/80 hover:text-white px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-white/10 rounded-xl backdrop-blur-lg border border-transparent hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2 focus:ring-offset-transparent"
              >
                Privacy
              </Link>
            </nav>

            {/* Right side - Always visible */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="hidden lg:block bg-white/85 hover:bg-white/95 text-neutral-700 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border border-white/25 hover:border-white/35 backdrop-blur-xl shadow-apple hover:shadow-apple-lg">
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
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-apple hover:shadow-apple-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 active:scale-[0.98]"
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
