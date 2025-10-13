import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import SimpleHeader from '../components/common/SimpleHeader';

const PrivacyPage = () => {
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

      <SimpleHeader />
      
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-purple-300 to-orange-300 mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </motion.div>

        <div className="space-y-8">
          <GlassCard className="p-8" variant="light" padding="large" shadow="large">
            <h2 className="text-2xl font-semibold text-white mb-6">1. Information We Collect</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                We collect information that you provide directly to us, such as when you create an account, 
                complete your profile, or communicate with us. This may include:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Account information (name, email, username)</li>
                <li>Profile information (age, investment goals, risk tolerance)</li>
                <li>Content you submit (questions, feedback, survey responses)</li>
                <li>Communication preferences</li>
              </ul>
              <p>
                We also automatically collect certain information about your device and usage of our services, 
                including IP address, browser type, and usage data through cookies and similar technologies.
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-8" variant="light" padding="large" shadow="large">
            <h2 className="text-2xl font-semibold text-white mb-6">2. How We Use Your Information</h2>
            <div className="space-y-4 text-gray-300">
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Personalize your experience and content</li>
                <li>Process transactions and send related information</li>
                <li>Respond to your comments, questions, and requests</li>
                <li>Send technical notices, updates, and support messages</li>
                <li>Monitor and analyze trends, usage, and activities</li>
                <li>Detect, investigate, and prevent fraudulent transactions</li>
              </ul>
            </div>
          </GlassCard>

          <GlassCard className="p-8" variant="light" padding="large" shadow="large">
            <h2 className="text-2xl font-semibold text-white mb-6">3. Information Sharing</h2>
            <div className="space-y-4 text-gray-300">
              <p>We do not share your personal information with third parties except:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>With your consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect and defend our rights and property</li>
                <li>With service providers who assist us in operating our services</li>
                <li>In connection with a merger, sale, or asset transfer</li>
              </ul>
            </div>
          </GlassCard>

          <GlassCard className="p-8" variant="light" padding="large" shadow="large">
            <h2 className="text-2xl font-semibold text-white mb-6">4. Your Rights and Choices</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Access and Update</h3>
                <p className="text-gray-300">
                  You can access and update your account information at any time through your account settings.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Data Portability</h3>
                <p className="text-gray-300">
                  You can request a copy of your personal data in a structured, machine-readable format.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Deletion</h3>
                <p className="text-gray-300">
                  You can request deletion of your account and personal data at any time.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Cookies</h3>
                <p className="text-gray-300">
                  You can set your browser to refuse all or some browser cookies. However, if you disable or refuse 
                  cookies, some parts of our services may become inaccessible or not function properly.
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-8" variant="light" padding="large" shadow="large">
            <h2 className="text-2xl font-semibold text-white mb-6">5. Data Security</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                We implement appropriate technical and organizational measures to protect your personal information 
                against unauthorized access, alteration, disclosure, or destruction. However, no internet transmission 
                or electronic storage is completely secure, so we cannot guarantee absolute security.
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-8" variant="light" padding="large" shadow="large">
            <h2 className="text-2xl font-semibold text-white mb-6">6. Children's Privacy</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                Our services are not intended for children under 13 years of age. We do not knowingly collect 
                personal information from children under 13. If we learn we have collected personal information 
                from a child under 13, we will delete that information as soon as possible.
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-8" variant="light" padding="large" shadow="large">
            <h2 className="text-2xl font-semibold text-white mb-6">7. Changes to This Policy</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                We may update this privacy policy from time to time. We will notify you of any changes by posting 
                the new privacy policy on this page and updating the "Last Updated" date at the top of this policy.
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-8" variant="light" padding="large" shadow="large">
            <h2 className="text-2xl font-semibold text-white mb-6">8. Contact Us</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                If you have any questions about this privacy policy or our information practices, please contact us at:
              </p>
              <div className="space-y-2">
                <p>InvestX Labs</p>
                <p>Email: privacy@investxlabs.com</p>
                <p>Address: 123 Finance Street, New York, NY 10001</p>
              </div>
              <p className="pt-4">
                For data protection inquiries, please contact our Data Protection Officer at dpo@investxlabs.com
              </p>
            </div>
          </GlassCard>
        </div>
      </main>

      <footer className="relative z-10 py-8 text-center text-gray-400 text-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p>© {new Date().getFullYear()} InvestX Labs. All rights reserved.</p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPage;
