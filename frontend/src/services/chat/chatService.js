import { v4 as uuidv4 } from 'uuid';
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { classifyQuery } from './queryClassifier';
import { generateSystemPrompt } from './promptTemplates';
import { formatResponse } from './responseFormatter';
import { applySafetyChecks } from './safetyGuardrails';

const db = getFirestore();
const MAX_HISTORY_LENGTH = 10; // Keep last 10 messages in memory
const MAX_CONVERSATION_AGE_DAYS = 30; // Archive conversations older than 30 days

/**
 * Core chat service with enhanced features
 */
class ChatService {
  constructor(userId, userContext = {}) {
    this.userId = userId;
    this.userContext = userContext;
    this.conversationId = null;
    this.sessionId = uuidv4();
    this.messageHistory = [];
    this.conversationSummary = '';
  }

  /**
   * Initialize a new conversation or load existing one
   */
  async initialize() {
    try {
      if (!this.userId) throw new Error('User ID is required');
      
      // Try to load the most recent conversation
      const latestConversation = await this._loadLatestConversation();
      
      if (latestConversation) {
        this.conversationId = latestConversation.id;
        this.messageHistory = latestConversation.messages || [];
        this.conversationSummary = latestConversation.summary || '';
      } else {
        // Start a new conversation
        this.conversationId = `conv_${uuidv4()}`;
        await this._initializeConversationInFirestore();
      }
      
      return {
        success: true,
        conversationId: this.conversationId,
        messages: this.messageHistory,
        summary: this.conversationSummary
      };
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      return {
        success: false,
        error: 'Failed to initialize chat',
        details: error.message
      };
    }
  }

  /**
   * Send a message and get AI response
   */
  async sendMessage(message) {
    try {
      if (!message?.trim()) throw new Error('Message cannot be empty');
      if (!this.conversationId) await this.initialize();

      // Add user message to history
      const userMessage = this._createMessage('user', message);
      this._addToHistory(userMessage);

      // Classify query and get appropriate system prompt
      const queryType = classifyQuery(message);
      const systemPrompt = generateSystemPrompt({
        ...this.userContext,
        queryType,
        conversationHistory: this._getRecentHistory(),
        conversationSummary: this.conversationSummary
      });

      // Call LLM API
      const aiResponse = await this._callLLM(systemPrompt, message);
      
      // Apply safety checks and formatting
      const safeResponse = applySafetyChecks(aiResponse, this.userContext);
      const formattedResponse = formatResponse(safeResponse, queryType);
      
      // Create AI message
      const aiMessage = this._createMessage('assistant', formattedResponse, {
        queryType,
        tokensUsed: aiResponse.usage?.total_tokens,
        model: aiResponse.model
      });
      
      // Update conversation in Firestore
      await this._updateConversation([userMessage, aiMessage]);
      
      return {
        success: true,
        message: aiMessage,
        conversationId: this.conversationId
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        success: false,
        error: 'Failed to send message',
        details: error.message
      };
    }
  }

  /**
   * Clear conversation history
   */
  async clearConversation() {
    try {
      this.messageHistory = [];
      this.conversationSummary = '';
      
      if (this.conversationId) {
        await this._updateConversation([], true);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error clearing conversation:', error);
      return {
        success: false,
        error: 'Failed to clear conversation'
      };
    }
  }

  // Private methods
  async _loadLatestConversation() {
    const userRef = doc(db, 'users', this.userId);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      const userData = docSnap.data();
      if (userData.conversations?.length > 0) {
        // Sort by timestamp and get the most recent
        const latest = [...userData.conversations]
          .sort((a, b) => b.updatedAt?.toDate() - a.updatedAt?.toDate())[0];
          
        // Only return if not too old
        const ageInDays = (Date.now() - latest.updatedAt?.toDate()) / (1000 * 60 * 60 * 24);
        return ageInDays <= MAX_CONVERSATION_AGE_DAYS ? latest : null;
      }
    }
    return null;
  }

  async _initializeConversationInFirestore() {
    const userRef = doc(db, 'users', this.userId);
    const conversationData = {
      id: this.conversationId,
      sessionId: this.sessionId,
      userId: this.userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      messages: [],
      summary: '',
      metadata: {
        userContext: this.userContext,
        version: '1.0'
      }
    };

    await setDoc(userRef, {
      conversations: arrayUnion(conversationData)
    }, { merge: true });
  }

  async _updateConversation(messages, isNew = false) {
    if (!this.conversationId) return;

    const userRef = doc(db, 'users', this.userId);
    const updateData = {
      'conversations.$[conv].messages': arrayUnion(...messages),
      'conversations.$[conv].updatedAt': serverTimestamp()
    };

    if (isNew) {
      updateData['conversations.$[conv].messages'] = messages;
      updateData['conversations.$[conv].summary'] = '';
    }

    await updateDoc(userRef, updateData, {
      arrayFilters: [{ 'conv.id': this.conversationId }]
    });
  }

  _createMessage(role, content, metadata = {}) {
    return {
      id: `${role}_${Date.now()}`,
      role,
      content,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        tokens: this._estimateTokenCount(content)
      }
    };
  }

  _addToHistory(message) {
    this.messageHistory.push(message);
    
    // Keep history within limits
    if (this.messageHistory.length > MAX_HISTORY_LENGTH * 2) {
      this.messageHistory = this.messageHistory.slice(-MAX_HISTORY_LENGTH);
      // TODO: Implement conversation summarization here
    }
  }

  _getRecentHistory() {
    return this.messageHistory.slice(-MAX_HISTORY_LENGTH);
  }

  _estimateTokenCount(text) {
    // Rough estimate: ~4 characters per token
    return Math.ceil((text?.length || 0) / 4);
  }

  async _callLLM(systemPrompt, userMessage) {
    // TODO: Implement actual LLM API call
    // This is a placeholder for the actual implementation
    return {
      content: "I'm an AI assistant. This is a placeholder response.",
      usage: { total_tokens: 0 },
      model: 'llama-4-scout'
    };
  }
}

export default ChatService;
