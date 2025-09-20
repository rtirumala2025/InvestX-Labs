import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot 
} from 'firebase/firestore';
import { db } from './config';
import { 
  handleFirebaseError, 
  withFirebaseErrorHandling, 
  createNetworkAwareOperation,
  isOfflineError 
} from '../../utils/firebaseErrorHandler';

// Firestore service for InvestX Labs

/**
 * Add a new document to a collection
 * @param {string} collectionName - Name of the collection
 * @param {Object} data - Document data
 * @returns {Promise<string>} Document ID
 */
export const addDocument = async (collectionName, data) => {
  const networkAwareAdd = createNetworkAwareOperation(
    async () => {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    },
    {
      maxRetries: 3,
      baseDelay: 1000,
      queueWhenOffline: true
    }
  );

  return withFirebaseErrorHandling(
    () => networkAwareAdd(),
    `addDocument to ${collectionName}`
  );
};

/**
 * Get a document by ID
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @returns {Promise<Object|null>} Document data or null
 */
export const getDocument = async (collectionName, docId) => {
  const networkAwareGet = createNetworkAwareOperation(
    async () => {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        return null;
      }
    },
    {
      maxRetries: 3,
      baseDelay: 1000,
      queueWhenOffline: false // Don't queue read operations when offline
    }
  );

  return withFirebaseErrorHandling(
    () => networkAwareGet(),
    `getDocument ${collectionName}/${docId}`
  );
};

/**
 * Get all documents from a collection
 * @param {string} collectionName - Name of the collection
 * @param {Array} constraints - Query constraints
 * @returns {Promise<Array>} Array of documents
 */
export const getDocuments = async (collectionName, constraints = []) => {
  return withFirebaseErrorHandling(
    async () => {
      const collectionRef = collection(db, collectionName);
      const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;
      const querySnapshot = await getDocs(q);
      
      const documents = [];
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      
      return documents;
    },
    `getDocuments from ${collectionName}`
  );
};

/**
 * Update a document
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @param {Object} data - Updated data
 * @returns {Promise<void>}
 */
export const updateDocument = async (collectionName, docId, data) => {
  return withFirebaseErrorHandling(
    async () => {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      });
    },
    `updateDocument ${collectionName}/${docId}`
  );
};

/**
 * Delete a document
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @returns {Promise<void>}
 */
export const deleteDocument = async (collectionName, docId) => {
  return withFirebaseErrorHandling(
    async () => {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
    },
    `deleteDocument ${collectionName}/${docId}`
  );
};

/**
 * Listen to real-time updates for a collection
 * @param {string} collectionName - Name of the collection
 * @param {Array} constraints - Query constraints
 * @param {Function} callback - Callback function for updates
 * @returns {Function} Unsubscribe function
 */
export const subscribeToCollection = (collectionName, constraints = [], callback) => {
  const collectionRef = collection(db, collectionName);
  const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;
  
  return onSnapshot(q, 
    (querySnapshot) => {
      const documents = [];
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      callback(documents);
    },
    (error) => {
      handleFirebaseError(error, `subscribeToCollection ${collectionName}`, {
        showToast: false,
        logError: true
      });
      // Call callback with empty array on permission error
      callback([]);
    }
  );
};

/**
 * Listen to real-time updates for a single document
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @param {Function} callback - Callback function for updates
 * @returns {Function} Unsubscribe function
 */
export const subscribeToDocument = (collectionName, docId, callback) => {
  const docRef = doc(db, collectionName, docId);
  
  return onSnapshot(docRef, 
    (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() });
      } else {
        callback(null);
      }
    },
    (error) => {
      handleFirebaseError(error, `subscribeToDocument ${collectionName}/${docId}`, {
        showToast: false,
        logError: true
      });
      // Call callback with null on permission error
      callback(null);
    }
  );
};
