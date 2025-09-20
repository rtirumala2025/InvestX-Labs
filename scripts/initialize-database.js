// Database Initialization Script
// Run this in your browser console after creating the Firestore database

// First, make sure you're logged in to your app
// Then open browser console and run this script

const initializeDatabase = async () => {
  try {
    console.log("🚀 Initializing InvestX Labs database...");
    
    // Import Firebase functions (these should be available in your app)
    const { db } = await import('./src/services/firebase/config.js');
    const { addDocument } = await import('./src/services/firebase/firestore.js');
    
    // Sample educational content
    const educationalContent = [
      {
        id: "intro-to-investing",
        title: "Introduction to Investing",
        category: "beginner",
        content: "Learn the basics of investing, including stocks, bonds, and mutual funds. This comprehensive guide covers fundamental concepts every investor should know.",
        difficulty: "beginner",
        estimatedTime: "15 minutes",
        tags: ["stocks", "bonds", "mutual funds", "basics"],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "portfolio-diversification",
        title: "Portfolio Diversification",
        category: "intermediate",
        content: "Understand how to diversify your portfolio to reduce risk. Learn about asset allocation, correlation, and risk management strategies.",
        difficulty: "intermediate",
        estimatedTime: "20 minutes",
        tags: ["diversification", "risk management", "portfolio"],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "risk-assessment",
        title: "Risk Assessment",
        category: "intermediate",
        content: "Learn how to assess your risk tolerance and investment goals. Discover different types of risk and how to manage them effectively.",
        difficulty: "intermediate",
        estimatedTime: "25 minutes",
        tags: ["risk", "assessment", "goals"],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "stock-analysis",
        title: "Stock Analysis Fundamentals",
        category: "advanced",
        content: "Master the art of stock analysis. Learn about fundamental analysis, technical analysis, and how to evaluate company financials.",
        difficulty: "advanced",
        estimatedTime: "30 minutes",
        tags: ["analysis", "fundamentals", "technical", "financials"],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Add educational content
    for (const content of educationalContent) {
      try {
        await addDocument('educational_content', content);
        console.log(`✅ Added: ${content.title}`);
      } catch (error) {
        console.log(`⚠️ Content already exists: ${content.title}`);
      }
    }
    
    // Sample market data
    const marketData = {
      lastUpdated: new Date(),
      stocks: {
        "AAPL": {
          symbol: "AAPL",
          name: "Apple Inc.",
          price: 150.00,
          change: 2.50,
          changePercent: 1.69,
          volume: 50000000,
          marketCap: 2500000000000,
          sector: "Technology"
        },
        "GOOGL": {
          symbol: "GOOGL",
          name: "Alphabet Inc.",
          price: 2800.00,
          change: -15.00,
          changePercent: -0.53,
          volume: 20000000,
          marketCap: 1800000000000,
          sector: "Technology"
        },
        "MSFT": {
          symbol: "MSFT",
          name: "Microsoft Corporation",
          price: 320.00,
          change: 5.20,
          changePercent: 1.65,
          volume: 30000000,
          marketCap: 2400000000000,
          sector: "Technology"
        },
        "TSLA": {
          symbol: "TSLA",
          name: "Tesla, Inc.",
          price: 250.00,
          change: -8.50,
          changePercent: -3.29,
          volume: 80000000,
          marketCap: 800000000000,
          sector: "Automotive"
        }
      },
      indices: {
        "SPY": {
          symbol: "SPY",
          name: "S&P 500",
          price: 4500.00,
          change: 25.00,
          changePercent: 0.56
        },
        "QQQ": {
          symbol: "QQQ",
          name: "NASDAQ 100",
          price: 3800.00,
          change: 15.00,
          changePercent: 0.40
        }
      }
    };
    
    // Add market data
    try {
      await addDocument('market_data', marketData);
      console.log("✅ Added market data");
    } catch (error) {
      console.log("⚠️ Market data already exists");
    }
    
    console.log("🎉 Database initialization complete!");
    console.log("You can now:");
    console.log("- Browse educational content");
    console.log("- View market data");
    console.log("- Create portfolios");
    console.log("- Track your learning progress");
    
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    console.log("Make sure you're logged in and the Firestore database is created");
  }
};

// Run the initialization
initializeDatabase();
