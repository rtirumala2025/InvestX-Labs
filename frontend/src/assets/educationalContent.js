/**
 * Educational content data
 */

export const LEARNING_MODULES = [
  {
    id: "investment_basics",
    title: "Investment Basics",
    description: "Learn the fundamentals of investing and how to get started",
    level: "Beginner",
    duration: "2-3 hours",
    progress: 0,
    lessons: [
      {
        id: "what_is_investing",
        title: "What is Investing?",
        content:
          "Understanding the concept of investing and why it matters for your financial future.",
        type: "article",
        duration: "15 minutes",
      },
      {
        id: "types_of_investments",
        title: "Types of Investments",
        content:
          "Explore different investment options including stocks, bonds, and mutual funds.",
        type: "article",
        duration: "20 minutes",
      },
      {
        id: "risk_vs_return",
        title: "Risk vs. Return",
        content:
          "Learn about the relationship between risk and return in investments.",
        type: "article",
        duration: "15 minutes",
      },
      {
        id: "getting_started",
        title: "Getting Started",
        content: "Practical steps to begin your investment journey.",
        type: "article",
        duration: "20 minutes",
      },
    ],
    quiz: {
      id: "investment_basics_quiz",
      questions: [
        {
          question: "What is the primary goal of investing?",
          options: [
            "To save money",
            "To grow wealth over time",
            "To avoid taxes",
            "To spend money",
          ],
          correct: 1,
        },
        {
          question: "Which investment typically has the highest risk?",
          options: ["Savings account", "Government bonds", "Stocks", "CDs"],
          correct: 2,
        },
      ],
    },
  },

  {
    id: "portfolio_diversification",
    title: "Portfolio Diversification",
    description: "Learn how to diversify your portfolio to reduce risk",
    level: "Intermediate",
    duration: "3-4 hours",
    progress: 0,
    lessons: [
      {
        id: "what_is_diversification",
        title: "What is Diversification?",
        content:
          "Understanding the concept of diversification and its benefits.",
        type: "article",
        duration: "20 minutes",
      },
      {
        id: "asset_allocation",
        title: "Asset Allocation",
        content:
          "Learn how to allocate your investments across different asset classes.",
        type: "article",
        duration: "25 minutes",
      },
      {
        id: "sector_diversification",
        title: "Sector Diversification",
        content: "Diversifying across different industry sectors.",
        type: "article",
        duration: "20 minutes",
      },
      {
        id: "geographic_diversification",
        title: "Geographic Diversification",
        content: "Investing across different countries and regions.",
        type: "article",
        duration: "20 minutes",
      },
    ],
    quiz: {
      id: "diversification_quiz",
      questions: [
        {
          question: "What is the main benefit of diversification?",
          options: [
            "Higher returns",
            "Reduced risk",
            "Lower taxes",
            "More liquidity",
          ],
          correct: 1,
        },
        {
          question: "Which is NOT a type of diversification?",
          options: ["Asset class", "Sector", "Geographic", "Time-based"],
          correct: 3,
        },
      ],
    },
  },

  {
    id: "risk_management",
    title: "Risk Management",
    description: "Learn how to manage and mitigate investment risks",
    level: "Intermediate",
    duration: "2-3 hours",
    progress: 0,
    lessons: [
      {
        id: "types_of_risk",
        title: "Types of Investment Risk",
        content: "Understanding different types of investment risks.",
        type: "article",
        duration: "20 minutes",
      },
      {
        id: "risk_assessment",
        title: "Risk Assessment",
        content: "How to assess your risk tolerance and capacity.",
        type: "article",
        duration: "20 minutes",
      },
      {
        id: "risk_mitigation",
        title: "Risk Mitigation Strategies",
        content: "Strategies to reduce and manage investment risks.",
        type: "article",
        duration: "25 minutes",
      },
    ],
    quiz: {
      id: "risk_management_quiz",
      questions: [
        {
          question: "Which type of risk affects all investments?",
          options: [
            "Credit risk",
            "Market risk",
            "Liquidity risk",
            "Inflation risk",
          ],
          correct: 1,
        },
        {
          question: "What is the best way to reduce unsystematic risk?",
          options: [
            "Market timing",
            "Diversification",
            "Leverage",
            "Short selling",
          ],
          correct: 1,
        },
      ],
    },
  },

  {
    id: "market_analysis",
    title: "Market Analysis",
    description:
      "Learn how to analyze markets and make informed investment decisions",
    level: "Advanced",
    duration: "4-5 hours",
    progress: 0,
    lessons: [
      {
        id: "fundamental_analysis",
        title: "Fundamental Analysis",
        content:
          "Analyzing companies based on financial statements and business fundamentals.",
        type: "article",
        duration: "30 minutes",
      },
      {
        id: "technical_analysis",
        title: "Technical Analysis",
        content:
          "Using charts and technical indicators to analyze price movements.",
        type: "article",
        duration: "30 minutes",
      },
      {
        id: "economic_indicators",
        title: "Economic Indicators",
        content:
          "Understanding key economic indicators and their impact on markets.",
        type: "article",
        duration: "25 minutes",
      },
      {
        id: "market_cycles",
        title: "Market Cycles",
        content:
          "Understanding market cycles and how to position your portfolio.",
        type: "article",
        duration: "25 minutes",
      },
    ],
    quiz: {
      id: "market_analysis_quiz",
      questions: [
        {
          question: "What does P/E ratio measure?",
          options: [
            "Price to earnings",
            "Profit to equity",
            "Price to equity",
            "Profit to earnings",
          ],
          correct: 0,
        },
        {
          question: "What is technical analysis based on?",
          options: [
            "Financial statements",
            "Price and volume data",
            "Economic indicators",
            "Company news",
          ],
          correct: 1,
        },
      ],
    },
  },
];

