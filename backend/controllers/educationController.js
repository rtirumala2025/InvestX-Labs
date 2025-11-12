import {
  adminSupabase,
  createApiResponse,
  handleSupabaseError,
  logger
} from '../ai-system/index.js';
import offlineEducation from '../data/offlineEducation.js';

const transformLessons = (lessons = []) =>
  lessons.reduce((acc, lesson) => {
    const moduleId = lesson.module_id;
    if (!moduleId) return acc;
    if (!acc[moduleId]) acc[moduleId] = [];
    acc[moduleId].push(lesson);
    return acc;
  }, {});

const transformModules = (modules = []) =>
  modules.reduce((acc, module) => {
    const courseId = module.course_id;
    if (!courseId) return acc;
    if (!acc[courseId]) acc[courseId] = [];
    acc[courseId].push(module);
    return acc;
  }, {});

const aggregateSupabaseEducation = async () => {
  if (!adminSupabase) {
    throw new Error('Supabase client unavailable');
  }

  const [
    { data: courses, error: coursesError },
    { data: modules, error: modulesError },
    { data: lessons, error: lessonsError },
    quizzesResult
  ] = await Promise.all([
    adminSupabase.from('courses').select('*').order('title', { ascending: true }),
    adminSupabase.from('modules').select('*').order('order_index', { ascending: true }),
    adminSupabase.from('lessons').select('*').order('order_index', { ascending: true }),
    adminSupabase
      .from('quizzes')
      .select('id, lesson_id, title, questions')
      .order('created_at', { ascending: true })
      .then((result) => {
        // quizzes table may not exist; ignore "relation does not exist"
        if (result.error && /relation .* does not exist/i.test(result.error.message || '')) {
          return { data: [], error: null };
        }
        return result;
      })
  ]);

  const firstError = coursesError || modulesError || lessonsError || quizzesResult.error;

  if (firstError) {
    const normalized = handleSupabaseError(firstError, { scope: 'education:content' });
    const error = new Error(normalized.message);
    Object.assign(error, normalized);
    throw error;
  }

  const moduleMap = transformModules(modules || []);
  const lessonMap = transformLessons(lessons || []);
  const quizMap = (quizzesResult.data || []).reduce((acc, quiz) => {
    if (quiz.lesson_id) {
      acc[quiz.lesson_id] = quiz;
    }
    return acc;
  }, {});

  return {
    courses: courses || [],
    modules: moduleMap,
    lessons: lessonMap,
    quizzes: quizMap
  };
};

export const getEducationContent = async (req, res) => {
  try {
    const payload = await aggregateSupabaseEducation();
    return res.status(200).json(
      createApiResponse(payload, {
        message: 'Education content loaded successfully'
      })
    );
  } catch (error) {
    logger.warn('Education content fallback triggered', { error: error.message });
    return res.status(200).json(
      createApiResponse(offlineEducation, {
        message: 'Serving offline education dataset',
        metadata: { offline: true }
      })
    );
  }
};

export const getUserProgress = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json(
      createApiResponse(null, {
        success: false,
        statusCode: 400,
        message: 'userId is required'
      })
    );
  }

  if (!adminSupabase) {
    logger.warn('Supabase unavailable: returning empty progress for user', { userId });
    return res.status(200).json(
      createApiResponse(
        {
          progress: [],
          offline: true
        },
        {
          message: 'Supabase unavailable; returning offline progress snapshot',
          metadata: { offline: true }
        }
      )
    );
  }

  try {
    const { data, error } = await adminSupabase
      .from('user_progress')
      .select('lesson_id, status, completed_at, updated_at')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return res.status(200).json(
      createApiResponse(
        {
          progress: data || [],
          offline: false
        },
        'User progress loaded'
      )
    );
  } catch (error) {
    const normalized = handleSupabaseError(error, { userId, scope: 'education:progress:get' });
    return res.status(200).json(
      createApiResponse(
        {
          progress: [],
          offline: true
        },
        {
          message: normalized.message || 'Unable to load user progress; using offline snapshot.',
          metadata: { offline: true }
        }
      )
    );
  }
};

export const upsertUserProgress = async (req, res) => {
  const { userId, lessonId, status = 'completed' } = req.body || {};

  if (!userId || !lessonId) {
    return res.status(400).json(
      createApiResponse(null, {
        success: false,
        statusCode: 400,
        message: 'userId and lessonId are required'
      })
    );
  }

  if (!adminSupabase) {
    logger.warn('Supabase unavailable: queuing progress update offline', { userId, lessonId, status });
    return res.status(200).json(
      createApiResponse(
        {
          queued: true,
          offline: true
        },
        {
          message: 'Supabase unavailable; progress update queued locally.',
          metadata: { offline: true }
        }
      )
    );
  }

  try {
    const payload = {
      user_id: userId,
      lesson_id: lessonId,
      status,
      updated_at: new Date().toISOString(),
      ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {})
    };

    const { data, error } = await adminSupabase
      .from('user_progress')
      .upsert(payload, { onConflict: 'user_id,lesson_id' })
      .select('*')
      .maybeSingle();

    if (error) {
      throw error;
    }

    return res.status(200).json(
      createApiResponse(
        {
          progress: data,
          queued: false,
          offline: false
        },
        'Progress updated successfully'
      )
    );
  } catch (error) {
    const normalized = handleSupabaseError(error, { userId, lessonId, scope: 'education:progress:upsert' });
    return res.status(200).json(
      createApiResponse(
        {
          queued: true,
          offline: true
        },
        {
          message: normalized.message || 'Unable to persist progress; queued for sync.',
          metadata: { offline: true }
        }
      )
    );
  }
};

