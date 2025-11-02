/**
 * useAuth Hook
 * 
 * This is a unified auth hook that re-exports from the main AuthContext.
 * All authentication logic is now centralized in contexts/AuthContext.js
 * 
 * This file exists for backward compatibility with components that import
 * from 'hooks/useAuth' rather than 'contexts/AuthContext'.
 */

export { useAuth, AuthProvider } from '../contexts/AuthContext';