export const ARTICLES = [
  {
    id: "getting_started_investing",
    title: "Getting Started with Investing: A Beginner's Guide",
    author: "InvestX Labs Team",
    publishedAt: "2024-01-15",
    category: "Beginner",
    readTime: "8 minutes",
    content: `
      <h2>Why Invest?</h2>
      <p>Investing is one of the most effective ways to build wealth over time. While saving money in a bank account is safe, it typically doesn't keep pace with inflation, meaning your money loses purchasing power over time.</p>
      
      <h2>Types of Investments</h2>
      <p>There are several types of investments to consider:</p>
      <ul>
        <li><strong>Stocks:</strong> Ownership shares in companies</li>
        <li><strong>Bonds:</strong> Loans to governments or corporations</li>
        <li><strong>Mutual Funds:</strong> Pooled investments managed by professionals</li>
        <li><strong>ETFs:</strong> Exchange-traded funds that track market indices</li>
      </ul>
      
      <h2>Getting Started</h2>
      <p>Here are the steps to begin your investment journey:</p>
      <ol>
        <li>Set clear financial goals</li>
        <li>Build an emergency fund</li>
        <li>Choose an investment account</li>
        <li>Start with index funds</li>
        <li>Invest regularly</li>
      </ol>
    `,
    tags: ["beginner", "investing", "getting-started"],
  },

  {
    id: "diversification_strategies",
    title: "Portfolio Diversification: Strategies for Risk Reduction",
    author: "InvestX Labs Team",
    publishedAt: "2024-01-20",
    category: "Intermediate",
    readTime: "12 minutes",
    content: `
      <h2>What is Diversification?</h2>
      <p>Diversification is the practice of spreading your investments across different assets, sectors, and geographic regions to reduce risk.</p>
      
      <h2>Benefits of Diversification</h2>
      <ul>
        <li>Reduces overall portfolio risk</li>
        <li>Smooths out investment returns</li>
        <li>Provides exposure to different market opportunities</li>
        <li>Helps protect against market volatility</li>
      </ul>
      
      <h2>Diversification Strategies</h2>
      <h3>Asset Allocation</h3>
      <p>Allocate your investments across different asset classes like stocks, bonds, and real estate.</p>
      
      <h3>Sector Diversification</h3>
      <p>Invest across different industry sectors to avoid concentration risk.</p>
      
      <h3>Geographic Diversification</h3>
      <p>Include international investments to benefit from global growth opportunities.</p>
    `,
    tags: ["diversification", "portfolio", "risk-management"],
  },

  {
    id: "understanding_risk",
    title: "Understanding Investment Risk: A Comprehensive Guide",
    author: "InvestX Labs Team",
    publishedAt: "2024-01-25",
    category: "Intermediate",
    readTime: "15 minutes",
    content: `
      <h2>Types of Investment Risk</h2>
      <p>Understanding different types of risk is crucial for making informed investment decisions.</p>
      
      <h3>Market Risk</h3>
      <p>Market risk refers to the possibility of losses due to overall market movements.</p>
      
      <h3>Credit Risk</h3>
      <p>Credit risk is the risk that a bond issuer will default on their payments.</p>
      
      <h3>Inflation Risk</h3>
      <p>Inflation risk is the risk that your investments won't keep pace with inflation.</p>
      
      <h2>Risk Management Strategies</h2>
      <ul>
        <li>Diversification</li>
        <li>Asset allocation</li>
        <li>Regular rebalancing</li>
        <li>Risk assessment</li>
      </ul>
    `,
    tags: ["risk", "risk-management", "investing"],
  },
];

