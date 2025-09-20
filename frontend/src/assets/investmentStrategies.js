/**
 * Investment strategies data
 */

export const INVESTMENT_STRATEGIES = {
  CONSERVATIVE: {
    id: 'conservative',
    name: 'Conservative',
    description: 'Focus on capital preservation with steady, predictable returns',
    riskLevel: 'Low',
    expectedReturn: '3-6%',
    timeHorizon: 'Short to Medium',
    assetAllocation: {
      stocks: 30,
      bonds: 60,
      cash: 10
    },
    characteristics: [
      'Low volatility',
      'Capital preservation',
      'Steady income',
      'Lower risk tolerance'
    ],
    suitableFor: [
      'Retirees',
      'Risk-averse investors',
      'Short-term goals',
      'Income-focused investors'
    ],
    exampleHoldings: [
      'Government bonds',
      'High-grade corporate bonds',
      'Dividend-paying blue-chip stocks',
      'Money market funds'
    ]
  },
  
  MODERATE: {
    id: 'moderate',
    name: 'Moderate',
    description: 'Balanced approach with moderate risk and growth potential',
    riskLevel: 'Medium',
    expectedReturn: '6-8%',
    timeHorizon: 'Medium to Long',
    assetAllocation: {
      stocks: 60,
      bonds: 35,
      cash: 5
    },
    characteristics: [
      'Balanced risk-return',
      'Diversified portfolio',
      'Moderate growth',
      'Some volatility'
    ],
    suitableFor: [
      'Middle-aged investors',
      'Balanced risk tolerance',
      'Medium-term goals',
      'Growth and income focus'
    ],
    exampleHoldings: [
      'Large-cap stocks',
      'Investment-grade bonds',
      'REITs',
      'International stocks'
    ]
  },
  
  BALANCED: {
    id: 'balanced',
    name: 'Balanced',
    description: 'Growth-oriented with moderate risk management',
    riskLevel: 'Medium-High',
    expectedReturn: '8-10%',
    timeHorizon: 'Long',
    assetAllocation: {
      stocks: 70,
      bonds: 25,
      cash: 5
    },
    characteristics: [
      'Growth-focused',
      'Moderate risk management',
      'Long-term perspective',
      'Higher volatility'
    ],
    suitableFor: [
      'Young to middle-aged investors',
      'Long-term goals',
      'Growth focus',
      'Moderate risk tolerance'
    ],
    exampleHoldings: [
      'Growth stocks',
      'Small-cap stocks',
      'International stocks',
      'Corporate bonds'
    ]
  },
  
  AGGRESSIVE: {
    id: 'aggressive',
    name: 'Aggressive',
    description: 'Maximum growth potential with higher risk tolerance',
    riskLevel: 'High',
    expectedReturn: '10-15%',
    timeHorizon: 'Very Long',
    assetAllocation: {
      stocks: 85,
      bonds: 10,
      cash: 5
    },
    characteristics: [
      'High growth potential',
      'High volatility',
      'Long-term focus',
      'Risk-tolerant'
    ],
    suitableFor: [
      'Young investors',
      'High risk tolerance',
      'Long-term goals',
      'Growth maximization'
    ],
    exampleHoldings: [
      'Growth stocks',
      'Small-cap stocks',
      'Emerging market stocks',
      'Technology stocks'
    ]
  }
};

export const SECTOR_STRATEGIES = {
  TECHNOLOGY: {
    name: 'Technology',
    description: 'Focus on technology and innovation companies',
    riskLevel: 'High',
    growthPotential: 'High',
    volatility: 'High',
    keyFactors: [
      'Innovation cycles',
      'Market disruption',
      'Regulatory changes',
      'Competition'
    ],
    topCompanies: [
      'Apple Inc.',
      'Microsoft Corporation',
      'Amazon.com Inc.',
      'Alphabet Inc.',
      'Tesla Inc.'
    ]
  },
  
  HEALTHCARE: {
    name: 'Healthcare',
    description: 'Healthcare and pharmaceutical companies',
    riskLevel: 'Medium',
    growthPotential: 'Medium-High',
    volatility: 'Medium',
    keyFactors: [
      'Aging population',
      'Medical advances',
      'Regulatory approval',
      'Patent expiration'
    ],
    topCompanies: [
      'Johnson & Johnson',
      'UnitedHealth Group',
      'Pfizer Inc.',
      'AbbVie Inc.',
      'Merck & Co.'
    ]
  },
  
  FINANCIAL: {
    name: 'Financial',
    description: 'Banks, insurance, and financial services',
    riskLevel: 'Medium-High',
    growthPotential: 'Medium',
    volatility: 'Medium-High',
    keyFactors: [
      'Interest rates',
      'Economic cycles',
      'Regulatory changes',
      'Credit quality'
    ],
    topCompanies: [
      'Berkshire Hathaway',
      'JPMorgan Chase',
      'Bank of America',
      'Wells Fargo',
      'Goldman Sachs'
    ]
  }
};

