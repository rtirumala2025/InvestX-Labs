/**
 * Risk profiles data
 */

export const RISK_PROFILES = {
  CONSERVATIVE: {
    id: 'conservative',
    name: 'Conservative',
    description: 'Focus on capital preservation with minimal risk',
    riskTolerance: 'Very Low',
    riskScore: 20,
    characteristics: [
      'Capital preservation priority',
      'Low volatility tolerance',
      'Steady income focus',
      'Short to medium time horizon'
    ],
    investmentPreferences: {
      assetTypes: ['Bonds', 'Cash', 'CDs', 'Money Market'],
      sectors: ['Utilities', 'Consumer Staples', 'Healthcare'],
      timeHorizon: '1-5 years',
      volatilityTolerance: 'Very Low'
    },
    portfolioAllocation: {
      stocks: 20,
      bonds: 60,
      cash: 15,
      alternatives: 5
    },
    expectedReturn: '3-5%',
    maxDrawdown: '5-10%',
    suitableFor: [
      'Retirees',
      'Risk-averse individuals',
      'Short-term goals',
      'Income-focused investors'
    ],
    exampleInvestments: [
      'Government bonds',
      'High-grade corporate bonds',
      'Dividend-paying blue-chip stocks',
      'Money market funds',
      'CDs'
    ]
  },
  
  MODERATE: {
    id: 'moderate',
    name: 'Moderate',
    description: 'Balanced approach with moderate risk and growth',
    riskTolerance: 'Low to Medium',
    riskScore: 40,
    characteristics: [
      'Balanced risk-return approach',
      'Moderate volatility tolerance',
      'Growth and income focus',
      'Medium time horizon'
    ],
    investmentPreferences: {
      assetTypes: ['Stocks', 'Bonds', 'REITs', 'ETFs'],
      sectors: ['Technology', 'Healthcare', 'Financial', 'Consumer'],
      timeHorizon: '5-10 years',
      volatilityTolerance: 'Low to Medium'
    },
    portfolioAllocation: {
      stocks: 50,
      bonds: 40,
      cash: 5,
      alternatives: 5
    },
    expectedReturn: '5-7%',
    maxDrawdown: '10-15%',
    suitableFor: [
      'Middle-aged investors',
      'Balanced risk tolerance',
      'Medium-term goals',
      'Growth and income focus'
    ],
    exampleInvestments: [
      'Large-cap stocks',
      'Investment-grade bonds',
      'REITs',
      'Balanced mutual funds',
      'Index funds'
    ]
  },
  
  BALANCED: {
    id: 'balanced',
    name: 'Balanced',
    description: 'Growth-oriented with moderate risk management',
    riskTolerance: 'Medium',
    riskScore: 60,
    characteristics: [
      'Growth-focused approach',
      'Moderate risk management',
      'Long-term perspective',
      'Medium to high volatility tolerance'
    ],
    investmentPreferences: {
      assetTypes: ['Stocks', 'Bonds', 'REITs', 'International'],
      sectors: ['Technology', 'Healthcare', 'Financial', 'Industrial'],
      timeHorizon: '10-15 years',
      volatilityTolerance: 'Medium'
    },
    portfolioAllocation: {
      stocks: 70,
      bonds: 25,
      cash: 3,
      alternatives: 2
    },
    expectedReturn: '7-9%',
    maxDrawdown: '15-20%',
    suitableFor: [
      'Young to middle-aged investors',
      'Long-term goals',
      'Growth focus',
      'Moderate risk tolerance'
    ],
    exampleInvestments: [
      'Growth stocks',
      'Small-cap stocks',
      'International stocks',
      'Corporate bonds',
      'Sector ETFs'
    ]
  },
  
  AGGRESSIVE: {
    id: 'aggressive',
    name: 'Aggressive',
    description: 'Maximum growth potential with higher risk tolerance',
    riskTolerance: 'High',
    riskScore: 80,
    characteristics: [
      'High growth potential focus',
      'High volatility tolerance',
      'Long-term perspective',
      'Risk-tolerant approach'
    ],
    investmentPreferences: {
      assetTypes: ['Stocks', 'Growth Stocks', 'Small-cap', 'International'],
      sectors: ['Technology', 'Biotech', 'Emerging Markets', 'Growth'],
      timeHorizon: '15+ years',
      volatilityTolerance: 'High'
    },
    portfolioAllocation: {
      stocks: 85,
      bonds: 10,
      cash: 3,
      alternatives: 2
    },
    expectedReturn: '9-12%',
    maxDrawdown: '20-30%',
    suitableFor: [
      'Young investors',
      'High risk tolerance',
      'Long-term goals',
      'Growth maximization'
    ],
    exampleInvestments: [
      'Growth stocks',
      'Small-cap stocks',
      'Emerging market stocks',
      'Technology stocks',
      'High-yield bonds'
    ]
  }
};

