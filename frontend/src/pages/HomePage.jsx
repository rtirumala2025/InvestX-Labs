import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useFirestore } from '../hooks/useFirestore';

export default function HomePage() {
  const { documents: features = [], loading } = useFirestore('landingFeatures');

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
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-purple-300 to-orange-300">
          InvestX Labs
        </h1>
        <p className="text-lg md:text-2xl max-w-2xl text-gray-300 leading-relaxed mb-10">
          Learn. Practice. Grow. — A modern investing simulation app that makes finance approachable, interactive, and fun.
        </p>

        <Button
          as={Link}
          to="/signup"
          className="px-8 py-4 text-lg rounded-2xl shadow-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 transition"
        >
          Get Started
        </Button>
      </motion.section>

      {/* Feature Cards */}
      <section className="relative z-10 px-6 max-w-6xl mx-auto pb-20">
        <motion.div
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-purple-300 to-orange-300">
            Why Choose Our Platform?
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(loading ? Array.from({ length: 3 }).map((_, i) => ({ id: `skeleton-${i}`, title: 'Loading…', text: 'Please wait' })) : features)
            .map((f, i) => (
              <motion.div
                key={f.id || i}
                variants={fadeIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="backdrop-blur-xl bg-white/5 border-white/10 rounded-2xl shadow-lg hover:shadow-xl transition">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-3 text-white/90">{f.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{f.text}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
        </div>
      </section>
    </div>
  );
}