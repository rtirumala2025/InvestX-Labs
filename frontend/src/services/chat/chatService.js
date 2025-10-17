import { classifyQuery } from './queryClassifier.js';
import { getPromptTemplate, generateSystemPrompt, generateConversationSummary } from './promptTemplates.js';
import { ConversationManager } from './conversationManager.js';
import { checkSafety } from './safetyGuardrails.js';
import { formatResponse } from './responseFormatter.js';

// Firebase imports (to be used when Firebase is initialized)
// import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';

export class ChatService {
  constructor(userId, userProfile = {}, options = {}) {
    this.userId = userId;
    this.userProfile = {
      age: 16,
      experience_level: 'beginner',
      risk_tolerance: 'moderate',
      investment_goals: [],
      portfolio_value: 0,
      budget: null,
      interests: [],
      ...userProfile
    };
    this.conversationManager = new ConversationManager(userId, options);
    this.options = {
      enableSafetyChecks: true,
      enableFormatting: true,
      maxResponseTime: 3000,
      ...options
    };
    this.performanceMetrics = {
      totalRequests: 0,
      averageResponseTime: 0,
      totalTokensUsed: 0
    };
  }

  async processUserMessage(message, context = {}) {
    const startTime = Date.now();
    
    if (!message || typeof message !== 'string' || !message.trim()) {
      throw new Error('Message cannot be empty');
    }

    try {
      // Add user message to conversation
      this.conversationManager.addMessage('user', message);

      // Classify query
      const classification = classifyQuery(message);
      const queryType = classification.primary;

      // Safety check
      if (this.options.enableSafetyChecks) {
        const safetyCheck = await checkSafety(message, this.userProfile);
        if (safetyCheck.detected) {
          const safetyResponse = this.handleSafetyRedirect(safetyCheck, message);
          this.conversationManager.addMessage('assistant', safetyResponse, {
            safety: safetyCheck,
            queryType: 'safety_redirect'
          });
          return safetyResponse;
        }
      }

      // Auto-detect engagement and sentiment for adaptive responses
      const engagement = this.detectEngagement();
      const sentiment = this.detectSentiment(message);
      
      // Auto-adjust tone if needed
      if (engagement === 'low' || sentiment === 'confused') {
        this.adjustTone({ engagement, sentiment });
      }

      // Get relevant conversation context with semantic ranking
      const relevantContext = this.conversationManager.getRelevantContext(message, 5, {
        useSemanticRanking: true,
        maxTokens: 2000
      });
      const conversationSummary = generateConversationSummary(relevantContext, {
        maxMessages: 10,
        semanticCompression: true
      });

      // Generate system prompt with user profile
      const systemPrompt = generateSystemPrompt({
        queryType,
        ...this.userProfile,
        conversationSummary,
        userPreferences: context.preferences || {}
      });

      // Generate response
      const response = await this.generateResponse(message, queryType, systemPrompt, classification);

      // Format response if enabled
      const formattedResponse = this.options.enableFormatting 
        ? formatResponse(response, queryType)
        : response;

      // Add assistant message
      this.conversationManager.addMessage('assistant', formattedResponse, {
        queryType,
        classification,
        responseTime: Date.now() - startTime,
        tokenEstimate: this.conversationManager.estimateTokens(formattedResponse)
      });

      // Update metrics
      this.updateMetrics(Date.now() - startTime, formattedResponse);

      return formattedResponse;
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Add error to conversation for context
      this.conversationManager.addMessage('system', `Error: ${error.message}`, {
        error: true,
        errorType: error.name
      });
      
      throw new Error('Failed to process message');
    }
  }

  async generateResponse(message, queryType, systemPrompt, classification) {
    const template = getPromptTemplate(queryType) || getPromptTemplate('general');
    if (!template) {
      return "I'm not sure how to respond to that. Could you rephrase your question?";
    }

    // Build context for LLM
    const context = {
      systemPrompt,
      userMessage: message,
      queryType,
      classification,
      conversationHistory: this.conversationManager.getConversationHistory(5),
      userProfile: this.userProfile
    };

    // This would integrate with LLaMA 4 Scout or other LLM
    // For now, return educational placeholder
    const response = this.generateEducationalResponse(message, queryType, template);
    
    return response;
  }

