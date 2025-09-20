// Test Database Connection and Data
// Run this in your browser console to test the database

const testDatabase = async () => {
  try {
    console.log("🧪 Testing database connection...");
    
    // Import services
    const { getAllEducationalContent } = await import('./src/services/firebase/educationalService.js');
    const { getCurrentMarketData } = await import('./src/services/firebase/marketDataService.js');
    const { getUserProfile } = await import('./src/services/firebase/userService.js');
    const { auth } = await import('./src/services/firebase/config.js');
    
    if (!auth.currentUser) {
      console.error("❌ Please log in first!");
      return;
    }
    
    console.log("✅ User logged in:", auth.currentUser.email);
    
    // Test 1: Get Educational Content
    console.log("📚 Testing educational content...");
    try {
      const content = await getAllEducationalContent();
      console.log(`✅ Found ${content.length} educational content items`);
      content.forEach(item => {
        console.log(`  - ${item.title} (${item.difficulty})`);
      });
    } catch (error) {
      console.error("❌ Error getting educational content:", error);
    }
    
    // Test 2: Get Market Data
    console.log("📈 Testing market data...");
    try {
      const marketData = await getCurrentMarketData();
      if (marketData && marketData.stocks) {
        console.log(`✅ Found market data for ${Object.keys(marketData.stocks).length} stocks`);
        Object.values(marketData.stocks).forEach(stock => {
          console.log(`  - ${stock.symbol}: $${stock.price} (${stock.changePercent > 0 ? '+' : ''}${stock.changePercent}%)`);
        });
      } else {
        console.log("⚠️ No market data found");
      }
    } catch (error) {
      console.error("❌ Error getting market data:", error);
    }
    
    // Test 3: Get User Profile
    console.log("👤 Testing user profile...");
    try {
      const profile = await getUserProfile(auth.currentUser.uid);
      if (profile) {
        console.log("✅ User profile found:");
        console.log(`  - Name: ${profile.firstName} ${profile.lastName}`);
        console.log(`  - Risk Tolerance: ${profile.riskTolerance}`);
        console.log(`  - Experience Level: ${profile.experienceLevel}`);
        console.log(`  - Investment Goals: ${profile.investmentGoals?.length || 0}`);
      } else {
        console.log("⚠️ No user profile found");
      }
    } catch (error) {
      console.error("❌ Error getting user profile:", error);
    }
    
    console.log("🎉 Database test complete!");
    
  } catch (error) {
    console.error("❌ Error testing database:", error);
  }
};

// Run the test
testDatabase();
