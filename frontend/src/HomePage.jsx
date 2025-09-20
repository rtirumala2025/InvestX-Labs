import React, { memo, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import Tooltip from '../components/ui/Tooltip';

// Lazy load heavy components
const Glossary = lazy(() => import('../components/education/Glossary'));

const HomePage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200 relative overflow-hidden">
      {/* Enhanced Apple-style background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent-100 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-gentle-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-gentle-float" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-50 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-gentle-float" style={{animationDelay: '8s'}}></div>
        <div className="absolute top-20 left-20 w-32 h-32 bg-accent-300 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-gentle-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-accent-400 rounded-full mix-blend-multiply filter blur-2xl opacity-25 animate-gentle-float" style={{animationDelay: '6s'}}></div>
      </div>

      {/* Skip Link for Accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Hero Section */}
      <section id="main-content" className="relative z-10 min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full">
          <div className="relative">
            {/* Main Hero Card */}
                        <GlassCard 
                          className="p-8 md:p-12 text-center animate-apple-fade"
                          variant="default"
                          padding="xl"
                          shadow="xl"
                          role="banner"
                          aria-label="main hero section"
                        >
                          <div className="max-w-4xl mx-auto">
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold text-neutral-900 mb-6 leading-tight tracking-tight">
                              Make money sense —{' '}
                              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-500 to-accent-600">
                                fast
                              </span>
            </h1>
                            
                            <p className="text-xl md:text-2xl text-neutral-600 mb-8 max-w-3xl mx-auto leading-relaxed font-light">
                              Personalized learning paths + real simulations — no judgment, only progress.
                            </p>
                
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              {user ? (
                                <GlassButton
                                  as={Link}
                  to="/dashboard"
                                  variant="primary"
                                  size="large"
                                  className="min-w-[200px] animate-apple-bounce"
                                  style={{animationDelay: '0.2s'}}
                >
                  Go to Dashboard
                                </GlassButton>
              ) : (
                <>
                                  <GlassButton
                                    as={Link}
                                    to="/diagnostic"
                                    variant="primary"
                                    size="large"
                                    className="min-w-[200px] animate-apple-bounce"
                                    style={{animationDelay: '0.2s'}}
                                  >
                                    Take the 1-minute quiz
                                  </GlassButton>
                                  <GlassButton
                                    as={Link}
                    to="/login"
                                    variant="outline"
                                    size="large"
                                    className="min-w-[200px] animate-apple-bounce"
                                    style={{animationDelay: '0.4s'}}
                  >
                    Sign In
                                  </GlassButton>
                </>
              )}
                            </div>

                            {/* Enhanced Trust Indicators */}
                            <div className="flex flex-wrap justify-center items-center gap-8 text-neutral-500 text-sm font-medium">
                              <div className="flex items-center gap-2 animate-apple-slide" style={{animationDelay: '0.6s'}}>
                                <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></div>
                                <span>Privacy-first</span>
                              </div>
                              <div className="flex items-center gap-2 animate-apple-slide" style={{animationDelay: '0.8s'}}>
                                <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></div>
                                <span>No jargon</span>
                              </div>
                              <div className="flex items-center gap-2 animate-apple-slide" style={{animationDelay: '1.0s'}}>
                                <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></div>
                                <span>Accessible</span>
                              </div>
                            </div>
              </div>
            </GlassCard>

            {/* Enhanced Preview Card */}
            <div className="mt-12 flex justify-center">
              <GlassCard 
                className="p-6 max-w-md animate-apple-slide"
                variant="subtle"
                padding="default"
                shadow="large"
                style={{animationDelay: '0.3s'}}
                interactive
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-apple animate-gentle-float">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">Quick Start</h3>
                  <p className="text-neutral-600 text-sm font-light">
                    Answer 3 simple questions to get your personalized learning path
                  </p>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-neutral-900 mb-4 tracking-tight animate-apple-fade">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto font-light animate-apple-fade" style={{animationDelay: '0.2s'}}>
              Comprehensive tools designed for real learning, not just trading
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <GlassCard 
              className="text-center p-8 animate-apple-slide"
              variant="default"
              padding="large"
              shadow="large"
              interactive
              style={{animationDelay: '0.4s'}}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-apple animate-gentle-float">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">Plain Language Learning</h3>
              <p className="text-neutral-600 font-light">
                Learn with clear explanations, not confusing jargon. Every term has a simple definition.
              </p>
            </GlassCard>

            <GlassCard 
              className="text-center p-8 animate-apple-slide"
              variant="default"
              padding="large"
              shadow="large"
              interactive
              style={{animationDelay: '0.6s'}}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-apple animate-gentle-float" style={{animationDelay: '2s'}}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">Real Practice</h3>
              <p className="text-neutral-600 font-light">
                Try budgeting, saving, and investing with safe simulations before using real money.
              </p>
            </GlassCard>

            <GlassCard 
              className="text-center p-8 animate-apple-slide"
              variant="default"
              padding="large"
              shadow="large"
              interactive
              style={{animationDelay: '0.8s'}}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-apple animate-gentle-float" style={{animationDelay: '4s'}}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">Smart Guidance</h3>
              <p className="text-neutral-600 font-light">
                Get personalized tips based on your goals and current situation, not generic advice.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <GlassCard 
            className="text-center p-12 animate-apple-fade"
            variant="accent"
            padding="xl"
            shadow="xl"
          >
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6 tracking-tight">
              Ready to make money sense?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto font-light">
              Join thousands of people learning to manage money better — no pressure, just progress.
            </p>
            
            {/* Clear Pricing Information */}
            <div className="mb-8 p-6 bg-white/10 rounded-2xl backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-2">100% Free to Start</h3>
              <p className="text-white/80 text-sm">
                No hidden fees, no credit card required. Premium features available later with transparent pricing.
              </p>
            </div>

            {!user && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <GlassButton
                  as={Link}
                  to="/diagnostic"
                  variant="primary"
                  size="large"
                  className="min-w-[200px] animate-apple-bounce"
                  style={{animationDelay: '0.2s'}}
                >
                  Start Learning Free
                </GlassButton>
                <GlassButton
                  as={Link}
                  to="/login"
                  variant="secondary"
                  size="large"
                  className="min-w-[200px] text-white border-white/30 hover:bg-white/10 animate-apple-bounce"
                  style={{animationDelay: '0.4s'}}
                >
                  Sign In
                </GlassButton>
              </div>
            )}
            
            {/* Enhanced Privacy Notice */}
            <div className="mt-8 text-white/70 text-sm">
              <div className="flex flex-wrap justify-center items-center gap-6">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>No bank account required</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Your data stays private</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Cancel anytime</span>
          </div>
        </div>
      </div>
          </GlassCard>
        </div>
      </section>
    </div>
  );
};

export default memo(HomePage);