  generateEducationalResponse(message, queryType, template) {
    const { age, interests, portfolio_value, risk_tolerance, experience_level, _toneAdjustments } = this.userProfile;
    
    // Generate personalized examples based on user profile
    const personalizedExamples = this.generatePersonalizedExamples(queryType);
    const platformRecommendations = this.getPlatformRecommendations(age, portfolio_value);
    const analogies = this.getRelevantAnalogies(interests);
    
    // Adjust complexity based on experience and tone adjustments
    const useSimpleLanguage = experience_level === 'beginner' || _toneAdjustments?.simplifyLanguage;
    const includeMoreExamples = _toneAdjustments?.useMoreExamples || experience_level === 'beginner';
    
    const responses = {
      education: this.buildEducationResponse(message, personalizedExamples, analogies, useSimpleLanguage),
      suggestion: this.buildSuggestionResponse(message, platformRecommendations, portfolio_value, risk_tolerance),
      portfolio: this.buildPortfolioResponse(message, portfolio_value, risk_tolerance, experience_level),
      calculation: this.buildCalculationResponse(message, portfolio_value),
      general: this.buildGeneralResponse(message, interests)
    };

    return responses[queryType] || responses.general;
  }

  generatePersonalizedExamples(queryType) {
    const { age, interests, portfolio_value, budget } = this.userProfile;
    
    const examples = {
      education: {
        compoundInterest: age <= 14 
          ? `If you save $10 from your allowance each week at 5% interest, after 1 year you'd have about $530 instead of just $520!`
          : `If you invest $50 monthly from your part-time job at 7% annual return, you'd have about $3,800 after 5 years instead of just $3,000.`,
        
        diversification: interests.includes('gaming')
          ? `Think of diversification like not putting all your gaming time into one game. If that game gets boring or shuts down, you've wasted everything. Same with investments!`
          : `Diversification is like having multiple streaming subscriptions - if one service loses your favorite show, you still have others to watch.`,
        
        riskTolerance: portfolio_value > 0
          ? `With your current portfolio of $${portfolio_value}, ${this.getRiskExample(portfolio_value)}`
          : `Before investing, think about how you'd feel if your money dropped 20% temporarily. That helps determine your risk tolerance.`
      },
      
      suggestion: {
        platforms: age >= 18
          ? `Platforms like Robinhood, Fidelity, or Charles Schwab offer full investing features. Start with index funds like VOO or VTI.`
          : age >= 16
          ? `Fidelity Youth Account or Greenlight Invest let you invest with parental oversight. Great for learning!`
          : `Greenlight or GoHenry are perfect for your age - they teach money management with parental controls.`,
        
        startingAmount: budget
          ? `With your $${budget} monthly budget, you could start investing $${Math.round(budget * 0.2)}-$${Math.round(budget * 0.3)} (20-30%) while keeping the rest for savings and spending.`
          : portfolio_value > 0
          ? `You're already investing $${portfolio_value}! Consider adding small amounts regularly - even $10-20/month adds up over time.`
          : `You can start with as little as $5-10. Many apps like Acorns round up your purchases and invest the spare change!`
      }
    };

    return examples[queryType] || examples.education;
  }

  getPlatformRecommendations(age, portfolioValue) {
    if (age <= 14) {
      return {
        primary: 'Greenlight',
        features: 'Parental controls, debit card, investing basics',
        alternative: 'GoHenry',
        why: 'Perfect for learning money management with parent oversight'
      };
    } else if (age <= 16) {
      return {
        primary: 'Fidelity Youth Account',
        features: 'Real investing, educational resources, no fees',
        alternative: 'Greenlight Invest',
        why: 'Start building real investment experience with guidance'
      };
    } else if (age <= 17) {
      return {
        primary: 'Fidelity Youth Account',
        features: 'Full market access, research tools, retirement accounts',
        alternative: 'Charles Schwab',
        why: 'Prepare for financial independence with professional tools'
      };
    } else {
      return {
        primary: portfolioValue > 1000 ? 'Fidelity or Charles Schwab' : 'Acorns or Robinhood',
        features: 'Full market access, advanced tools, retirement accounts',
        alternative: 'Webull or M1 Finance',
        why: 'Full adult investing capabilities with educational resources'
      };
    }
  }