export const QUIZZES = [
  {
    id: "investment_basics_quiz",
    title: "Investment Basics Quiz",
    description: "Test your knowledge of investment fundamentals",
    level: "Beginner",
    questions: [
      {
        id: 1,
        question: "What is the primary goal of investing?",
        options: [
          "To save money",
          "To grow wealth over time",
          "To avoid taxes",
          "To spend money",
        ],
        correct: 1,
        explanation:
          "The primary goal of investing is to grow wealth over time through the power of compound returns.",
      },
      {
        id: 2,
        question: "Which investment typically has the highest risk?",
        options: ["Savings account", "Government bonds", "Stocks", "CDs"],
        correct: 2,
        explanation:
          "Stocks typically have the highest risk but also the highest potential returns.",
      },
      {
        id: 3,
        question: "What is compound interest?",
        options: [
          "Interest on interest",
          "Simple interest",
          "Fixed interest",
          "Variable interest",
        ],
        correct: 0,
        explanation:
          "Compound interest is interest calculated on the initial principal and accumulated interest.",
      },
    ],
  },

  {
    id: "diversification_quiz",
    title: "Portfolio Diversification Quiz",
    description: "Test your understanding of portfolio diversification",
    level: "Intermediate",
    questions: [
      {
        id: 1,
        question: "What is the main benefit of diversification?",
        options: [
          "Higher returns",
          "Reduced risk",
          "Lower taxes",
          "More liquidity",
        ],
        correct: 1,
        explanation:
          "Diversification primarily helps reduce risk by spreading investments across different assets.",
      },
      {
        id: 2,
        question: "Which is NOT a type of diversification?",
        options: ["Asset class", "Sector", "Geographic", "Time-based"],
        correct: 3,
        explanation:
          "Time-based is not a type of diversification. The main types are asset class, sector, and geographic.",
      },
    ],
  },
];

export const BADGES = [
  {
    id: "first_investment",
    name: "First Investment",
    description: "Added your first holding to your portfolio",
    icon: "🎯",
    category: "Portfolio",
    requirements: {
      type: "action",
      action: "add_holding",
      count: 1,
    },
  },

  {
    id: "diversification_master",
    name: "Diversification Master",
    description: "Diversified across 5+ sectors",
    icon: "🎨",
    category: "Portfolio",
    requirements: {
      type: "portfolio",
      metric: "sector_count",
      threshold: 5,
    },
  },

  {
    id: "risk_assessor",
    name: "Risk Assessor",
    description: "Completed risk tolerance assessment",
    icon: "⚡",
    category: "Education",
    requirements: {
      type: "action",
      action: "complete_risk_assessment",
      count: 1,
    },
  },

  {
    id: "learning_champion",
    name: "Learning Champion",
    description: "Completed 3 learning modules",
    icon: "📚",
    category: "Education",
    requirements: {
      type: "action",
      action: "complete_module",
      count: 3,
    },
  },

  {
    id: "quiz_master",
    name: "Quiz Master",
    description: "Scored 90% or higher on 5 quizzes",
    icon: "🧠",
    category: "Education",
    requirements: {
      type: "quiz",
      metric: "high_scores",
      threshold: 5,
    },
  },

  {
    id: "long_term_investor",
    name: "Long-term Investor",
    description: "Held investments for 1+ years",
    icon: "⏰",
    category: "Portfolio",
    requirements: {
      type: "portfolio",
      metric: "holding_duration",
      threshold: 365,
    },
  },
];

export const GLOSSARY = [
  {
    term: "Asset Allocation",
    definition:
      "The process of dividing investments among different asset categories, such as stocks, bonds, and cash.",
    category: "Portfolio Management",
  },
  {
    term: "Beta",
    definition:
      "A measure of a stock's volatility relative to the overall market.",
    category: "Risk Metrics",
  },
  {
    term: "Diversification",
    definition:
      "The practice of spreading investments across different assets to reduce risk.",
    category: "Risk Management",
  },
  {
    term: "ETF",
    definition:
      "Exchange-Traded Fund - a type of investment fund that trades on stock exchanges.",
    category: "Investment Types",
  },
  {
    term: "P/E Ratio",
    definition:
      "Price-to-Earnings ratio - a valuation metric comparing a company's stock price to its earnings per share.",
    category: "Valuation",
  },
  {
    term: "Rebalancing",
    definition:
      "The process of realigning the weightings of a portfolio's assets.",
    category: "Portfolio Management",
  },
  {
    term: "Sharpe Ratio",
    definition:
      "A measure of risk-adjusted return, calculated as excess return per unit of risk.",
    category: "Risk Metrics",
  },
  {
    term: "Volatility",
    definition:
      "A statistical measure of the dispersion of returns for a given security or market index.",
    category: "Risk Metrics",
  },
];
