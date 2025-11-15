import axios from 'axios';
import { API_CONFIG } from '../../utils/constants';
import { logError, logInfo } from '../../utils/logger';

const deriveApiBaseUrl = () => {
  const explicit = process.env.REACT_APP_API_BASE_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  const configured = API_CONFIG?.BASE_URL;
  if (configured && configured !== 'https://api.investxlabs.com') {
    return configured.replace(/\/$/, '');
  }
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5001/api';
  }
  return '/api';
};

const API_BASE_URL = deriveApiBaseUrl();

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/ai`,
  timeout: API_CONFIG?.TIMEOUT || 10000,
  headers: { 'Content-Type': 'application/json' }
});

/**
 * Compute portfolio analytics on the server. Returns null if unavailable.
 * @param {Array} holdings
 * @param {Array} transactions
 * @param {Object} marketData
 * @returns {Promise<Object|null>}
 */
export const computeServerAnalytics = async ({ holdings = [], transactions = [], marketData = {} } = {}) => {
  try {
    const { data } = await apiClient.post('/analytics', {
      holdings,
      transactions,
      marketData
    });
    const payload = data?.data || null;
    if (payload) {
      logInfo('Received server-side analytics');
      return payload;
    }
    return null;
  } catch (error) {
    logError('Server analytics unavailable', error);
    return null;
  }
};

export default computeServerAnalytics;


