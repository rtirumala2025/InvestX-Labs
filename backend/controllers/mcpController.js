import {
  createApiResponse,
  generateRequestId,
  logger
} from '../ai-system/index.js';

const baseContext = {
  userId: 'user_12345',
  riskProfile: {
    riskLevel: 'moderate',
    score: 65,
    lastAssessed: '2025-10-15T10:30:00Z',
    description: 'Balanced approach to risk and return',
    riskCapacity: 'medium',
    riskRequired: 'medium',
    riskTolerance: 'medium',
    timeHorizon: '5-10 years',
    liquidityNeeds: 'moderate',
    investmentExperience: 'intermediate'
  },
  investmentGoals: [
    {
      id: 'goal_1',
      name: 'Retirement',
      targetAmount: 1000000,
      currentAmount: 250000,
      targetDate: '2050-12-31',
      priority: 'high',
      monthlyContribution: 1000
    },
    {
      id: 'goal_2',
      name: 'House Down Payment',
      targetAmount: 100000,
      currentAmount: 25000,
      targetDate: '2027-06-30',
      priority: 'medium',
      monthlyContribution: 1500
    }
  ],
  portfolio: {
    totalValue: 275000,
    allocation: {
      stocks: 60,
      bonds: 30,
      cash: 5,
      alternatives: 5
    },
    holdings: [
      { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', allocation: 30, value: 82500 },
      { symbol: 'VXUS', name: 'Vanguard Total International Stock ETF', allocation: 20, value: 55000 },
      { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', allocation: 25, value: 68750 },
      { symbol: 'BNDX', name: 'Vanguard Total International Bond ETF', allocation: 10, value: 27500 },
      { symbol: 'GLD', name: 'SPDR Gold Shares', allocation: 5, value: 13750 },
      { symbol: 'CASH', name: 'Cash & Equivalents', allocation: 10, value: 27500 }
    ],
    performance: {
      ytdReturn: 8.5,
      oneYearReturn: 12.3,
      threeYearReturn: 9.8,
      fiveYearReturn: 11.2,
      sinceInception: 9.5,
      inceptionDate: '2020-01-01'
    }
  },
  preferences: {
    theme: 'light',
    notifications: {
      email: true,
      push: true,
      sms: false,
      frequency: 'weekly'
    },
    riskAppetite: 'balanced',
    investmentStrategy: 'growth',
    rebalancing: {
      enabled: true,
      frequency: 'quarterly',
      threshold: 5
    },
    taxLossHarvesting: true,
    dividendReinvestment: true
  },
  accounts: [
    {
      id: 'acc_ret_01',
      name: '401(k)',
      type: 'retirement',
      provider: 'Fidelity',
      balance: 180000,
      allocation: {
        stocks: 70,
        bonds: 25,
        cash: 5
      }
    },
    {
      id: 'acc_tax_01',
      name: 'Brokerage Account',
      type: 'taxable',
      provider: 'Vanguard',
      balance: 75000,
      allocation: {
        stocks: 60,
        bonds: 30,
        alternatives: 10
      }
    },
    {
      id: 'acc_roth_01',
      name: 'Roth IRA',
      type: 'retirement',
      provider: 'Charles Schwab',
      balance: 20000,
      allocation: {
        stocks: 80,
        bonds: 15,
        alternatives: 5
      }
    }
  ],
  recentActivity: [
    {
      id: 'act_001',
      type: 'dividend',
      symbol: 'VTI',
      amount: 125.5,
      date: '2025-10-15T09:30:00Z',
      status: 'completed'
    },
    {
      id: 'act_002',
      type: 'trade',
      action: 'buy',
      symbol: 'AAPL',
      shares: 5,
      price: 175.25,
      amount: 876.25,
      date: '2025-10-10T14:22:15Z',
      status: 'completed'
    },
    {
      id: 'act_003',
      type: 'deposit',
      amount: 1000,
      date: '2025-10-01T08:15:00Z',
      status: 'completed'
    }
  ],
  nextSteps: [
    'Consider increasing your emergency fund to cover 6 months of expenses',
    'Rebalance your portfolio to maintain target allocations',
    'Review your investment goals and update if necessary'
  ],
  lastUpdated: new Date().toISOString(),
  educational_disclaimer: 'This information is for educational purposes only and should not be considered financial advice. Please consult with a qualified financial advisor before making investment decisions.'
};

export const healthCheck = (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'mcp-service',
    timestamp: new Date().toISOString()
  });
};

export const getContext = (req, res) => {
  try {
    const context = {
      ...baseContext,
      requestId: generateRequestId('mcp_ctx'),
      timestamp: new Date().toISOString()
    };

    res.status(200).json(createApiResponse(context, {
      message: 'MCP context retrieved',
      metadata: {
        educational_disclaimer: context.educational_disclaimer
      }
    }));
  } catch (error) {
    logger.error('Error fetching MCP context:', error);
    res.status(500).json(createApiResponse(null, {
      success: false,
      statusCode: 500,
      message: 'Failed to fetch MCP context',
      metadata: {
        educational_disclaimer: baseContext.educational_disclaimer
      }
    }));
  }
};

