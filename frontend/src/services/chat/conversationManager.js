import { getPromptTemplate, generateConversationSummary, compressLongConversation } from './promptTemplates.js';
import { classifyQuery } from './queryClassifier.js';

export class ConversationManager {
  constructor(userId, options = {}) {
    this.userId = userId;
    this.messages = [];
    this.metadata = {
      conversationId: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
      totalTokensEstimate: 0
    };
    this.userPreferences = options.userPreferences || {};
    this.maxMessages = options.maxMessages || 50;
    this.compressionThreshold = options.compressionThreshold || 30;
  }

  addMessage(role, content, metadata = {}) {
    if (!['user', 'assistant', 'system'].includes(role)) {
      throw new Error('Invalid message role');
    }
    if (!content || typeof content !== 'string') {
      throw new Error('Message content is required');
    }
    
    // Classify user messages for metadata
    let classification = null;
    if (role === 'user') {
      classification = classifyQuery(content);
    }
    
    const message = { 
      role, 
      content, 
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        classification,
        tokenEstimate: this.estimateTokens(content),
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    };
    
    this.messages.push(message);
    this.metadata.messageCount++;
    this.metadata.updatedAt = new Date().toISOString();
    this.metadata.totalTokensEstimate += message.metadata.tokenEstimate;
    
    // Auto-compress if needed
    if (this.messages.length > this.compressionThreshold) {
      this.compressHistory();
    }
    
    return message;
  }

  getLastMessage() {
    return this.messages.length > 0 ? this.messages[this.messages.length - 1] : null;
  }

  clearHistory() {
    this.messages = [];
    this.metadata.messageCount = 0;
    this.metadata.totalTokensEstimate = 0;
    this.metadata.updatedAt = new Date().toISOString();
  }

  getConversationHistory(limit = 10) {
    return this.messages.slice(-limit);
  }

  getTemplateForQuery(type) {
    return getPromptTemplate(type);
  }

  getSummary(options = {}) {
    return generateConversationSummary(this.messages, options);
  }

  compressHistory() {
    if (this.messages.length <= this.compressionThreshold) return;
    
    const compressed = compressLongConversation(this.messages, 2000);
    this.messages = compressed;
    this.metadata.compressed = true;
    this.metadata.compressionDate = new Date().toISOString();
  }

  getRelevantContext(query, maxMessages = 5, options = {}) {
    const {
      useSemanticRanking = true,
      maxTokens = 2000
    } = options;

    // Always include recent messages
    const recentMessages = this.messages.slice(-maxMessages);
    
    if (!useSemanticRanking || this.messages.length <= maxMessages) {
      return recentMessages;
    }

    // Extract keywords and topics from query
    const queryKeywords = this.extractKeywords(query);
    const queryTopics = this.identifyTopics(query);
    
    // Find older messages with semantic relevance
    const olderMessages = this.messages.slice(0, -maxMessages);
    const rankedOlderMessages = this.rankMessagesBySimilarity(
      olderMessages,
      queryKeywords,
      queryTopics
    );

    // Select top relevant older messages
    const relevantOlder = rankedOlderMessages.slice(0, 3);
    
    // Combine and ensure token limit
    const combinedMessages = [...relevantOlder, ...recentMessages];
    return this.trimToTokenLimit(combinedMessages, maxTokens);
  }

  extractKeywords(text) {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3);
    
    // Remove common words
    const stopWords = new Set(['what', 'when', 'where', 'which', 'this', 'that', 'these', 'those', 'with', 'from', 'about']);
    return words.filter(w => !stopWords.has(w));
  }

  identifyTopics(text) {
    const topicKeywords = {
      stocks: ['stock', 'stocks', 'share', 'shares', 'equity'],
      bonds: ['bond', 'bonds', 'treasury', 'fixed income'],
      etf: ['etf', 'index fund', 'mutual fund', 'fund'],
      crypto: ['crypto', 'bitcoin', 'ethereum', 'cryptocurrency'],
      savings: ['save', 'saving', 'savings', 'deposit'],
      risk: ['risk', 'risky', 'volatile', 'volatility', 'safe'],
      portfolio: ['portfolio', 'diversif', 'allocation', 'balance'],
      retirement: ['retirement', '401k', 'ira', 'roth', 'pension']
    };

    const lowerText = text.toLowerCase();
    const identifiedTopics = [];

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        identifiedTopics.push(topic);
      }
    }

    return identifiedTopics;
  }

  rankMessagesBySimilarity(messages, queryKeywords, queryTopics) {
    return messages
      .map(msg => {
        const msgKeywords = this.extractKeywords(msg.content);
        const msgTopics = this.identifyTopics(msg.content);
        
        // Calculate keyword overlap score
        const keywordOverlap = msgKeywords.filter(k => 
          queryKeywords.includes(k)
        ).length;
        
        // Calculate topic overlap score
        const topicOverlap = msgTopics.filter(t => 
          queryTopics.includes(t)
        ).length;
        
        // Boost score for user messages (they contain the actual questions)
        const roleBoost = msg.role === 'user' ? 1.5 : 1.0;
        
        // Calculate recency score (newer messages get slight boost)
        const recencyScore = 1.0; // Could add timestamp-based scoring
        
        const score = (keywordOverlap * 2 + topicOverlap * 3) * roleBoost * recencyScore;
        
        return { msg, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.msg);
  }

  trimToTokenLimit(messages, maxTokens) {
    let totalTokens = 0;
    const trimmedMessages = [];

    // Add messages from most recent backwards until token limit
    for (let i = messages.length - 1; i >= 0; i--) {
      const msgTokens = this.estimateTokens(messages[i].content);
      if (totalTokens + msgTokens <= maxTokens) {
        trimmedMessages.unshift(messages[i]);
        totalTokens += msgTokens;
      } else {
        break;
      }
    }

    return trimmedMessages;
  }

  estimateTokens(text) {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  getMetadata() {
    return {
      ...this.metadata,
      currentMessageCount: this.messages.length,
      topics: this.extractTopics(),
      averageMessageLength: this.messages.length > 0 
        ? Math.round(this.messages.reduce((sum, msg) => sum + msg.content.length, 0) / this.messages.length)
        : 0
    };
  }

  extractTopics() {
    const topics = new Set();
    const keywords = ['stock', 'bond', 'etf', 'crypto', 'savings', 'budget', 'invest', 'portfolio'];
    
    this.messages.forEach(msg => {
      const content = msg.content.toLowerCase();
      keywords.forEach(keyword => {
        if (content.includes(keyword)) {
          topics.add(keyword);
        }
      });
    });
    
    return Array.from(topics);
  }

  async saveToFirestore(db) {
    if (!db || !this.userId) return null;
    
    try {
      const conversationData = {
        userId: this.userId,
        conversationId: this.metadata.conversationId,
        messages: this.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          metadata: msg.metadata
        })),
        metadata: this.getMetadata(),
        updatedAt: new Date()
      };
      
      // This would integrate with Firebase
      // await setDoc(doc(db, 'conversations', this.metadata.conversationId), conversationData);
      
      return conversationData;
    } catch (error) {
      console.error('Error saving conversation:', error);
      throw error;
    }
  }

  static async loadFromFirestore(db, userId, conversationId) {
    if (!db || !userId || !conversationId) return null;
    
    // Firestore functionality removed - using Supabase instead
    // This method is kept for backward compatibility
    return null;
  }

  exportConversation() {
    return {
      userId: this.userId,
      conversationId: this.metadata.conversationId,
      messages: this.messages,
      metadata: this.getMetadata(),
      exportedAt: new Date().toISOString()
    };
  }
}
