import { supabase } from './config';

/**
 * Get all documents from a table
 * @param {string} table - Table name
 * @param {string} columns - Columns to select (default: '*')
 * @returns {Promise<Array>} Array of documents
 */
export const getDocuments = async (table, columns = '*') => {
  const { data, error } = await supabase
    .from(table)
    .select(columns);
  
  if (error) throw error;
  return data || [];
};

/**
 * Get a single document by ID
 * @param {string} table - Table name
 * @param {string} id - Document ID
 * @param {string} columns - Columns to select (default: '*')
 * @returns {Promise<Object|null>} Document or null if not found
 */
export const getDocument = async (table, id, columns = '*') => {
  const { data, error } = await supabase
    .from(table)
    .select(columns)
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  
  return data;
};

/**
 * Add a new document to a table
 * @param {string} table - Table name
 * @param {Object} data - Document data
 * @returns {Promise<Object>} Created document
 */
export const addDocument = async (table, data) => {
  const { data: result, error } = await supabase
    .from(table)
    .insert([data])
    .select()
    .single();
    
  if (error) throw error;
  return result;
};

/**
 * Update a document
 * @param {string} table - Table name
 * @param {string} id - Document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated document
 */
export const updateDocument = async (table, id, updates) => {
  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

/**
 * Delete a document
 * @param {string} table - Table name
 * @param {string} id - Document ID
 * @returns {Promise<boolean>} True if successful
 */
export const deleteDocument = async (table, id) => {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);
    
  if (error) throw error;
  return true;
};

/**
 * Subscribe to changes in a table
 * @param {string} table - Table name
 * @param {Function} callback - Callback function for changes
 * @returns {Function} Unsubscribe function
 */
export const subscribeToCollection = (table, callback) => {
  const subscription = supabase
    .channel('table-db-changes')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table 
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

export default {
  getDocuments,
  getDocument,
  addDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection
};
