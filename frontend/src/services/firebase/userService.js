import { 
  addDocument, 
  getDocument, 
  getDocuments, 
  updateDocument, 
  deleteDocument 
} from './firestore';
import { handleFirebaseError } from '../../utils/firebaseErrorHandler';

/**
 * User Profile Service
 * Manages user profile data in Firestore
 */

/**
 * Create a new user profile
 * @param {string} userId - User ID from Firebase Auth
 * @param {Object} userData - User profile data
 * @returns {Promise<string>} Document ID
 */
export const createUserProfile = async (userId, userData) => {
  try {
    const profileData = {
      ...userData,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Default user settings
      riskTolerance: 'moderate',
      investmentGoals: [],
      experienceLevel: 'beginner',
      notifications: {
        email: true,
        push: true,
        marketUpdates: true
      }
    };
    
    return await addDocument('users', profileData);
  } catch (error) {
    return handleFirebaseError(error, 'createUserProfile', {
      additionalData: { userId }
    });
  }
};

/**
 * Get user profile by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User profile data
 */
export const getUserProfile = async (userId) => {
  try {
    return await getDocument('users', userId);
  } catch (error) {
    return handleFirebaseError(error, 'getUserProfile', {
      additionalData: { userId }
    });
  }
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updates - Profile updates
 * @returns {Promise<void>}
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    await updateDocument('users', userId, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    return handleFirebaseError(error, 'updateUserProfile', {
      additionalData: { userId, updates }
    });
  }
};

/**
 * Get user's investment goals
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Investment goals
 */
export const getUserGoals = async (userId) => {
  try {
    const profile = await getUserProfile(userId);
    return profile?.investmentGoals || [];
  } catch (error) {
    console.error('Error getting user goals:', error);
    throw error;
  }
};

/**
 * Add investment goal
 * @param {string} userId - User ID
 * @param {Object} goal - Investment goal data
 * @returns {Promise<void>}
 */
export const addInvestmentGoal = async (userId, goal) => {
  try {
    const profile = await getUserProfile(userId);
    const currentGoals = profile?.investmentGoals || [];
    
    const newGoal = {
      id: Date.now().toString(),
      ...goal,
      createdAt: new Date()
    };
    
    await updateUserProfile(userId, {
      investmentGoals: [...currentGoals, newGoal]
    });
  } catch (error) {
    console.error('Error adding investment goal:', error);
    throw error;
  }
};

/**
 * Update user's risk tolerance
 * @param {string} userId - User ID
 * @param {string} riskLevel - Risk tolerance level
 * @returns {Promise<void>}
 */
export const updateRiskTolerance = async (userId, riskLevel) => {
  try {
    await updateUserProfile(userId, { riskTolerance: riskLevel });
  } catch (error) {
    console.error('Error updating risk tolerance:', error);
    throw error;
  }
};