  getRelevantAnalogies(interests = []) {
    const analogyMap = {
      gaming: {
        diversification: 'Like not putting all your skill points into one stat',
        compoundInterest: 'Like XP that multiplies as you level up',
        riskReward: 'Like choosing between safe farming or risky boss fights'
      },
      technology: {
        diversification: 'Like backing up files to multiple cloud services',
        compoundInterest: 'Like Moore\'s Law - exponential growth over time',
        riskReward: 'Like beta testing new software vs using stable releases'
      },
      sports: {
        diversification: 'Like training multiple skills, not just one',
        compoundInterest: 'Like practice - small improvements compound into mastery',
        riskReward: 'Like aggressive plays vs defensive strategy'
      },
      music: {
        diversification: 'Like learning multiple instruments',
        compoundInterest: 'Like daily practice building skill exponentially',
        riskReward: 'Like performing new material vs proven hits'
      }
    };

    const userInterest = interests.find(i => analogyMap[i.toLowerCase()]);
    return analogyMap[userInterest?.toLowerCase()] || analogyMap.gaming;
  }

  getRiskExample(portfolioValue) {
    if (portfolioValue < 100) {
      return `a 20% drop would be about $${Math.round(portfolioValue * 0.2)}. That's a learning experience, not a disaster.`;
    } else if (portfolioValue < 1000) {
      return `you're at a great stage to learn about risk. A 20% drop ($${Math.round(portfolioValue * 0.2)}) would sting but teach valuable lessons.`;
    } else {
      return `you have meaningful money invested. Consider your risk tolerance carefully - a 20% drop would be $${Math.round(portfolioValue * 0.2)}.`;
    }
  }

  buildEducationResponse(message, examples, analogies, useSimpleLanguage) {
    const intro = useSimpleLanguage 
      ? `Great question! Let me explain this clearly:`
      : `Excellent question about ${message}! Here's a comprehensive breakdown:`;

    return `${intro}

**What it means:** ${examples.compoundInterest || 'This is a fundamental concept in personal finance.'}

**Why it matters:** Understanding this helps you make smarter financial decisions and build wealth over time.

**Example:** ${analogies.compoundInterest || examples.diversification}

**Key Takeaways:**
- Start early to maximize benefits
- Small, consistent actions compound over time
- Understanding this concept gives you a major advantage

**Next Steps:** Try calculating your own scenarios or explore related topics like diversification and risk management.`;
  }

  buildSuggestionResponse(message, platforms, portfolioValue, riskTolerance) {
    return `I appreciate your interest in ${message}! Rather than recommending specific investments, let me help you understand the approach:

**General Strategy:** Most financial experts suggest starting with:
1. **Diversified Index Funds:** Spread risk across many companies (like VTI or VOO)
2. **Dollar-Cost Averaging:** Invest regularly, not all at once
3. **Long-term Focus:** Think years, not days or weeks

**Recommended Platform for You:**
**${platforms.primary}** - ${platforms.features}
*Why:* ${platforms.why}
*Alternative:* ${platforms.alternative}

**Getting Started:**
${portfolioValue > 0 
  ? `You're already investing $${portfolioValue}! Consider diversifying across 3-5 different funds or sectors.`
  : `Start small - even $10-20 is enough to begin learning. Focus on understanding before investing large amounts.`}

**Important:** Always discuss investment decisions with a parent or guardian. Start with paper trading or simulators to practice first!

⚠️ *This is educational information, not financial advice.*`;
  }

  buildPortfolioResponse(message, portfolioValue, riskTolerance, experienceLevel) {
    const encouragement = experienceLevel === 'beginner'
      ? `Great job taking the first steps into investing!`
      : `You're building solid investment experience!`;

