// Add Sample Data to Firestore
// Run this in your browser console while logged into your app

const addSampleData = async () => {
  try {
    console.log("🚀 Adding sample data to Firestore...");
    
    // Get the current user
    const { auth } = await import('./src/services/firebase/config.js');
    const { addDocument } = await import('./src/services/firebase/firestore.js');
    
    if (!auth.currentUser) {
      console.error("❌ Please log in first!");
      return;
    }
    
    console.log("✅ User logged in:", auth.currentUser.email);
    
    // 1. Add Educational Content
    console.log("📚 Adding educational content...");
    
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
    
    // Add each educational content item
    for (const content of educationalContent) {
      try {
        await addDocument('educational_content', content);
        console.log(`✅ Added: ${content.title}`);
      } catch (error) {
        console.log(`⚠️ Content already exists: ${content.title}`);
      }
    }
    
    // 2. Add Market Data
    console.log("📈 Adding market data...");
    
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
        },
        "AMZN": {
          symbol: "AMZN",
          name: "Amazon.com, Inc.",
          price: 3200.00,
          change: 45.00,
          changePercent: 1.43,
          volume: 25000000,
          marketCap: 1600000000000,
          sector: "Consumer Discretionary"
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
        },
        "DIA": {
          symbol: "DIA",
          name: "Dow Jones Industrial Average",
          price: 35000.00,
          change: 150.00,
          changePercent: 0.43
        }
      }
    };
    
    try {
      await addDocument('market_data', marketData);
      console.log("✅ Added market data");
    } catch (error) {
      console.log("⚠️ Market data already exists");
    }
    
    // 3. Create User Profile
    console.log("👤 Creating user profile...");
    
    const userProfile = {
      userId: auth.currentUser.uid,
      email: auth.currentUser.email,
      displayName: auth.currentUser.displayName || "User",
      firstName: auth.currentUser.displayName?.split(' ')[0] || "User",
      lastName: auth.currentUser.displayName?.split(' ')[1] || "",
      riskTolerance: "moderate",
      investmentGoals: [
        {
          id: "goal1",
          title: "Retirement",
          targetAmount: 1000000,
          targetDate: "2050-01-01",
          currentAmount: 0,
          priority: "high"
        },
        {
          id: "goal2",
          title: "Emergency Fund",
          targetAmount: 10000,
          targetDate: "2025-01-01",
          currentAmount: 0,
          priority: "high"
        }
      ],
      experienceLevel: "beginner",
      notifications: {
        email: true,
        push: true,
        marketUpdates: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    try {
      await addDocument('users', userProfile);
      console.log("✅ Created user profile");
    } catch (error) {
      console.log("⚠️ User profile already exists");
    }
    
    console.log("🎉 Sample data added successfully!");
    console.log("Check your Firebase Console > Firestore to see the data");
    
  } catch (error) {
    console.error("❌ Error adding sample data:", error);
  }
};

// Run the function
addSampleData();
