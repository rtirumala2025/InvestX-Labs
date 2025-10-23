import { useState, useEffect } from 'react';
import { 
  addDocument, 
  getDocument, 
  getDocuments, 
  updateDocument, 
  deleteDocument,
  subscribeToCollection
} from '../services/supabase/db';

/**
 * Custom hook for database operations
 * @param {string} table - Name of the database table
 * @param {string} docId - Document ID (optional, for single document operations)
 * @returns {Object} Database operations and data
 */
export const useFirestore = (table, docId = null) => {
  const [documents, setDocuments] = useState([]);
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load data on mount and when table/docId changes
  useEffect(() => {
    if (!table) return;

    const loadData = async () => {
      setLoading(true);
      try {
        if (docId) {
          const doc = await getDocument(table, docId);
          setDocument(doc);
        } else {
          const docs = await getDocuments(table);
          setDocuments(docs);
        }
      } catch (err) {
        setError(err);
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Set up real-time subscription
    const unsubscribe = subscribeToCollection(table, (payload) => {
      if (docId && payload.new?.id === docId) {
        setDocument(payload.new);
      } else if (!docId) {
        setDocuments(prev => {
          const index = prev.findIndex(doc => doc.id === payload.new?.id);
          if (index === -1) return [...prev, payload.new];
          return prev.map(doc => doc.id === payload.new.id ? payload.new : doc);
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [table, docId]);

  const addDoc = async (data) => {
    try {
      setLoading(true);
      setError(null);
      const result = await addDocument(table, data);
      return { success: true, id: result.id };
    } catch (err) {
      setError(err);
      console.error('Error adding document:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateDoc = async (updates) => {
    if (!docId) return { success: false, error: 'No document ID provided' };
    
    try {
      setLoading(true);
      setError(null);
      await updateDocument(table, docId, updates);
      return { success: true };
    } catch (err) {
      setError(err);
      console.error('Error updating document:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteDoc = async () => {
    if (!docId) return { success: false, error: 'No document ID provided' };
    
    try {
      setLoading(true);
      setError(null);
      await deleteDocument(table, docId);
      return { success: true };
    } catch (err) {
      setError(err);
      console.error('Error deleting document:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const getDoc = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const doc = await getDocument(table, id || docId);
      return doc;
    } catch (err) {
      setError(err);
      console.error('Error getting document:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getDocs = async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await getDocuments(table);
      return docs;
    } catch (err) {
      setError(err);
      console.error('Error getting documents:', err);
      return [];
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
