import { useState, useEffect } from 'react';
import { 
  addDocument, 
  getDocument, 
  getDocuments, 
  updateDocument, 
  deleteDocument,
  subscribeToCollection,
  subscribeToDocument 
} from '../services/firebase/firestore';

/**
 * Custom hook for Firestore operations
 * @param {string} collectionName - Name of the Firestore collection
 * @param {string} docId - Document ID (optional, for single document operations)
 * @param {Array} constraints - Query constraints (optional)
 * @returns {Object} Firestore operations and data
 */
export const useFirestore = (collectionName, docId = null, constraints = []) => {
  const [documents, setDocuments] = useState([]);
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Subscribe to collection changes
  useEffect(() => {
    if (!collectionName) return;

    let unsubscribe;

    if (docId) {
      // Subscribe to single document
      unsubscribe = subscribeToDocument(collectionName, docId, (doc) => {
        setDocument(doc);
        setLoading(false);
      });
    } else {
      // Subscribe to collection
      unsubscribe = subscribeToCollection(collectionName, constraints, (docs) => {
        setDocuments(docs);
        setLoading(false);
      });
    }

    return unsubscribe;
  }, [collectionName, docId, JSON.stringify(constraints)]);

  const addDoc = async (data) => {
    try {
      setLoading(true);
      setError(null);
      const docId = await addDocument(collectionName, data);
      return docId;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateDoc = async (docId, data) => {
    try {
      setLoading(true);
      setError(null);
      await updateDocument(collectionName, docId, data);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteDoc = async (docId) => {
    try {
      setLoading(true);
      setError(null);
      await deleteDocument(collectionName, docId);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getDoc = async (docId) => {
    try {
      setLoading(true);
      setError(null);
      const doc = await getDocument(collectionName, docId);
      return doc;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getDocs = async (constraints = []) => {
    try {
      setLoading(true);
      setError(null);
      const docs = await getDocuments(collectionName, constraints);
      return docs;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    documents,
    document,
    loading,
    error,
    addDocument: addDoc,
    updateDocument: updateDoc,
    deleteDocument: deleteDoc,
    getDocument: getDoc,
    getDocuments: getDocs
  };
};
