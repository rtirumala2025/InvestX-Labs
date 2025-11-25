import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import {
  getCourses,
  getLessons,
  getModules,
  getUserProgress,
  updateProgress,
  loadCachedProgressSnapshot,
} from '../services/education/supabaseEducationService';
import { updateUserStats } from '../services/leaderboard/supabaseLeaderboardService';
import { useAchievements } from './AchievementsContext';
import { useApp } from './AppContext';

const EducationContext = createContext(null);

const LESSON_XP_REWARD = 50;

export const EducationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const { addAchievement } = useAchievements();
  const { queueToast, registerContext, handleGlobalError, isOnline } = useApp();

  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState({});
  const [lessons, setLessons] = useState({});
  const [progress, setProgress] = useState({});
  const [quizzes, setQuizzes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offline, setOffline] = useState(false);

  const resetEducationState = useCallback(() => {
    setCourses([]);
    setModules({});
    setLessons({});
    setProgress({});
    setQuizzes({});
    setError(null);
    setOffline(false);
  }, []);

  const fetchEducationContent = useCallback(async () => {
    setLoading(true);
    setError(null);

    let encounteredError = null;

    try {
      const {
        data: courseData,
        modules: modulesMap,
        lessons: lessonsMap,
        quizzes: quizzesMap,
        offline: isOffline
      } = await getCourses();

      const normalizedCourses = courseData || [];

      setCourses(normalizedCourses);
      setModules(modulesMap || {});
      setLessons(lessonsMap || {});
      setQuizzes(quizzesMap || {});
      setOffline(Boolean(isOffline));
      // Only show warning if actually offline (not just API unavailable)
      if (isOffline && !isOnline) {
        queueToast('Education content is in offline read-only mode.', 'warning', {
          id: 'education-offline'
        });
      }

      if (userId) {
        const { data: progressData, offline: progressOffline, error: progressError } = await getUserProgress(userId);

        if (progressError) {
          encounteredError = progressError;
          setProgress({});
          // Only show error if actually offline, otherwise it's likely a backend issue
          if (!isOnline) {
            queueToast(progressError?.message || 'Unable to load learning progress.', 'error');
          }
        } else {
          const progressMap = {};
          (progressData || []).forEach((row) => {
            if (row.lesson_id) {
              progressMap[row.lesson_id] = row.status || 'completed';
            }
          });
          setProgress(progressMap);
          // Only show warning if actually offline
          if (progressOffline && !isOnline) {
            queueToast('Learning progress updates will sync when you reconnect.', 'warning', {
              id: 'education-progress-offline'
            });
          }
        }
      } else {
        setProgress({});
      }

      if (encounteredError) {
        const message =
          encounteredError?.message || 'Some education content may be unavailable right now.';
        setError(message);
        queueToast(message, 'error');
      } else {
        setError(null);
      }
    } catch (err) {
      console.debug?.('EducationContext unexpected content load error', err);
      resetEducationState();
      const message = err?.message || 'Unable to load education content.';
      setError(message);
      handleGlobalError(err, { context: 'education' });
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, [handleGlobalError, queueToast, resetEducationState, userId]);

  useEffect(() => {
    fetchEducationContent();
  }, [fetchEducationContent]);

  const markLessonComplete = useCallback(
    async (lessonId, status = 'completed') => {
      if (!userId) {
        queueToast('Please sign in to track your learning progress.', 'error');
        return { success: false, error: new Error('Not authenticated') };
      }

      let previousStatus;
      let didChange = false;
      let updatedProgressSnapshot = null;

      setProgress((prev) => {
        previousStatus = prev[lessonId];
        if (prev[lessonId] === status) {
          updatedProgressSnapshot = prev;
          return prev;
        }
        didChange = true;
        updatedProgressSnapshot = {
          ...prev,
          [lessonId]: status,
        };
        return updatedProgressSnapshot;
      });

      if (!didChange) {
        return { success: true };
      }

      const { data: persistedProgress, queued, error: progressError, offline: progressOffline } = await updateProgress(userId, lessonId, status);

      if (progressError && !queued) {
        setProgress((prev) => {
          if (previousStatus === undefined) {
            const { [lessonId]: _removed, ...rest } = prev;
            return rest;
          }
          return {
            ...prev,
            [lessonId]: previousStatus,
          };
        });
        return { success: false, error: progressError };
      }

      // Only show warning if actually offline
      if ((queued || progressOffline) && !isOnline) {
        queueToast('Progress saved locally. We will sync it when you reconnect.', 'warning');
      }

      const isNewCompletion = previousStatus !== 'completed' && status === 'completed';
      if (isNewCompletion) {
        try {
          await updateUserStats(userId, LESSON_XP_REWARD, 0);
        } catch (statsError) {
          console.debug?.('EducationContext update user stats warning', statsError);
        }

        const totalCompletedLessons = Object.values(updatedProgressSnapshot || {})
          .filter((lessonStatus) => lessonStatus === 'completed').length;

        if (totalCompletedLessons === 1) {
          await addAchievement('first_lesson', { lessonId }, { xpReward: 0 });
        } else if (totalCompletedLessons === 5) {
          await addAchievement('knowledge_seeker', { totalCompletedLessons }, { xpReward: 100 });
        } else if (totalCompletedLessons >= 10) {
          await addAchievement('learning_streak', { totalCompletedLessons }, { xpReward: 150, allowDuplicates: false });
        }
      }

      if (!queued && !progressOffline) {
        queueToast('Lesson progress updated! 🎉', 'success');
      }
      return { success: true };
    },
    [addAchievement, queueToast, userId]
  );

  const value = useMemo(
    () => ({
      courses,
      modules,
      lessons,
      quizzes,
      progress,
      loading,
      error,
      offline,
      markLessonComplete,
      refreshEducation: fetchEducationContent,
    }),
    [courses, modules, lessons, quizzes, progress, loading, error, offline, markLessonComplete, fetchEducationContent]
  );

  useEffect(() => {
    let unregister;
    if (registerContext) {
      unregister = registerContext('education', {
        coursesCount: courses.length,
        modulesCount: Object.keys(modules || {}).length,
        lessonsCount: Object.values(lessons || {}).reduce(
          (total, list) => total + (Array.isArray(list) ? list.length : 0),
          0
        ),
        progressCount: Object.keys(progress || {}).length,
        loading,
        error,
        offline,
      });
    }
    return () => unregister?.();
  }, [courses, error, lessons, loading, modules, offline, progress, registerContext]);

  useEffect(() => {
    if (!userId || !isOnline) return;
    const cached = loadCachedProgressSnapshot(userId) || [];
    const queuedEntries = cached.filter((entry) => entry?.queued);
    if (!queuedEntries.length) return;

    const syncQueuedProgress = async () => {
      try {
        for (const entry of queuedEntries) {
          await updateProgress(userId, entry.lesson_id, entry.status || 'completed');
        }
        await fetchEducationContent();
      } catch (syncError) {
        console.warn('📘 [EducationContext] Failed to sync queued progress', syncError);
      }
    };

    syncQueuedProgress();
  }, [fetchEducationContent, isOnline, userId]);

  return <EducationContext.Provider value={value}>{children}</EducationContext.Provider>;
};

export const useEducation = () => {
  const context = useContext(EducationContext);
  if (!context) {
    throw new Error('useEducation must be used within an EducationProvider');
  }
  return context;
};

export default EducationContext;
