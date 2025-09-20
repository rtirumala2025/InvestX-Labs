import React from 'react';
import './PhoneMockup.css';

const PhoneMockup = ({ className = '' }) => {
  return (
    <div className={`phone-mockup ${className}`}>
      <div className="phone-screen">
        {/* Status Bar */}
        <div className="phone-status-bar">
          <div className="status-left">
            <span className="time">9:41</span>
          </div>
          <div className="status-right">
            <div className="signal-bars">
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
            </div>
            <div className="wifi-icon">
              <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
                <path d="M7.5 0C3.36 0 0 3.36 0 7.5h2C2 4.46 4.46 2 7.5 2s5.5 2.46 5.5 5.5h2C15 3.36 11.64 0 7.5 0z" fill="white"/>
                <path d="M7.5 4C5.57 4 4 5.57 4 7.5h2C6 6.67 6.67 6 7.5 6s1.5.67 1.5 1.5h2C11 5.57 9.43 4 7.5 4z" fill="white"/>
                <path d="M7.5 6.5C7.22 6.5 7 6.72 7 7s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5z" fill="white"/>
              </svg>
            </div>
            <div className="battery">
              <div className="battery-level"></div>
            </div>
          </div>
        </div>

        {/* App Content */}
        <div className="phone-content">
          {/* Header */}
          <div className="app-header">
            <h1 className="app-title">InvestX Labs</h1>
            <div className="notification-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="white"/>
              </svg>
            </div>
          </div>

          {/* Portfolio Balance */}
          <div className="portfolio-balance">
            <div className="balance-label">Total Portfolio</div>
            <div className="balance-amount">$1,247.82</div>
            <div className="balance-change positive">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M7 14l5-5 5 5" stroke="#32D74B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              +12.4% this month
            </div>
          </div>

          {/* AI Recommendation Card */}
          <div className="ai-recommendation">
            <div className="ai-header">
              <div className="ai-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="ai-title">AI Insight</div>
            </div>
            <div className="ai-message">
              Great job diversifying! Consider adding more growth stocks to your portfolio.
            </div>
          </div>

          {/* Holdings List */}
          <div className="holdings-section">
            <div className="section-title">Your Holdings</div>
            
            <div className="holding-item">
              <div className="holding-info">
                <div className="holding-symbol">AAPL</div>
                <div className="holding-name">Apple Inc.</div>
                <div className="holding-shares">2 shares</div>
              </div>
              <div className="holding-value">
                <div className="holding-price">$189.43</div>
                <div className="holding-change positive">+2.1%</div>
              </div>
            </div>

            <div className="holding-item">
              <div className="holding-info">
                <div className="holding-symbol">VTI</div>
                <div className="holding-name">Vanguard Total</div>
                <div className="holding-shares">8 shares</div>
              </div>
              <div className="holding-value">
                <div className="holding-price">$234.12</div>
                <div className="holding-change positive">+1.8%</div>
              </div>
            </div>

            <div className="holding-item">
              <div className="holding-info">
                <div className="holding-symbol">TSLA</div>
                <div className="holding-name">Tesla Inc.</div>
                <div className="holding-shares">1 share</div>
              </div>
              <div className="holding-value">
                <div className="holding-price">$208.87</div>
                <div className="holding-change negative">-0.5%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneMockup;
