import axios from 'axios';
import offlineEducation from '../../data/offlineEducation';

const STORAGE_KEYS = {
  content: 'investx.education.offlineContent',
  progress: 'investx.education.offlineProgress'
};

const isBrowser = typeof window !== 'undefined';

const getStorage = () => {
  if (!isBrowser) return null;
  try {
    return window.localStorage;
  } catch (error) {
    console.warn('📘 [EducationService] Local storage unavailable:', error);
    return null;
  }
};

const cacheContentSnapshot = (payload) => {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.content, JSON.stringify(payload));
  } catch (error) {
    console.warn('📘 [EducationService] Failed to cache content snapshot:', error);
  }
};

const loadCachedContentSnapshot = () => {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEYS.content);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('📘 [EducationService] Failed to read cached content snapshot:', error);
    return null;
  }
};

const cacheProgressSnapshot = (userId, progress) => {
  const storage = getStorage();
  if (!storage || !userId) return;
  try {
    const raw = storage.getItem(STORAGE_KEYS.progress);
    const snapshots = raw ? JSON.parse(raw) : {};
    snapshots[userId] = progress;
    storage.setItem(STORAGE_KEYS.progress, JSON.stringify(snapshots));
  } catch (error) {
    console.warn('📘 [EducationService] Failed to cache progress snapshot:', error);
  }
};

const loadCachedProgressSnapshot = (userId) => {
  const storage = getStorage();
  if (!storage || !userId) return [];
  try {
    const raw = storage.getItem(STORAGE_KEYS.progress);
    if (!raw) return [];
    const snapshots = JSON.parse(raw);
    return snapshots[userId] || [];
  } catch (error) {
    console.warn('📘 [EducationService] Failed to read cached progress snapshot:', error);
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
  baseURL: `${API_BASE_URL}/education`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

const handleServiceError = (scope, error) => {
  console.error(`📘 [EducationService] ${scope} error:`, error);
};

const normalizeContent = (payload) => {
  if (!payload) return offlineEducation;
  const { courses, modules, lessons, quizzes } = payload;
  return {
    courses: Array.isArray(courses) ? courses : offlineEducation.courses,
    modules: modules && typeof modules === 'object' ? modules : offlineEducation.modules,
    lessons: lessons && typeof lessons === 'object' ? lessons : offlineEducation.lessons,
    quizzes: quizzes && typeof quizzes === 'object' ? quizzes : offlineEducation.quizzes
  };
};

export const getCourses = async () => {
  try {
    const response = await httpClient.get('/content');
    const payload = normalizeContent(response.data?.data);
    cacheContentSnapshot(payload);
    return { data: payload.courses, modules: payload.modules, lessons: payload.lessons, quizzes: payload.quizzes, offline: !!response.data?.data?.metadata?.offline };
  } catch (error) {
    handleServiceError('load content', error);
    
    // Only mark as offline if it's a network error, not just API unavailable
    const isNetworkError = !error.response && (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error'));
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    
    const cached = loadCachedContentSnapshot();
    if (cached) {
      return { data: cached.courses, modules: cached.modules, lessons: cached.lessons, quizzes: cached.quizzes, offline: isOffline || isNetworkError };
    }
    return { data: offlineEducation.courses, modules: offlineEducation.modules, lessons: offlineEducation.lessons, quizzes: offlineEducation.quizzes, offline: isOffline || isNetworkError, error };
  }
};

export const getModules = async (courseId, modulesMap) => {
  if (!courseId) {
    const error = new Error('courseId is required');
    handleServiceError('load modules', error);
    return { data: [], error };
  }

  const modules = modulesMap?.[courseId] || offlineEducation.modules[courseId] || [];
  return { data: modules, error: null };
};

export const getLessons = async (moduleId, lessonsMap) => {
  if (!moduleId) {
    const error = new Error('moduleId is required');
    handleServiceError('load lessons', error);
    return { data: [], error };
  }

  const lessons = lessonsMap?.[moduleId] || offlineEducation.lessons[moduleId] || [];
  return { data: lessons, error: null };
};

export const getQuizForLesson = (lessonId, quizzesMap) => {
  if (!lessonId) return null;
  return quizzesMap?.[lessonId] || offlineEducation.quizzes[lessonId] || null;
};

export const getUserProgress = async (userId) => {
  if (!userId) {
    return { data: [], offline: false, error: null };
  }

  try {
    const response = await httpClient.get(`/progress/${userId}`);
    const result = response.data?.data || {};
    if (Array.isArray(result.progress)) {
      cacheProgressSnapshot(userId, result.progress);
    }
    return { data: result.progress || [], offline: Boolean(result.offline), error: null };
  } catch (error) {
    handleServiceError('load user progress', error);
    
    // Only mark as offline if it's a network error, not just API unavailable
    const isNetworkError = !error.response && (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error'));
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    
    const cached = loadCachedProgressSnapshot(userId);
    return { data: cached, offline: isOffline || isNetworkError, error };
  }
};

export const updateProgress = async (userId, lessonId, status = 'completed') => {
  if (!userId || !lessonId) {
    const error = new Error('Both userId and lessonId are required');
    handleServiceError('update lesson progress', error);
    return { data: null, offline: true, queued: true, error };
  }

  try {
    const response = await httpClient.post('/progress', {
      userId,
      lessonId,
      status
    });

    const payload = response.data?.data || {};

    if (payload?.progress) {
      cacheProgressSnapshot(userId, [
        ...loadCachedProgressSnapshot(userId).filter((entry) => entry.lesson_id !== lessonId),
        payload.progress
      ]);
    } else if (payload?.queued) {
      const snapshot = loadCachedProgressSnapshot(userId);
      const existingIndex = snapshot.findIndex((entry) => entry.lesson_id === lessonId);
      const nextEntry = {
        lesson_id: lessonId,
        status,
        updated_at: new Date().toISOString(),
        queued: true
      };
      if (existingIndex >= 0) {
        snapshot[existingIndex] = nextEntry;
      } else {
        snapshot.push(nextEntry);
      }
      cacheProgressSnapshot(userId, snapshot);
    }

    return {
      data: payload?.progress || null,
      queued: Boolean(payload?.queued),
      offline: Boolean(payload?.metadata?.offline),
      error: null
    };
  } catch (error) {
    handleServiceError('update lesson progress', error);
    const snapshot = loadCachedProgressSnapshot(userId);
    const existingIndex = snapshot.findIndex((entry) => entry.lesson_id === lessonId);
    const nextEntry = {
      lesson_id: lessonId,
      status,
      updated_at: new Date().toISOString(),
      queued: true
    };
    if (existingIndex >= 0) {
      snapshot[existingIndex] = nextEntry;
    } else {
      snapshot.push(nextEntry);
    }
    cacheProgressSnapshot(userId, snapshot);
    return { data: nextEntry, queued: true, offline: true, error };
  }
};

const educationService = {
  getCourses,
  getModules,
  getLessons,
  getQuizForLesson,
  getUserProgress,
  updateProgress
};

export default educationService;
export { loadCachedProgressSnapshot };