export const DIVERSIFICATION_STRATEGIES = {
  ASSET_ALLOCATION: {
    name: 'Asset Allocation',
    description: 'Diversify across different asset classes',
    benefits: [
      'Risk reduction',
      'Smoother returns',
      'Lower volatility',
      'Better risk-adjusted returns'
    ],
    allocation: {
      stocks: 60,
      bonds: 30,
      alternatives: 10
    }
  },
  
  SECTOR_ROTATION: {
    name: 'Sector Rotation',
    description: 'Rotate between sectors based on economic cycles',
    benefits: [
      'Capitalize on economic trends',
      'Reduce sector-specific risk',
      'Active management',
      'Potential for higher returns'
    ],
    strategy: [
      'Early cycle: Technology, Consumer Discretionary',
      'Mid cycle: Industrials, Materials',
      'Late cycle: Energy, Utilities',
      'Recession: Consumer Staples, Healthcare'
    ]
  },
  
  GEOGRAPHIC_DIVERSIFICATION: {
    name: 'Geographic Diversification',
    description: 'Invest across different countries and regions',
    benefits: [
      'Reduce country-specific risk',
      'Access to global growth',
      'Currency diversification',
      'Political risk mitigation'
    ],
    allocation: {
      domestic: 60,
      developed: 25,
      emerging: 15
    }
  }
};

export const REBALANCING_STRATEGIES = {
  TIME_BASED: {
    name: 'Time-Based Rebalancing',
    description: 'Rebalance at regular intervals',
    frequency: 'Quarterly, Semi-annually, or Annually',
    pros: [
      'Simple to implement',
      'Disciplined approach',
      'Low transaction costs'
    ],
    cons: [
      'May miss optimal timing',
      'Fixed schedule regardless of market conditions'
    ]
  },
  
  THRESHOLD_BASED: {
    name: 'Threshold-Based Rebalancing',
    description: 'Rebalance when allocation drifts beyond thresholds',
    threshold: '5% or 10% deviation',
    pros: [
      'More responsive to market changes',
      'Reduces unnecessary trading',
      'Better risk management'
    ],
    cons: [
      'More complex to monitor',
      'May trigger frequent rebalancing in volatile markets'
    ]
  },
  
  HYBRID: {
    name: 'Hybrid Rebalancing',
    description: 'Combine time and threshold-based approaches',
    strategy: 'Check thresholds at regular intervals',
    pros: [
      'Best of both approaches',
      'Flexible implementation',
      'Balanced approach'
    ],
    cons: [
      'More complex to implement',
      'Requires careful monitoring'
    ]
  }
};

export const RISK_MANAGEMENT_STRATEGIES = {
  STOP_LOSS: {
    name: 'Stop Loss Orders',
    description: 'Automatically sell when price falls below threshold',
    benefits: [
      'Limit downside risk',
      'Emotional discipline',
      'Capital preservation'
    ],
    considerations: [
      'May sell during temporary dips',
      'Transaction costs',
      'Tax implications'
    ]
  },
  
  POSITION_SIZING: {
    name: 'Position Sizing',
    description: 'Limit individual position sizes',
    benefits: [
      'Reduce concentration risk',
      'Better diversification',
      'Risk control'
    ],
    guidelines: [
      'No single position > 5-10%',
      'Sector limits',
      'Asset class limits'
    ]
  },
  
  DIVERSIFICATION: {
    name: 'Diversification',
    description: 'Spread risk across multiple investments',
    benefits: [
      'Reduce unsystematic risk',
      'Smoother returns',
      'Lower volatility'
    ],
    methods: [
      'Asset class diversification',
      'Sector diversification',
      'Geographic diversification',
      'Time diversification'
    ]
  }
};
