import { 
  getDocument, 
  getDocuments, 
  addDocument, 
  updateDocument 
} from './firestore';

/**
 * Educational Content Service
 * Manages educational content and user progress
 */

/**
 * Get all educational content
 * @returns {Promise<Array>} Array of educational content
 */
export const getAllEducationalContent = async () => {
  try {
    return await getDocuments('educational_content');
  } catch (error) {
    console.error('Error getting educational content:', error);
    throw error;
  }
};

/**
 * Get educational content by category
 * @param {string} category - Content category
 * @returns {Promise<Array>} Array of content in category
 */
export const getContentByCategory = async (category) => {
  try {
    const allContent = await getAllEducationalContent();
    return allContent.filter(content => content.category === category);
  } catch (error) {
    console.error('Error getting content by category:', error);
    throw error;
  }
};

/**
 * Get educational content by difficulty
 * @param {string} difficulty - Content difficulty level
 * @returns {Promise<Array>} Array of content by difficulty
 */
export const getContentByDifficulty = async (difficulty) => {
  try {
    const allContent = await getAllEducationalContent();
    return allContent.filter(content => content.difficulty === difficulty);
  } catch (error) {
    console.error('Error getting content by difficulty:', error);
    throw error;
  }
};

/**
 * Get specific educational content
 * @param {string} contentId - Content ID
 * @returns {Promise<Object|null>} Content data
 */
export const getEducationalContent = async (contentId) => {
  try {
    return await getDocument('educational_content', contentId);
  } catch (error) {
    console.error('Error getting educational content:', error);
    throw error;
  }
};

/**
 * Get user's learning progress
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User progress data
 */
export const getUserProgress = async (userId) => {
  try {
    return await getDocument('user_progress', userId);
  } catch (error) {
    console.error('Error getting user progress:', error);
    throw error;
  }
};

/**
 * Update user's learning progress
 * @param {string} userId - User ID
 * @param {string} contentId - Content ID
 * @param {Object} progress - Progress data
 * @returns {Promise<void>}
 */
export const updateUserProgress = async (userId, contentId, progress) => {
  try {
    const userProgress = await getUserProgress(userId) || {
      userId,
      completedContent: [],
      inProgressContent: [],
      totalTimeSpent: 0,
      achievements: [],
      createdAt: new Date()
    };
    
    // Update progress for specific content
    const contentProgress = {
      contentId,
      ...progress,
      updatedAt: new Date()
    };
    
    // Remove from in-progress if completed
    if (progress.completed) {
      userProgress.completedContent = userProgress.completedContent.filter(
        c => c.contentId !== contentId
      );
      userProgress.completedContent.push(contentProgress);
      
      userProgress.inProgressContent = userProgress.inProgressContent.filter(
        c => c.contentId !== contentId
      );
    } else {
      userProgress.inProgressContent = userProgress.inProgressContent.filter(
        c => c.contentId !== contentId
      );
      userProgress.inProgressContent.push(contentProgress);
    }
    
    // Update total time spent
    if (progress.timeSpent) {
      userProgress.totalTimeSpent += progress.timeSpent;
    }
    
    await updateDocument('user_progress', userId, {
      ...userProgress,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating user progress:', error);
    throw error;
  }
};

/**
 * Get user's completed content
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of completed content
 */
export const getCompletedContent = async (userId) => {
  try {
    const progress = await getUserProgress(userId);
    return progress?.completedContent || [];
  } catch (error) {
    console.error('Error getting completed content:', error);
    throw error;
  }
};

/**
 * Get user's in-progress content
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of in-progress content
 */
export const getInProgressContent = async (userId) => {
  try {
    const progress = await getUserProgress(userId);
    return progress?.inProgressContent || [];
  } catch (error) {
    console.error('Error getting in-progress content:', error);
    throw error;
  }
};
