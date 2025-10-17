/**
 * Multi-Device Session Synchronization
 * Handles merging conversations across devices with conflict resolution
 */

import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export class MultiDeviceSync {
  constructor(db, userId) {
    this.db = db;
    this.userId = userId;
  }

  /**
   * Sync conversations across all user devices
   * @param {string} currentDeviceId - Current device identifier
   * @returns {Object} Sync result with merged messages
   */
  async syncAllDevices(currentDeviceId) {
    try {
      // 1. Load all conversations for this user
      const conversations = await this.loadAllUserConversations();
      
      // 2. Merge messages chronologically
      const mergedMessages = this.mergeMessages(conversations);
      
      // 3. Load and merge user profile
      const userProfile = await this.loadUserProfile();
      
      // 4. Save merged conversation with current device
      await this.saveMergedConversation(mergedMessages, currentDeviceId);
      
      // 5. Update sync metadata
      await this.updateSyncMetadata(currentDeviceId, conversations.length);
      
      return {
        success: true,
        messageCount: mergedMessages.length,
        devicesCount: conversations.length,
        lastSync: new Date().toISOString(),
        userProfile
      };
    } catch (error) {
      console.error('Multi-device sync failed:', error);
      throw new Error(`Sync failed: ${error.message}`);
    }
  }

  /**
   * Load all conversations for user across devices
   */
  async loadAllUserConversations() {
    const conversationsRef = collection(this.db, 'conversations');
    const q = query(conversationsRef, where('userId', '==', this.userId));
    const querySnapshot = await getDocs(q);
    
    const conversations = [];
    querySnapshot.forEach((doc) => {
      conversations.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return conversations;
  }

  /**
   * Merge messages from multiple devices chronologically
   * Removes duplicates and preserves metadata
   */
  mergeMessages(conversations) {
    const allMessages = [];
    const messageSignatures = new Set();
    
    // Flatten all messages from all conversations
    conversations.forEach(conv => {
      if (conv.messages && Array.isArray(conv.messages)) {
        conv.messages.forEach(msg => {
          // Create signature for duplicate detection
          const signature = this.createMessageSignature(msg);
          
          if (!messageSignatures.has(signature)) {
            messageSignatures.add(signature);
            allMessages.push({
              ...msg,
              sourceDevice: conv.deviceId,
              sourceConversation: conv.conversationId
            });
          }
        });
      }
    });
    
    // Sort by timestamp
    allMessages.sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    return allMessages;
  }

  /**
   * Create unique signature for message deduplication
   */
  createMessageSignature(message) {
    const timestamp = new Date(message.timestamp).getTime();
    const roundedTimestamp = Math.floor(timestamp / 1000) * 1000; // Round to second
    return `${message.role}:${message.content.substring(0, 50)}:${roundedTimestamp}`;
  }

  /**
   * Load user profile from Firestore
   */
  async loadUserProfile() {
    const userProfileRef = doc(this.db, 'userProfiles', this.userId);
    const userProfileSnap = await getDoc(userProfileRef);
    
    if (userProfileSnap.exists()) {
      return userProfileSnap.data();
    }
    
    return null;
  }

  /**
   * Save merged conversation with current device ID
   */
  async saveMergedConversation(messages, deviceId) {
    const conversationId = `conv_${this.userId}_merged`;
    const conversationRef = doc(this.db, 'conversations', conversationId);
    
    const conversationData = {
      userId: this.userId,
      conversationId,
      deviceId,
      messages,
      metadata: {
        messageCount: messages.length,
        totalTokensEstimate: messages.reduce((sum, msg) => 
          sum + (msg.metadata?.tokenEstimate || 0), 0
        ),
        topics: this.extractTopics(messages),
        lastMerged: new Date().toISOString()
      },
      updatedAt: new Date(),
      lastSyncedAt: new Date().toISOString()
    };
    
    await setDoc(conversationRef, conversationData, { merge: true });
    return conversationData;
  }

  /**
   * Extract topics from messages
   */
  extractTopics(messages) {
    const topics = new Set();
    const keywords = ['stock', 'bond', 'etf', 'crypto', 'savings', 'budget', 'invest', 'portfolio'];
    
    messages.forEach(msg => {
      const content = msg.content.toLowerCase();
      keywords.forEach(keyword => {
        if (content.includes(keyword)) {
          topics.add(keyword);
        }
      });
    });
    
    return Array.from(topics);
  }

  /**
   * Update sync metadata for monitoring
   */
  async updateSyncMetadata(deviceId, deviceCount) {
    const syncMetadataRef = doc(this.db, 'syncMetadata', this.userId);
    
    await setDoc(syncMetadataRef, {
      userId: this.userId,
      lastSyncDevice: deviceId,
      lastSyncTime: new Date().toISOString(),
      devicesCount: deviceCount,
      syncHistory: {
        [new Date().toISOString()]: {
          deviceId,
          deviceCount,
          success: true
        }
      }
    }, { merge: true });
  }

  /**
   * Check if sync is needed (based on last sync time)
   */
  async needsSync(deviceId, maxAgeMinutes = 30) {
    const syncMetadataRef = doc(this.db, 'syncMetadata', this.userId);
    const syncMetadataSnap = await getDoc(syncMetadataRef);
    
    if (!syncMetadataSnap.exists()) {
      return true; // First sync
    }
    
    const metadata = syncMetadataSnap.data();
    const lastSync = new Date(metadata.lastSyncTime);
    const now = new Date();
    const ageMinutes = (now - lastSync) / 1000 / 60;
    
    return ageMinutes > maxAgeMinutes || metadata.lastSyncDevice !== deviceId;
  }
}

/**
 * Usage Example:
 * 
 * import { MultiDeviceSync } from './multiDeviceSync.js';
 * import { getFirestore } from 'firebase/firestore';
 * 
 * const db = getFirestore();
 * const deviceId = localStorage.getItem('deviceId') || generateDeviceId();
 * const sync = new MultiDeviceSync(db, userId);
 * 
 * // Check if sync needed
 * if (await sync.needsSync(deviceId)) {
 *   const result = await sync.syncAllDevices(deviceId);
 *   console.log('Synced', result.messageCount, 'messages from', result.devicesCount, 'devices');
 * }
 */

export default MultiDeviceSync;
