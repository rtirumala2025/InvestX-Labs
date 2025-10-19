const { handleChatMessage, generateChatResponse } = require('./chatService');

(async () => {
  try {
    // Test handleChatMessage
    const chatResult = await handleChatMessage("Hello, how can I invest safely?", "testUser");
    console.log("handleChatMessage result:", chatResult);

    // Mock user profile and conversation context
    const userProfile = { uid: "testUser" };
    const conversationContext = ["Previous message 1", "Previous message 2"];

    // Test generateChatResponse
    const response = await generateChatResponse("Can you suggest a good investment strategy?", userProfile, conversationContext);
    console.log("generateChatResponse result:", response);

  } catch (err) {
    console.error("Test failed:", err);
  }
})();