import logger from '../utils/logger.js';
import { aiEngine } from './aiEngine.js';
import { dataInsights } from './dataInsights.js';
import { fetchSymbolNews, summarizeHeadlines } from './newsService.js';
import {
  generateSuggestions,
  updateSuggestionConfidence,
  recordSuggestionInteraction,
  getSuggestionLogs,
  buildUserEmbedding
} from './suggestionEngine.js';
import {
  createApiResponse,
  validateInvestmentParams,
  generateRequestId,
  exponentialBackoff
} from './utils.js';
import {
  supabase,
  adminSupabase,
  ensureServiceRoleKey,
  handleSupabaseError
} from './supabaseClient.js';

export {
  aiEngine,
  dataInsights,
  fetchSymbolNews,
  summarizeHeadlines,
  generateSuggestions,
  updateSuggestionConfidence,
  recordSuggestionInteraction,
  getSuggestionLogs,
  buildUserEmbedding,
  createApiResponse,
  validateInvestmentParams,
  generateRequestId,
  exponentialBackoff,
  supabase,
  adminSupabase,
  ensureServiceRoleKey,
  handleSupabaseError,
  logger
};

