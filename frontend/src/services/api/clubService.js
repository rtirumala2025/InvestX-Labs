import axios from 'axios';
import offlineClubs from '../../data/offlineClubs';

const STORAGE_KEYS = {
  clubs: 'investx.clubs.snapshot',
  queue: 'investx.clubs.pendingActions'
};

const isBrowser = typeof window !== 'undefined';

const getStorage = () => {
  if (!isBrowser) return null;
  try {
    return window.localStorage;
  } catch (error) {
    console.warn('🏛️ [ClubService] Local storage unavailable:', error);
    return null;
  }
};

const cacheClubs = (clubs) => {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.clubs, JSON.stringify(clubs));
  } catch (error) {
    console.warn('🏛️ [ClubService] Failed to cache clubs snapshot:', error);
  }
};

const loadCachedClubs = () => {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEYS.clubs);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('🏛️ [ClubService] Failed to read cached clubs snapshot:', error);
    return null;
  }
};

const cacheQueuedActions = (queue) => {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.queue, JSON.stringify(queue));
  } catch (error) {
    console.warn('🏛️ [ClubService] Failed to cache club queue:', error);
  }
};

const loadQueuedActions = () => {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEYS.queue);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn('🏛️ [ClubService] Failed to read queued club actions:', error);
    return [];
  }
};

const deriveApiBaseUrl = () => {
  const explicit = process.env.REACT_APP_API_BASE_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5001/api';
  }
  return '/api';
};

const API_BASE_URL = deriveApiBaseUrl();

const httpClient = axios.create({
  baseURL: `${API_BASE_URL}/clubs`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

const fallbackList = (reason) => {
  const cached = loadCachedClubs();
  if (cached?.length) {
    return { clubs: cached, offline: true, reason };
  }
  return { clubs: offlineClubs.clubs, offline: true, reason };
};

export const fetchClubs = async () => {
  try {
    const response = await httpClient.get('/');
    const payload = response.data?.data || {};
    const clubs = payload.clubs || [];
    cacheClubs(clubs);
    return { clubs, metadata: payload.metadata || {}, offline: Boolean(payload.metadata?.offline) };
  } catch (error) {
    console.warn('🏛️ [ClubService] load clubs error:', error);
    return fallbackList(error.message);
  }
};

export const fetchClubById = async (clubId) => {
  if (!clubId) {
    return { club: null, members: [], offline: true, reason: 'Missing clubId' };
  }

  try {
    const response = await httpClient.get(`/${clubId}`);
    const payload = response.data?.data || {};
    return {
      club: payload.club || null,
      members: payload.members || [],
      offline: Boolean(payload.metadata?.offline),
      metadata: payload.metadata || {},
      queued: Boolean(payload.queued)
    };
  } catch (error) {
    console.warn('🏛️ [ClubService] load club error:', error);
    const cached = loadCachedClubs() || offlineClubs.clubs;
    const club = cached.find((item) => item.id === clubId) || null;
    return {
      club,
      members: offlineClubs.members.filter((member) => member.club_id === clubId),
      offline: true,
      reason: error.message
    };
  }
};

export const createClub = async (payload) => {
  try {
    const response = await httpClient.post('/', payload);
    const data = response.data?.data || {};
    return {
      club: data.club,
      queued: Boolean(data.queued),
      offline: Boolean(data.metadata?.offline),
      metadata: data.metadata || {}
    };
  } catch (error) {
    console.warn('🏛️ [ClubService] create club error:', error);
    return {
      club: {
        id: payload?.id || `queued-club-${Date.now()}`,
        name: payload?.name,
        description: payload?.description || '',
        focus: payload?.focus || null,
        meetingCadence: payload?.meetingCadence || null,
        owner_id: payload?.ownerId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        offlineQueued: true
      },
      queued: true,
      offline: true,
      reason: error.message
    };
  }
};

export const updateClubById = async (clubId, payload) => {
  try {
    const response = await httpClient.put(`/${clubId}`, payload);
    const data = response.data?.data || {};
    return {
      club: data.club || null,
      queued: Boolean(data.queued),
      offline: Boolean(data.metadata?.offline),
      metadata: data.metadata || {}
    };
  } catch (error) {
    console.warn('🏛️ [ClubService] update club error:', error);
    return {
      club: {
        id: clubId,
        ...payload,
        updated_at: new Date().toISOString(),
        offlineQueued: true
      },
      queued: true,
      offline: true,
      reason: error.message
    };
  }
};

export const deleteClubById = async (clubId) => {
  try {
    const response = await httpClient.delete(`/${clubId}`);
    const data = response.data?.data || {};
    return {
      queued: Boolean(data.queued),
      offline: Boolean(data.metadata?.offline),
      metadata: data.metadata || {}
    };
  } catch (error) {
    console.warn('🏛️ [ClubService] delete club error:', error);
    return {
      queued: true,
      offline: true,
      reason: error.message
    };
  }
};

export {
  cacheClubs,
  loadCachedClubs,
  cacheQueuedActions,
  loadQueuedActions
};

