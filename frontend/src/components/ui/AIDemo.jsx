import React, { useState } from 'react';
import GlassButton from './GlassButton';
import GlassCard from './GlassCard';
import './AIDemo.css';

const AIDemo = () => {
  const [formData, setFormData] = useState({
    budget: '',
    riskTolerance: '',
    interests: ''
  });
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.budget || formData.budget < 100) {
      newErrors.budget = 'Please enter a budget of at least $100';
    }
    
    if (!formData.riskTolerance) {
      newErrors.riskTolerance = 'Please select your risk tolerance';
    }
    
    if (!formData.interests.trim()) {
      newErrors.interests = 'Please tell us about your interests';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateRecommendations = () => {
    if (!validateForm()) {
      // Add shake animation to form
      const form = document.querySelector('.ai-demo-form');
      if (form) {
        form.classList.add('shake');
        setTimeout(() => form.classList.remove('shake'), 500);
      }
      return;
    }

    setLoading(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const budget = parseInt(formData.budget);
      const risk = formData.riskTolerance;
      const interests = formData.interests.toLowerCase();
      
      let recommendations = {
        portfolio: [],
        strategy: '',
        tips: []
      };
      
      // Generate recommendations based on inputs
      if (risk === 'conservative') {
        recommendations.portfolio = [
          { name: 'Vanguard Total Stock Market (VTI)', allocation: '60%', reason: 'Broad market exposure with low fees' },
          { name: 'Vanguard Total Bond Market (BND)', allocation: '30%', reason: 'Stable income and capital preservation' },
          { name: 'Vanguard Real Estate (VNQ)', allocation: '10%', reason: 'Diversification and inflation hedge' }
        ];
        recommendations.strategy = 'Conservative Growth';
        recommendations.tips = [
          'Focus on dividend-paying stocks for steady income',
          'Consider high-yield savings accounts for emergency fund',
          'Rebalance quarterly to maintain target allocation'
        ];
      } else if (risk === 'moderate') {
        recommendations.portfolio = [
          { name: 'Vanguard Total Stock Market (VTI)', allocation: '70%', reason: 'Core equity exposure' },
          { name: 'Vanguard International Stock (VXUS)', allocation: '20%', reason: 'Global diversification' },
          { name: 'Vanguard Total Bond Market (BND)', allocation: '10%', reason: 'Stability and income' }
        ];
        recommendations.strategy = 'Balanced Growth';
        recommendations.tips = [
          'Mix of growth and value stocks for balanced returns',
          'Consider sector-specific ETFs based on your interests',
          'Regular contributions to dollar-cost average'
        ];
      } else {
        recommendations.portfolio = [
          { name: 'Vanguard Total Stock Market (VTI)', allocation: '50%', reason: 'Broad market foundation' },
          { name: 'Vanguard Growth ETF (VUG)', allocation: '30%', reason: 'High-growth potential' },
          { name: 'Individual Growth Stocks', allocation: '20%', reason: 'Targeted opportunities' }
        ];
        recommendations.strategy = 'Aggressive Growth';
        recommendations.tips = [
          'Focus on growth stocks and emerging markets',
          'Consider thematic ETFs aligned with your interests',
          'Higher volatility but potential for greater returns'
        ];
      }
      
      // Add interest-specific recommendations
      if (interests.includes('tech')) {
        recommendations.portfolio.push({ name: 'Technology Sector ETF (XLK)', allocation: '5%', reason: 'Direct exposure to tech innovation' });
      }
      if (interests.includes('sustainable') || interests.includes('green')) {
        recommendations.portfolio.push({ name: 'ESG ETF (ESG)', allocation: '5%', reason: 'Sustainable and responsible investing' });
      }
      
      setRecommendations(recommendations);
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="ai-demo">
      <div className="ai-demo-header">
        <h2 className="ai-demo-title">Get Your Personalized Investment Plan</h2>
        <p className="ai-demo-subtitle">
          Our AI analyzes your goals and creates a custom portfolio strategy just for you
        </p>
      </div>

      <div className="ai-demo-content">
        <GlassCard className="ai-demo-form" variant="default" padding="xl">
          <div className="form-group">
            <label htmlFor="budget" className="form-label">Investment Budget</label>
            <input
              type="number"
              id="budget"
              name="budget"
              value={formData.budget}
              onChange={handleInputChange}
              className={`glass-input ${errors.budget ? 'error' : ''}`}
              placeholder="Enter amount in USD (e.g., 1000)"
              min="100"
            />
            {errors.budget && <span className="error-message">{errors.budget}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="riskTolerance" className="form-label">Risk Tolerance</label>
            <select
              id="riskTolerance"
              name="riskTolerance"
              value={formData.riskTolerance}
              onChange={handleInputChange}
              className={`glass-select ${errors.riskTolerance ? 'error' : ''}`}
            >
              <option value="">Choose your risk tolerance</option>
              <option value="conservative">Conservative - Steady, low-risk growth</option>
              <option value="moderate">Moderate - Balanced growth and stability</option>
              <option value="aggressive">Aggressive - High growth potential</option>
            </select>
            {errors.riskTolerance && <span className="error-message">{errors.riskTolerance}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="interests" className="form-label">Investment Interests</label>
            <textarea
              id="interests"
              name="interests"
              value={formData.interests}
              onChange={handleInputChange}
              className={`glass-input ${errors.interests ? 'error' : ''}`}
              placeholder="Describe your investment interests (e.g., technology, sustainable investing, real estate)"
              rows="3"
            />
            {errors.interests && <span className="error-message">{errors.interests}</span>}
          </div>

          <GlassButton
            onClick={generateRecommendations}
            loading={loading}
            size="xl"
            variant="primary"
            className="ai-demo-button"
          >
            {loading ? 'Analyzing Your Profile...' : 'Get My Investment Plan'}
          </GlassButton>
        </GlassCard>

        {recommendations && (
          <GlassCard className="ai-recommendations" variant="accent" padding="xl">
            <div className="recommendations-header">
              <h3 className="recommendations-title">Your Personalized Investment Strategy</h3>
              <div className="strategy-badge">{recommendations.strategy}</div>
            </div>

            <div className="portfolio-section">
              <h4 className="section-title">Recommended Portfolio</h4>
              <div className="portfolio-items">
                {recommendations.portfolio.map((item, index) => (
                  <div key={index} className="portfolio-item">
                    <div className="portfolio-item-header">
                      <span className="portfolio-name">{item.name}</span>
                      <span className="portfolio-allocation">{item.allocation}</span>
                    </div>
                    <p className="portfolio-reason">{item.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="tips-section">
              <h4 className="section-title">Investment Tips</h4>
              <ul className="tips-list">
                {recommendations.tips.map((tip, index) => (
                  <li key={index} className="tip-item">{tip}</li>
                ))}
              </ul>
            </div>

            <div className="disclaimer">
              <p>
                <strong>Educational Purpose:</strong> This is a simulation for learning only. 
                Always consult a financial advisor before making real investment decisions.
              </p>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default AIDemo;