    return `${encouragement} Let's analyze your portfolio from an educational perspective:

**What You're Doing Well:**
- You're actively learning and engaging with your investments
- You're thinking about portfolio management early
${portfolioValue > 0 ? `- You've started with $${portfolioValue}, which shows commitment` : ''}

**Learning Opportunities:**
- **Diversification:** Aim for 3-5 different sectors or asset types
- **Risk Balance:** With ${riskTolerance} risk tolerance, ${this.getRiskAdvice(riskTolerance)}
- **Long-term Thinking:** Focus on learning patterns, not daily price changes
- **Regular Reviews:** Check monthly, not daily, to avoid emotional decisions

**Resources to Explore:**
- Investopedia's portfolio simulator
- Your platform's educational content
- Books: "The Simple Path to Wealth" or "A Random Walk Down Wall Street"

**Remember:** Investing is a lifelong learning journey. Every decision teaches you something valuable!

⚠️ *This is educational analysis, not financial advice. Consult with a parent/guardian.*`;
  }

  getRiskAdvice(riskTolerance) {
    const advice = {
      conservative: 'focus on stable index funds and bonds (70-80% stocks, 20-30% bonds)',
      moderate: 'balance growth and stability (80-90% stocks, 10-20% bonds)',
      aggressive: 'you can handle more volatility, but still diversify (90-100% stocks across sectors)'
    };
    return advice[riskTolerance] || advice.moderate;
  }

  buildCalculationResponse(message, portfolioValue) {
    return `Let's calculate that together! I'll show you exactly how this works:

**Formula:** Future Value = Present Value × (1 + rate)^time + (Monthly × [((1 + rate)^time - 1) / rate])

**Step-by-Step:**
1. Identify your starting amount and monthly contribution
2. Determine expected annual return (realistic: 7-10% for stocks)
3. Calculate compound growth over your timeframe
4. Add up all monthly contributions with their growth

**Example with Your Profile:**
${portfolioValue > 0 
  ? `Starting with your $${portfolioValue} and adding $50/month at 8% annual return:`
  : `Starting with $100 and adding $50/month at 8% annual return:`}
- After 1 year: ~$730
- After 5 years: ~$3,800
- After 10 years: ~$9,200

**Important Notes:** 
- This assumes consistent 8% returns (market averages 7-10% historically)
- Real results vary based on market conditions, fees, and timing
- Past performance doesn't guarantee future results

**Try It Yourself:** Use online calculators to experiment with different amounts and timeframes!`;
  }

  buildGeneralResponse(message, interests) {
    const topicSuggestions = interests.length > 0
      ? `Based on your interests in ${interests.join(', ')}, you might enjoy learning about how these industries perform as investments!`
      : '';

    return `Hi! I'm here to help you learn about personal finance and investing. ${topicSuggestions}

**Popular Topics:**
- 💰 Understanding compound interest (the "8th wonder of the world")
- 📊 How to start saving and investing
- 🎯 Setting financial goals
- 📈 Investment basics and diversification
- 💳 Budgeting and money management

**Quick Tips:**
- Start learning now, invest when ready
- Small amounts add up over time
- Diversification reduces risk
- Long-term thinking wins

Feel free to ask me anything about money and investing! What interests you most?`;
  }

  handleSafetyRedirect(safetyCheck, originalMessage) {
    const { type, response, entity } = safetyCheck;
    
    const redirects = {
      specific_stock: `I noticed you're asking about ${entity}. ${response}\n\n**Let's Learn Instead:**\n- How to evaluate any stock\n- Understanding company fundamentals\n- Reading financial statements\n- Risk assessment strategies\n\nWould you like to explore any of these topics?`,
      
      crypto: `${response}\n\n**Better Starting Points:**\n- Traditional stocks and ETFs\n- Index funds\n- Savings accounts and CDs\n- Understanding market basics\n\nThese are more beginner-friendly and have better educational resources. Interested in learning more?`,
      
      age_restricted: `${response}\n\n**Great Alternatives for Beginners:**\n- Long-term buy-and-hold investing\n- Index fund investing\n- Dollar-cost averaging\n- Building an emergency fund\n\nThese strategies are safer and more appropriate for young investors. Want to learn more?`
    };

    return redirects[type] || response;
  }

  updateMetrics(responseTime, response) {
    this.performanceMetrics.totalRequests++;
    this.performanceMetrics.averageResponseTime = 
      (this.performanceMetrics.averageResponseTime * (this.performanceMetrics.totalRequests - 1) + responseTime) 
      / this.performanceMetrics.totalRequests;
    this.performanceMetrics.totalTokensUsed += this.conversationManager.estimateTokens(response);
  }

  getConversation() {
    return this.conversationManager.getConversationHistory();
  }

  clearConversation() {
    this.conversationManager.clearHistory();
  }

  getMetrics() {
    return {
      ...this.performanceMetrics,
      conversationMetadata: this.conversationManager.getMetadata()
    };
  }

  updateUserProfile(updates) {
    this.userProfile = {
      ...this.userProfile,
      ...updates
    };
  }

  async saveConversation(db) {
    return await this.conversationManager.saveToFirestore(db);
  }

  exportConversation() {
    return this.conversationManager.exportConversation();
  }

  adjustTone(newToneSettings = {}) {
    const {
      experience_level,
      engagement,
      sentiment,
      complexity
    } = newToneSettings;

    if (experience_level) {
      this.userProfile.experience_level = experience_level;
    }

    // Adjust based on detected engagement
    if (engagement === 'low') {
      this.userProfile._toneAdjustments = {
        ...this.userProfile._toneAdjustments,
        useMoreExamples: true,
        simplifyLanguage: true,
        shorterResponses: true
      };
    } else if (engagement === 'high') {
      this.userProfile._toneAdjustments = {
        ...this.userProfile._toneAdjustments,
        moreDepth: true,
        technicalTerms: true,
        longerExplanations: true
      };
    }

    // Adjust based on sentiment
    if (sentiment === 'confused') {
      this.userProfile._toneAdjustments = {
        ...this.userProfile._toneAdjustments,
        morePatient: true,
        breakDownSteps: true,
        useAnalogies: true
      };
    } else if (sentiment === 'confident') {
      this.userProfile._toneAdjustments = {
        ...this.userProfile._toneAdjustments,
        advancedConcepts: true,
        challengeUser: true
      };
    }

    return this.userProfile;
  }

  detectEngagement() {
    const recentMessages = this.conversationManager.getConversationHistory(5);
    const userMessages = recentMessages.filter(m => m.role === 'user');

    if (userMessages.length === 0) return 'neutral';

    // Check message length and frequency
    const avgLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
    const hasQuestions = userMessages.some(m => m.content.includes('?'));
    const hasFollowUp = userMessages.some(m => 
      m.content.toLowerCase().includes('what about') || 
      m.content.toLowerCase().includes('tell me more')
    );

    if (avgLength > 50 && (hasQuestions || hasFollowUp)) return 'high';
    if (avgLength < 20 && !hasQuestions) return 'low';
    return 'neutral';
  }

  detectSentiment(message) {
    const confusedWords = ['confused', 'don\'t understand', 'what does', 'explain', 'help'];
    const confidentWords = ['got it', 'understand', 'makes sense', 'i see', 'clear'];

    const lowerMessage = message.toLowerCase();
    
    if (confusedWords.some(word => lowerMessage.includes(word))) return 'confused';
    if (confidentWords.some(word => lowerMessage.includes(word))) return 'confident';
    return 'neutral';
  }

  async syncSessionAcrossDevices(db, userId, deviceId) {
    if (!db || !userId) {
      throw new Error('Database and userId required for session sync');
    }

    try {
      // Load all conversations for this user across devices
      const userConversationsRef = collection(db, 'conversations');
      const q = query(userConversationsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);

      const allConversations = [];
      querySnapshot.forEach((doc) => {
        allConversations.push({ id: doc.id, ...doc.data() });
      });

      // Merge conversations by timestamp
      const mergedMessages = this.mergeConversationsAcrossDevices(allConversations);

      // Update current conversation manager
      this.conversationManager.messages = mergedMessages;

      // Load user profile from Firestore
      const userProfileRef = doc(db, 'userProfiles', userId);
      const userProfileSnap = await getDoc(userProfileRef);

      if (userProfileSnap.exists()) {
        const profileData = userProfileSnap.data();
        this.updateUserProfile(profileData);
      }

      // Save merged conversation with current device ID
      await this.saveConversationWithDevice(db, deviceId);

      return {
        success: true,
        messageCount: mergedMessages.length,
        devicesSync: allConversations.length,
        lastSync: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error syncing session across devices:', error);
      throw error;
    }
  }

  mergeConversationsAcrossDevices(conversations) {
    // Flatten all messages from all conversations
    const allMessages = [];
    
    conversations.forEach(conv => {
      if (conv.messages && Array.isArray(conv.messages)) {
        conv.messages.forEach(msg => {
          allMessages.push({
            ...msg,
            deviceId: conv.deviceId,
            conversationId: conv.conversationId
          });
        });
      }
    });

    // Sort by timestamp
    allMessages.sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    // Remove duplicates (same content within 1 second)
    const uniqueMessages = [];
    for (let i = 0; i < allMessages.length; i++) {
      const current = allMessages[i];
      const isDuplicate = uniqueMessages.some(msg => {
        const timeDiff = Math.abs(
          new Date(msg.timestamp) - new Date(current.timestamp)
        );
        return msg.content === current.content && timeDiff < 1000;
      });

      if (!isDuplicate) {
        uniqueMessages.push(current);
      }
    }

    return uniqueMessages;
  }

  async saveConversationWithDevice(db, deviceId) {
    const conversationData = this.conversationManager.exportConversation();
    conversationData.deviceId = deviceId;
    conversationData.lastSyncedAt = new Date().toISOString();

    // Save to Firestore
    const conversationRef = doc(db, 'conversations', conversationData.conversationId);
    await setDoc(conversationRef, conversationData, { merge: true });

    return conversationData;
  }

  getAnalytics() {
    const metadata = this.conversationManager.getMetadata();
    const messages = this.conversationManager.getConversationHistory();

    // Calculate engagement metrics
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');

    // Topic engagement
    const topicEngagement = {};
    messages.forEach(msg => {
      if (msg.metadata?.classification?.categories) {
        msg.metadata.classification.categories.forEach(category => {
          topicEngagement[category] = (topicEngagement[category] || 0) + 1;
        });
      }
    });

    // Response time analytics
    const responseTimes = assistantMessages
      .filter(m => m.metadata?.responseTime)
      .map(m => m.metadata.responseTime);

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    // Token usage per query type
    const tokensByQueryType = {};
    messages.forEach(msg => {
      if (msg.metadata?.queryType && msg.metadata?.tokenEstimate) {
        const type = msg.metadata.queryType;
        if (!tokensByQueryType[type]) {
          tokensByQueryType[type] = { count: 0, totalTokens: 0 };
        }
        tokensByQueryType[type].count++;
        tokensByQueryType[type].totalTokens += msg.metadata.tokenEstimate;
      }
    });

    // Safety flags
    const safetyFlags = messages.filter(m => 
      m.metadata?.safety?.detected
    ).map(m => ({
      type: m.metadata.safety.type,
      timestamp: m.timestamp
    }));

    return {
      // Performance metrics
      performance: {
        totalRequests: this.performanceMetrics.totalRequests,
        averageResponseTime: Math.round(this.performanceMetrics.averageResponseTime),
        totalTokensUsed: this.performanceMetrics.totalTokensUsed,
        avgResponseTimeByQuery: avgResponseTime
      },

      // Engagement metrics
      engagement: {
        totalMessages: messages.length,
        userMessages: userMessages.length,
        assistantMessages: assistantMessages.length,
        averageUserMessageLength: userMessages.length > 0
          ? Math.round(userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length)
          : 0,
        topicEngagement,
        currentEngagementLevel: this.detectEngagement()
      },

      // Conversation metadata
      conversation: {
        conversationId: metadata.conversationId,
        duration: this.calculateConversationDuration(messages),
        topics: metadata.topics,
        compressed: metadata.compressed || false,
        messageCount: metadata.currentMessageCount
      },

      // Token usage breakdown
      tokenUsage: {
        byQueryType: tokensByQueryType,
        total: this.performanceMetrics.totalTokensUsed,
        average: Math.round(this.performanceMetrics.totalTokensUsed / Math.max(1, messages.length))
      },

      // Safety & compliance
      safety: {
        totalFlags: safetyFlags.length,
        flagsByType: safetyFlags.reduce((acc, flag) => {
          acc[flag.type] = (acc[flag.type] || 0) + 1;
          return acc;
        }, {}),
        recentFlags: safetyFlags.slice(-5)
      },

      // User profile snapshot
      userProfile: {
        age: this.userProfile.age,
        experienceLevel: this.userProfile.experience_level,
        riskTolerance: this.userProfile.risk_tolerance,
        portfolioValue: this.userProfile.portfolio_value
      },

      // Timestamp
      generatedAt: new Date().toISOString()
    };
  }

  calculateConversationDuration(messages) {
    if (messages.length < 2) return 0;
    
    const firstTimestamp = new Date(messages[0].timestamp);
    const lastTimestamp = new Date(messages[messages.length - 1].timestamp);
    
    return Math.round((lastTimestamp - firstTimestamp) / 1000 / 60); // minutes
  }

  async submitFeedback(messageId, feedback) {
    // Store feedback for analytics
    const message = this.conversationManager.messages.find(
      m => m.metadata?.messageId === messageId
    );

    if (message) {
      message.metadata.feedback = {
        helpful: feedback.helpful,
        rating: feedback.rating,
        comment: feedback.comment,
        timestamp: new Date().toISOString()
      };
    }

    return { success: true, messageId };
  }
}
