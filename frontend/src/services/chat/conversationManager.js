/**
 * Manages conversation state, history, and summarization
 */

import { v4 as uuidv4 } from 'uuid';
import { getFirestore, doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { generateConversationSummary } from './promptTemplates';
import { extractStructuredData } from './responseFormatter';

const db = getFirestore();
const MAX_MESSAGES_PER_CONVERSATION = 50;
const MAX_CONVERSATION_AGE_DAYS = 30;

/**
 * Manages conversation state and persistence
 */
class ConversationManager {
  constructor(userId, conversationId = null) {
    this.userId = userId;
    this.conversationId = conversationId || `conv_${uuidv4()}`;
    this.messages = [];
    this.summary = '';
    this.metadata = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
      tokensUsed: 0,
      version: '1.0'
    };
  }

  /**
   * Initializes conversation from Firestore or creates a new one
   */
  async initialize() {
    if (!this.conversationId) {
      this.conversationId = `conv_${uuidv4()}`;
      return this._createNewConversation();
    }

    try {
      const conversation = await this._loadConversation();
      if (conversation) {
        this.messages = conversation.messages || [];
        this.summary = conversation.summary || '';
        this.metadata = { ...this.metadata, ...(conversation.metadata || {}) };
        return { exists: true, isNew: false };
      }
      
      return this._createNewConversation();
    } catch (error) {
      console.error('Error initializing conversation:', error);
      return this._createNewConversation();
    }
  }

  /**
   * Adds a message to the conversation
   */
  async addMessage(role, content, metadata = {}) {
    const message = {
      id: `msg_${Date.now()}`,
      role,
      content,
      timestamp: new Date().toISOString(),
      metadata: {
        tokens: this._estimateTokenCount(content),
        ...metadata
      }
    };

    this.messages.push(message);
    this.metadata.messageCount++;
    this.metadata.tokens += (message.metadata.tokens || 0);
    this.metadata.updatedAt = new Date().toISOString();

    // Update conversation summary periodically
    if (this.messages.length % 5 === 0) {
      this.summary = await this._generateSummary();
    }

    // Save to Firestore
    await this._saveMessage(message);

    return message;
  }

  /**
   * Clears the current conversation
   */
  async clear() {
    // Archive current conversation
    await this._archiveConversation();
    
    // Start fresh
    this.conversationId = `conv_${uuidv4()}`;
    this.messages = [];
    this.summary = '';
    this.metadata = {
      ...this.metadata,
      messageCount: 0,
      tokensUsed: 0,
      updatedAt: new Date().toISOString()
    };

    return this._createNewConversation();
  }

  /**
   * Gets conversation context for LLM
   */
  getContext(maxTokens = 2000) {
    // Start with the most recent messages
    const recentMessages = [...this.messages].reverse();
    let tokenCount = 0;
    const contextMessages = [];
    
    // Add messages until we hit the token limit
    for (const msg of recentMessages) {
      const msgTokens = msg.metadata?.tokens || this._estimateTokenCount(msg.content);
      
      if (tokenCount + msgTokens > maxTokens) break;
      
      contextMessages.unshift(msg); // Add to beginning to maintain order
      tokenCount += msgTokens;
    }
    
    // Add summary if we have space
    if (this.summary && tokenCount < maxTokens * 0.3) {
      const summaryTokens = this._estimateTokenCount(this.summary);
      if (tokenCount + summaryTokens <= maxTokens) {
        contextMessages.unshift({
          role: 'system',
          content: `Conversation summary: ${this.summary}`,
          metadata: { isSummary: true }
        });
      }
    }
    
    return contextMessages;
  }

  // Private methods
  
  async _loadConversation() {
    if (!this.userId || !this.conversationId) return null;
    
    // In a real implementation, this would load from Firestore
    // For now, we'll just return null to simulate a new conversation
    return null;
  }
  
  async _createNewConversation() {
    this.metadata.createdAt = new Date().toISOString();
    this.metadata.updatedAt = new Date().toISOString();
    
    // In a real implementation, this would save to Firestore
    // await updateDoc(doc(db, 'users', this.userId), {
    //   conversations: arrayUnion({
    //     id: this.conversationId,
    //     userId: this.userId,
    //     summary: this.summary,
    //     messages: this.messages,
    //     metadata: this.metadata,
    //     createdAt: serverTimestamp(),
    //     updatedAt: serverTimestamp()
    //   })
    // });
    
    return { exists: false, isNew: true };
  }
  
  async _saveMessage(message) {
    if (!this.userId) return;
    
    // In a real implementation, this would update Firestore
    // const userRef = doc(db, 'users', this.userId);
    // await updateDoc(userRef, {
    //   'conversations.$[conv].messages': arrayUnion(message),
    //   'conversations.$[conv].summary': this.summary,
    //   'conversations.$[conv].metadata': this.metadata,
    //   'conversations.$[conv].updatedAt': serverTimestamp()
    // }, {
    //   arrayFilters: [{ 'conv.id': this.conversationId }]
    // });
  }
  
  async _archiveConversation() {
    if (!this.userId || !this.conversationId) return;
    
    // In a real implementation, this would move the conversation to an archive collection
    // and clean up the active conversations
  }
  
  async _generateSummary() {
    if (this.messages.length === 0) return '';
    
    // Use the last few messages to generate a summary
    const recentMessages = this.messages.slice(-5);
    const conversationText = recentMessages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');
    
    // In a real implementation, you might use an LLM to generate a better summary
    // For now, we'll use a simple approach
    return generateConversationSummary(conversationText);
  }
  
  _estimateTokenCount(text) {
    // Rough estimate: ~4 characters per token
    return Math.ceil((text?.length || 0) / 4);
  }
}

/**
 * Manages multiple conversations for a user
 */
export class ConversationHistoryManager {
  constructor(userId) {
    this.userId = userId;
    this.conversations = [];
    this.currentConversation = null;
  }

  /**
   * Loads conversation history for the user
   */
  async loadHistory(limit = 10) {
    // In a real implementation, this would load from Firestore
    // For now, we'll return an empty array
    this.conversations = [];
    return this.conversations;
  }

  /**
   * Gets a conversation by ID
   */
  async getConversation(conversationId) {
    if (this.currentConversation?.conversationId === conversationId) {
      return this.currentConversation;
    }

    // In a real implementation, this would load from Firestore
    const conversation = new ConversationManager(this.userId, conversationId);
    await conversation.initialize();
    
    this.currentConversation = conversation;
    return conversation;
  }

  /**
   * Creates a new conversation
   */
  async createConversation() {
    const conversation = new ConversationManager(this.userId);
    await conversation.initialize();
    
    this.currentConversation = conversation;
    this.conversations.unshift({
      id: conversation.conversationId,
      summary: 'New conversation',
      updatedAt: new Date().toISOString(),
      messageCount: 0
    });
    
    return conversation;
  }

  /**
   * Deletes a conversation
   */
  async deleteConversation(conversationId) {
    // In a real implementation, this would delete from Firestore
    this.conversations = this.conversations.filter(c => c.id !== conversationId);
    
    if (this.currentConversation?.conversationId === conversationId) {
      this.currentConversation = null;
    }
    
    return true;
  }
}

export default ConversationManager;