export const RISK_FACTORS = {
  MARKET_RISK: {
    name: 'Market Risk',
    description: 'Risk of losses due to overall market movements',
    impact: 'High',
    mitigation: [
      'Diversification',
      'Asset allocation',
      'Dollar-cost averaging',
      'Long-term perspective'
    ]
  },
  
  INTEREST_RATE_RISK: {
    name: 'Interest Rate Risk',
    description: 'Risk of losses due to changes in interest rates',
    impact: 'Medium',
    mitigation: [
      'Bond laddering',
      'Floating rate securities',
      'Short-term bonds',
      'Interest rate hedging'
    ]
  },
  
  INFLATION_RISK: {
    name: 'Inflation Risk',
    description: 'Risk of purchasing power erosion due to inflation',
    impact: 'Medium',
    mitigation: [
      'TIPS (Treasury Inflation-Protected Securities)',
      'Real estate investments',
      'Commodities',
      'Growth stocks'
    ]
  },
  
  CREDIT_RISK: {
    name: 'Credit Risk',
    description: 'Risk of default by bond issuers',
    impact: 'Medium',
    mitigation: [
      'High-quality bonds',
      'Diversification',
      'Credit analysis',
      'Bond ratings'
    ]
  },
  
  LIQUIDITY_RISK: {
    name: 'Liquidity Risk',
    description: 'Risk of not being able to sell investments quickly',
    impact: 'Low to Medium',
    mitigation: [
      'Liquid investments',
      'Emergency fund',
      'Diversified holdings',
      'Market timing awareness'
    ]
  },
  
  CONCENTRATION_RISK: {
    name: 'Concentration Risk',
    description: 'Risk of having too much in one investment or sector',
    impact: 'High',
    mitigation: [
      'Diversification',
      'Position sizing',
      'Sector limits',
      'Regular rebalancing'
    ]
  }
};

export const RISK_ASSESSMENT_QUESTIONS = [
  {
    id: 'time_horizon',
    question: 'What is your primary investment time horizon?',
    options: [
      { value: 'short', text: 'Less than 2 years', score: 1 },
      { value: 'medium_short', text: '2-5 years', score: 2 },
      { value: 'medium', text: '5-10 years', score: 3 },
      { value: 'long', text: '10-20 years', score: 4 },
      { value: 'very_long', text: 'More than 20 years', score: 5 }
    ]
  },
  {
    id: 'loss_tolerance',
    question: 'How would you react if your portfolio lost 20% of its value in a month?',
    options: [
      { value: 'panic_sell', text: 'Sell everything immediately', score: 1 },
      { value: 'sell_some', text: 'Sell some investments to reduce risk', score: 2 },
      { value: 'hold', text: 'Hold and wait for recovery', score: 3 },
      { value: 'buy_more', text: 'Buy more while prices are low', score: 4 }
    ]
  },
  {
    id: 'investment_goal',
    question: 'What is your primary investment goal?',
    options: [
      { value: 'preserve_capital', text: 'Preserve capital with steady income', score: 1 },
      { value: 'moderate_growth', text: 'Moderate growth with some income', score: 2 },
      { value: 'balanced_growth', text: 'Balanced growth and income', score: 3 },
      { value: 'maximum_growth', text: 'Maximum long-term growth', score: 4 }
    ]
  },
  {
    id: 'volatility_comfort',
    question: 'How comfortable are you with investment volatility?',
    options: [
      { value: 'very_uncomfortable', text: 'Very uncomfortable - prefer stability', score: 1 },
      { value: 'somewhat_uncomfortable', text: 'Somewhat uncomfortable', score: 2 },
      { value: 'moderately_comfortable', text: 'Moderately comfortable', score: 3 },
      { value: 'very_comfortable', text: 'Very comfortable - volatility means opportunity', score: 4 }
    ]
  },
  {
    id: 'knowledge_level',
    question: 'How would you describe your investment knowledge?',
    options: [
      { value: 'beginner', text: 'Beginner - need guidance', score: 1 },
      { value: 'some_knowledge', text: 'Some knowledge - learning more', score: 2 },
      { value: 'intermediate', text: 'Intermediate - understand basics', score: 3 },
      { value: 'advanced', text: 'Advanced - comfortable with complex strategies', score: 4 }
    ]
  }
];

export const RISK_SCORE_RANGES = {
  VERY_LOW: { min: 0, max: 20, profile: 'CONSERVATIVE' },
  LOW: { min: 21, max: 40, profile: 'MODERATE' },
  MEDIUM: { min: 41, max: 60, profile: 'BALANCED' },
  HIGH: { min: 61, max: 80, profile: 'AGGRESSIVE' },
  VERY_HIGH: { min: 81, max: 100, profile: 'AGGRESSIVE' }
};

export const RISK_MITIGATION_STRATEGIES = {
  CONSERVATIVE: [
    'Focus on high-quality bonds',
    'Maintain cash reserves',
    'Avoid speculative investments',
    'Regular income focus'
  ],
  MODERATE: [
    'Balanced asset allocation',
    'Diversified portfolio',
    'Regular rebalancing',
    'Quality investments'
  ],
  BALANCED: [
    'Growth-focused allocation',
    'Sector diversification',
    'Risk management tools',
    'Long-term perspective'
  ],
  AGGRESSIVE: [
    'Growth maximization',
    'Higher equity allocation',
    'International diversification',
    'Active management'
  ]
};
