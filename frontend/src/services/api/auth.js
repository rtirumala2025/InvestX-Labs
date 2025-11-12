import { supabase } from '../supabase/config';

const SESSION_CACHE_KEY = 'investx.cachedSession';

const getStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch (error) {
    console.warn('Local storage unavailable:', error);
    return null;
  }
};

const getCachedSession = () => {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse cached session:', error);
    return null;
  }
};

const persistSession = (session) => {
  const storage = getStorage();
  if (!storage) return;

  try {
    if (session) {
      storage.setItem(SESSION_CACHE_KEY, JSON.stringify(session));
    } else {
      storage.removeItem(SESSION_CACHE_KEY);
    }
  } catch (error) {
    console.warn('Failed to persist session cache:', error);
  }
};

export const getSession = async () => {
  if (!supabase?.auth?.getSession) {
    return getCachedSession();
  }

  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    const session = data?.session ?? null;
    persistSession(session);
    return session;
  } catch (error) {
    console.warn('Supabase session fetch failed, using cached session.', error);
    return getCachedSession();
  }
};

export const isAuthenticated = async () => {
  const session = await getSession();
  return Boolean(session?.access_token || session?.accessToken);
};

export default {
  getSession,
  isAuthenticated
};
