import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';

export default function HomePage() {
  // Static feature data - no need for Firestore dependency
  const features = [
    { 
      id: 'feature-1', 
      title: 'Plain Language Learning', 
      text: 'Learn with clear explanations, not confusing jargon. Every term has a simple definition.' 
    },
    { 
      id: 'feature-2', 
      title: 'Real Practice', 
      text: 'Try budgeting, saving, and investing with safe simulations before using real money.' 
    },
    { 
      id: 'feature-3', 
      title: 'Smart Guidance', 
      text: 'Get personalized tips based on your goals and current situation, not generic advice.' 
    }
  ];

  const fadeIn = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden font-sans">

      {/* Floating gradient orbs */}
      <motion.div
        className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-r from-blue-500/40 to-purple-500/30 rounded-full blur-3xl"
        animate={{ y: [0, 20, 0] }}
        transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-40 right-0 w-[28rem] h-[28rem] bg-gradient-to-r from-orange-400/30 to-pink-400/20 rounded-full blur-3xl"
        animate={{ y: [0, -30, 0] }}
        transition={{ repeat: Infinity, duration: 18, ease: 'easeInOut' }}
      />

      {/* Hero Section */}
      <motion.section
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] text-center px-6"
      >
        {/* Additional Moving Gradient Orbs */}
        <motion.div
          className="absolute w-64 h-64 bg-gradient-to-r from-green-400/20 to-blue-400/15 rounded-full blur-3xl"
          animate={{
            x: [0, 150, -100, 80, 0],
            y: [0, -120, 80, -60, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ right: '10%', top: '20%' }}
        />
        <motion.div
          className="absolute w-80 h-80 bg-gradient-to-r from-purple-400/25 to-pink-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, -120, 100, -80, 0],
            y: [0, 100, -80, 60, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
          style={{ left: '5%', bottom: '10%' }}
        />
        <motion.div
          className="absolute w-56 h-56 bg-gradient-to-r from-yellow-400/15 to-orange-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, 80, -150, 120, 0],
            y: [0, -80, 120, -100, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 10
          }}
          style={{ right: '20%', bottom: '15%' }}
        />
        <motion.div
          className="absolute w-72 h-72 bg-gradient-to-r from-cyan-400/20 to-blue-500/15 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 120, -90, 0],
            y: [0, 90, -110, 70, 0],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 15
          }}
          style={{ left: '60%', top: '30%' }}
        />

        <h1 className="relative z-10 text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-purple-300 to-orange-300">
          InvestX Labs
        </h1>
        <p className="relative z-10 text-lg md:text-2xl max-w-2xl text-gray-300 leading-relaxed mb-10">
          Learn. Practice. Grow. — A modern investing simulation app that makes finance approachable, interactive, and fun.
        </p>

        <GlassButton
          as={Link}
          to="/signup"
          variant="primary"
          size="large"
          className="relative z-10"
        >
          Get Started
        </GlassButton>
      </motion.section>

      {/* Feature Cards */}
      <section className="relative z-10 px-6 max-w-6xl mx-auto pb-12">
        <motion.div
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-purple-300 to-orange-300">
            Why Choose Our Platform?
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, i) => (
              <motion.div
                key={f.id || i}
                variants={fadeIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                transition={{ delay: i * 0.08 }}
              >
                <GlassCard 
                  variant="default" 
                  padding="large" 
                  shadow="large" 
                  interactive={true}
                  parallax={true}
                  className="h-full"
                >
                  <h3 className="text-xl font-semibold mb-3 text-white/90">{f.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{f.text}</p>
                </GlassCard>
              </motion.div>
            ))}
        </div>

        {/* Animated Scroll Arrow */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center mt-8"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="cursor-pointer"
            onClick={() => {
              document.querySelector('#services-section')?.scrollIntoView({ 
                behavior: 'smooth' 
              });
            }}
          >
            <GlassCard 
              variant="floating" 
              padding="none" 
              interactive={true}
              className="w-12 h-12 flex items-center justify-center cursor-pointer group"
            >
              <svg 
                className="w-6 h-6 text-white/70 group-hover:text-white transition-colors duration-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 14l-7 7m0 0l-7-7m7 7V3" 
                />
              </svg>
            </GlassCard>
          </motion.div>
        </motion.div>
      </section>

      {/* Services Overview Section */}
      <section id="services-section" className="relative z-10 px-6 max-w-6xl mx-auto pb-20">
        <motion.div
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-purple-300 to-orange-300">
            Our Services
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard 
              variant="hero" 
              padding="large" 
              shadow="xl" 
              interactive={true}
              glow={true}
              parallax={true}
              className="text-center h-full group"
            >
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500/80 to-blue-600/80 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-lg border border-blue-400/30 shadow-lg shadow-blue-500/20 group-hover:shadow-xl group-hover:shadow-blue-500/30 transition-all duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-white/95 group-hover:text-white transition-colors duration-300">Investment Education</h3>
                <p className="text-gray-300 leading-relaxed mb-6 group-hover:text-gray-200 transition-colors duration-300">
                  Master the fundamentals of investing with our comprehensive educational modules and interactive lessons.
                </p>
                <GlassButton
                  as={Link}
                  to="/education"
                  variant="accent"
                  size="default"
                  className="group-hover:scale-105 transition-transform duration-300"
                >
                  Learn More
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard 
              variant="hero" 
              padding="large" 
              shadow="xl" 
              interactive={true}
              glow={true}
              parallax={true}
              className="text-center h-full group"
            >
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500/80 to-green-600/80 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-lg border border-green-400/30 shadow-lg shadow-green-500/20 group-hover:shadow-xl group-hover:shadow-green-500/30 transition-all duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-white/95 group-hover:text-white transition-colors duration-300">Portfolio Simulation</h3>
                <p className="text-gray-300 leading-relaxed mb-6 group-hover:text-gray-200 transition-colors duration-300">
                  Practice building and managing investment portfolios with real market data in a risk-free environment.
                </p>
                <GlassButton
                  as={Link}
                  to="/portfolio"
                  variant="accent"
                  size="default"
                  className="group-hover:scale-105 transition-transform duration-300"
                >
                  Learn More
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard 
              variant="hero" 
              padding="large" 
              shadow="xl" 
              interactive={true}
              glow={true}
              parallax={true}
              className="text-center h-full group"
            >
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500/80 to-purple-600/80 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-lg border border-purple-400/30 shadow-lg shadow-purple-500/20 group-hover:shadow-xl group-hover:shadow-purple-500/30 transition-all duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-white/95 group-hover:text-white transition-colors duration-300">AI-Powered Insights</h3>
                <p className="text-gray-300 leading-relaxed mb-6 group-hover:text-gray-200 transition-colors duration-300">
                  Get personalized investment suggestions and market analysis powered by advanced AI technology.
                </p>
                <GlassButton
                  as={Link}
                  to="/suggestions"
                  variant="accent"
                  size="default"
                  className="group-hover:scale-105 transition-transform duration-300"
                >
                  Learn More
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

    </div>
  );
}