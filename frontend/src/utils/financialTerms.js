// Simplified financial terms for teen-friendly language
export const financialTerms = {
  // Portfolio Terms
  portfolio: {
    term: 'Portfolio',
    simple: 'Your collection of investments',
    full: 'A portfolio is like a collection of different investments you own, such as stocks, bonds, or funds. It helps spread out risk.',
    example: 'Like having different types of games in your collection instead of just one.'
  },
  holding: {
    term: 'Holding',
    simple: 'An investment you own',
    full: 'A holding is a specific investment in your portfolio, like shares of a company or units of a fund.',
    example: 'If you own 10 shares of Apple, that\'s a holding.'
  },
  diversification: {
    term: 'Diversification',
    simple: 'Spreading your money across different investments',
    full: 'Diversification means not putting all your money in one place. It helps reduce risk because if one investment does poorly, others might do well.',
    example: 'Like not spending all your allowance on one thing - you spread it out.'
  },
  asset_allocation: {
    term: 'Asset Allocation',
    simple: 'How you divide your money between different types of investments',
    full: 'Asset allocation is the mix of different types of investments in your portfolio, like stocks, bonds, and cash.',
    example: 'Like deciding how much of your money goes to games, clothes, and savings.'
  },
  
  // Performance Terms
  return: {
    term: 'Return',
    simple: 'How much money you made or lost',
    full: 'Return is the profit or loss you make on an investment. It can be positive (you made money) or negative (you lost money).',
    example: 'If you bought a game for $50 and sold it for $60, your return is $10.'
  },
  gain_loss: {
    term: 'Gain/Loss',
    simple: 'Money you made or lost',
    full: 'Gain is profit from an investment. Loss is when you lose money. It\'s calculated as the difference between what you paid and current value.',
    example: 'If your stock went from $100 to $120, you have a $20 gain.'
  },
  performance: {
    term: 'Performance',
    simple: 'How well your investments are doing',
    full: 'Performance measures how your investments are doing over time, usually shown as a percentage gain or loss.',
    example: 'If your portfolio went up 10%, that\'s good performance.'
  },
  volatility: {
    term: 'Volatility',
    simple: 'How much prices go up and down',
    full: 'Volatility measures how much an investment\'s price changes. High volatility means big swings up and down.',
    example: 'Like a roller coaster - some investments have big ups and downs, others are smoother.'
  },
  
  // Investment Types
  stock: {
    term: 'Stock',
    simple: 'A small piece of a company',
    full: 'A stock (or share) is a small piece of ownership in a company. When you buy stock, you own part of that company.',
    example: 'Like owning a tiny piece of your favorite game company.'
  },
  etf: {
    term: 'ETF',
    simple: 'A bundle of different investments',
    full: 'ETF stands for Exchange-Traded Fund. It\'s like a basket that holds many different stocks or bonds, so you can buy them all at once.',
    example: 'Like buying a variety pack of snacks instead of individual items.'
  },
  bond: {
    term: 'Bond',
    simple: 'Loaning money to a company or government',
    full: 'A bond is like a loan you give to a company or government. They promise to pay you back with interest over time.',
    example: 'Like lending a friend $10 and they pay you back $11 next month.'
  },
  dividend: {
    term: 'Dividend',
    simple: 'Money a company pays you for owning their stock',
    full: 'A dividend is a payment some companies make to shareholders from their profits. It\'s like getting a small reward for owning the stock.',
    example: 'Like getting a small bonus for being a loyal customer.'
  },
  
  // Risk Terms
  risk_tolerance: {
    term: 'Risk Tolerance',
    simple: 'How comfortable you are with losing money',
    full: 'Risk tolerance is how much risk you\'re willing to take with your investments. Some people prefer safer, steadier investments, while others are okay with more risk for potentially higher returns.',
    example: 'Like choosing between a safe, slow ride or a fast, exciting one.'
  },
  risk_profile: {
    term: 'Risk Profile',
    simple: 'Your investment style based on how much risk you can handle',
    full: 'Your risk profile describes your investment style - conservative (safer), moderate (balanced), or aggressive (riskier for higher potential returns).',
    example: 'Like your personality type, but for investing.'
  },
  
  // Market Terms
  market: {
    term: 'Market',
    simple: 'Where people buy and sell investments',
    full: 'The market is where stocks, bonds, and other investments are bought and sold. Prices change based on supply and demand.',
    example: 'Like a marketplace where people trade items, but for investments.'
  },
  bull_market: {
    term: 'Bull Market',
    simple: 'When prices are going up',
    full: 'A bull market is when stock prices are generally rising and people are optimistic about the economy.',
    example: 'Like when everything is going well and prices keep going up.'
  },
  bear_market: {
    term: 'Bear Market',
    simple: 'When prices are going down',
    full: 'A bear market is when stock prices are generally falling and people are pessimistic about the economy.',
    example: 'Like when things are tough and prices keep going down.'
  },
  
  // Strategy Terms
  rebalance: {
    term: 'Rebalance',
    simple: 'Adjusting your investments to match your goals',
    full: 'Rebalancing means adjusting your portfolio to get back to your target mix of investments. Over time, some investments grow more than others, so you adjust.',
    example: 'Like reorganizing your room to keep things balanced.'
  },
  dollar_cost_averaging: {
    term: 'Dollar Cost Averaging',
    simple: 'Investing the same amount regularly',
    full: 'Dollar cost averaging means investing a fixed amount regularly, regardless of price. This can help reduce the impact of market volatility.',
    example: 'Like putting $10 in your savings every week, no matter what.'
  }
};

// Helper function to get term info
export const getTermInfo = (termKey) => {
  return financialTerms[termKey] || {
    term: termKey,
    simple: 'Financial term',
    full: 'Definition not available',
    example: ''
  };
};

// Helper to find terms in text
export const findTermsInText = (text) => {
  const foundTerms = [];
  Object.keys(financialTerms).forEach(key => {
    const termInfo = financialTerms[key];
    if (text.toLowerCase().includes(termInfo.term.toLowerCase())) {
      foundTerms.push({ key, ...termInfo });
    }
  });
  return foundTerms;
};

