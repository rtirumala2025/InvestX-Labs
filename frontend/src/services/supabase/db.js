import { supabase } from './config';

/**
 * Get all documents from a table
 * @param {string} table - Table name
 * @param {string} columns - Columns to select (default: '*')
 * @param {Object} filters - Optional filters { column: value }
 * @returns {Promise<Array>} Array of documents
 */
export const getDocuments = async (table, columns = '*', filters = {}) => {
  let query = supabase
    .from(table)
    .select(columns);
  
  // Apply filters
  Object.entries(filters).forEach(([column, value]) => {
    query = query.eq(column, value);
  });
  
  const { data, error } = await query;
  
  if (error) {
    console.error(`[db.js] Error fetching documents from ${table}:`, error);
    throw error;
  }
  
  console.log(`[db.js] ✅ Fetched ${data?.length || 0} documents from ${table}`);
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
  console.log(`[db.js] Adding document to ${table}:`, data);
  
  const { data: result, error } = await supabase
    .from(table)
    .insert([data])
    .select()
    .single();
    
  if (error) {
    console.error(`[db.js] Error adding document to ${table}:`, error);
    throw error;
  }
  
  console.log(`[db.js] ✅ Document added to ${table}:`, result.id);
  return result;
};

/**
 * Update a document
 * @param {string} table - Table name
 * @param {string} id - Document ID
 * @param {Object} updates - Fields to update
 * @param {Object} additionalFilters - Additional filters (e.g., { user_id: userId })
 * @returns {Promise<Object>} Updated document
 */
export const updateDocument = async (table, id, updates, additionalFilters = {}) => {
  console.log(`[db.js] Updating document in ${table}:`, id, updates);
  
  let query = supabase
    .from(table)
    .update(updates)
    .eq('id', id);
  
  // Apply additional filters (e.g., user_id for security)
  Object.entries(additionalFilters).forEach(([column, value]) => {
    query = query.eq(column, value);
  });
  
  const { data, error } = await query
    .select()
    .single();
    
  if (error) {
    console.error(`[db.js] Error updating document in ${table}:`, error);
    throw error;
  }
  
  console.log(`[db.js] ✅ Document updated in ${table}:`, id);
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
