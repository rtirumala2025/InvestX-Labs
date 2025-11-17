import React from "react";
import { Link } from "react-router-dom";
import GlassCard from "../ui/GlassCard";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-t from-gray-950 via-gray-900 to-gray-950 border-t border-white/10">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-orange-500/5" />
      <GlassCard
        variant="subtle"
        padding="none"
        className="relative z-10 rounded-none border-0 border-t border-white/10"
      >
        <div className="footer-content">
          <div className="footer-brand">
            <h3 className="footer-logo">InvestX Labs</h3>
            <p className="footer-description">
              Learn to invest with confidence. Master money management through
              personalized lessons, risk-free practice, and AI-powered guidance
              designed for students and young professionals.
            </p>
            <div className="footer-social">
              <a href="#" className="social-link" aria-label="Twitter">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="social-link" aria-label="LinkedIn">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h4 className="footer-title">Product</h4>
              <Link to="/dashboard" className="footer-link">
                Dashboard
              </Link>
              <Link to="/portfolio" className="footer-link">
                Portfolio
              </Link>
              <Link to="/education" className="footer-link">
                Education
              </Link>
              <Link to="/suggestions" className="footer-link">
                AI Insights
              </Link>
            </div>

            <div className="footer-column">
              <h4 className="footer-title">Support</h4>
              <a href="#" className="footer-link">
                Help Center
              </a>
              <a href="#" className="footer-link">
                Contact Us
              </a>
              <Link to="/privacy" className="footer-link">
                Privacy Policy
              </Link>
              <a href="#" className="footer-link">
                Terms of Service
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-disclaimer">
            © 2024 InvestX Labs. All rights reserved. This is for educational
            purposes only.
          </p>
        </div>
      </GlassCard>
    </footer>
  );
};

export default Footer;
