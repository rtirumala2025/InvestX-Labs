import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useEducation } from '../contexts/EducationContext';
import { useApp } from '../contexts/AppContext';

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const LessonView = () => {
  const { lessonId } = useParams();
  const { courses, modules, lessons, quizzes, progress, markLessonComplete, loading, offline } = useEducation();
  const contentRef = useRef(null);
  const { queueToast } = useApp();

  const [hasMarked, setHasMarked] = useState(false);
  const [quizState, setQuizState] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const flattenedLessons = useMemo(() => Object.values(lessons).flat(), [lessons]);
  const lesson = useMemo(
    () => flattenedLessons.find((item) => String(item.id) === String(lessonId)),
    [flattenedLessons, lessonId]
  );

  const moduleRecord = useMemo(() => {
    if (!lesson) return null;
    const moduleEntries = Object.values(modules).flat();
    return moduleEntries.find((module) => String(module.id) === String(lesson.module_id)) || null;
  }, [lesson, modules]);

  const courseRecord = useMemo(() => {
    if (!moduleRecord) return null;
    return courses.find((course) => String(course.id) === String(moduleRecord.course_id)) || null;
  }, [courses, moduleRecord]);

  useEffect(() => {
    if (lesson) {
      setHasMarked(progress[lesson.id] === 'completed');
    } else {
      setHasMarked(false);
    }
  }, [lesson, progress]);

  const handleCompletion = useCallback(async () => {
    if (!lesson || hasMarked) return;
    const { success } = await markLessonComplete(lesson.id, 'completed');
    if (success) {
      setHasMarked(true);
    }
  }, [lesson, hasMarked, markLessonComplete]);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!container || hasMarked) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight >= scrollHeight - 32) {
        handleCompletion();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleCompletion, hasMarked]);

  const quizData = useMemo(() => {
    if (!lesson) return null;
    if (quizzes?.[lesson.id]) return quizzes[lesson.id];
    if (lesson.quiz) {
      if (typeof lesson.quiz === 'string') {
        try {
          return JSON.parse(lesson.quiz);
        } catch (err) {
          console.warn('📘 [LessonView] Unable to parse quiz JSON:', err);
          return null;
        }
      }
      return lesson.quiz;
    }
    return null;
  }, [lesson, quizzes]);

  const quizQuestions = useMemo(() => {
    if (!quizData) return null;
    if (Array.isArray(quizData)) return quizData;
    if (Array.isArray(quizData.questions)) return quizData.questions;
    return null;
  }, [quizData]);

  const handleQuizOptionChange = useCallback((questionKey, value) => {
    setQuizState((prev) => ({ ...prev, [questionKey]: value }));
  }, []);

  const handleQuizSubmit = useCallback(async () => {
    if (!lesson || !quizQuestions?.length) return;

    const unanswered = quizQuestions.some((question, index) => {
      const key = question.id ?? index;
      return quizState[key] === undefined;
    });

    if (unanswered) {
      queueToast('Please answer every quiz question before submitting.', 'warning');
      return;
    }

    const { success } = await markLessonComplete(lesson.id, 'completed');
    if (success) {
      setHasMarked(true);
      setQuizSubmitted(true);
    }
  }, [lesson, quizQuestions, quizState, markLessonComplete]);

  const lessonContentBlocks = useMemo(() => {
    if (!lesson?.content) return [];

    if (typeof lesson.content === 'string') {
      return lesson.content.split(/\n{2,}/).filter(Boolean);
    }

    if (Array.isArray(lesson.content)) {
      return lesson.content;
    }

    if (typeof lesson.content === 'object') {
      return [JSON.stringify(lesson.content, null, 2)];
    }

    return [];
  }, [lesson]);

  const completedStatus = progress[lesson?.id] === 'completed';

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">
      <motion.div
        className="absolute -top-24 -left-24 w-80 h-80 bg-gradient-to-r from-blue-500/30 to-purple-500/15 rounded-full blur-3xl"
        animate={{ y: [0, 18, 0], x: [0, 12, 0] }}
        transition={{ repeat: Infinity, duration: 16, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-32 -right-24 w-[22rem] h-[22rem] bg-gradient-to-r from-green-400/20 to-emerald-400/15 rounded-full blur-3xl"
        animate={{ y: [0, -20, 0], x: [0, -12, 0] }}
        transition={{ repeat: Infinity, duration: 18, ease: 'easeInOut' }}
      />

      <main className="relative z-10 w-full max-w-5xl mx-auto px-3 lg:px-4 xl:px-6 py-4 lg:py-6">
        {loading && !lesson ? (
          <div className="flex justify-center py-24">
            <LoadingSpinner size="large" />
          </div>
        ) : null}

        {!loading && !lesson ? (
          <GlassCard variant="default" padding="large" className="text-center">
            <h2 className="text-2xl font-semibold text-white mb-2">Lesson not found</h2>
            <p className="text-sm text-white/60 mb-6">
              We couldn’t find the lesson you were looking for. It may have been moved or archived.
            </p>
            <GlassButton as={Link} to="/education" variant="primary">
              ← Back to Education
            </GlassButton>
          </GlassCard>
        ) : null}

        {lesson && (
          <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <GlassButton as={Link} to="/education" variant="glass" size="small">
                ← Back to Education
              </GlassButton>
              {completedStatus && (
                <span className="px-3 py-1 bg-green-500/20 text-green-200 text-xs rounded-full">Completed</span>
              )}
            </div>

            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{lesson.title}</h1>
              <div className="text-sm text-white/60 space-x-2">
                {courseRecord ? <span>{courseRecord.title}</span> : null}
                {moduleRecord ? <span>• {moduleRecord.title}</span> : null}
              </div>
            </div>

            <GlassCard variant="floating" padding="large" className="shadow-xl">
              <div
                ref={contentRef}
                className="max-h-[60vh] overflow-y-auto pr-2 space-y-4 text-white/80 leading-relaxed tracking-wide"
              >
                {lessonContentBlocks.length ? (
                  lessonContentBlocks.map((block, index) => (
                    <p key={index} className="whitespace-pre-line">
                      {block}
                    </p>
                  ))
                ) : (
                  <p className="text-white/60 text-sm">
                    Lesson content will be available soon. Check back later for new material.
                  </p>
                )}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <GlassButton variant="primary" onClick={handleCompletion} disabled={hasMarked}>
                  {hasMarked ? 'Lesson Completed' : 'Mark Lesson Complete'}
                </GlassButton>
                <GlassButton as={Link} to="/education" variant="glass">
                  Browse Other Lessons
                </GlassButton>
              </div>
            </GlassCard>

            {quizQuestions && quizQuestions.length > 0 && (
              <GlassCard variant="default" padding="large" shadow="large" className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">Quick Quiz</h2>
                  <p className="text-sm text-white/60">Answer the questions below to check your understanding.</p>
                </div>

                <div className="space-y-4">
                  {quizQuestions.map((question, index) => {
                    const key = question.id ?? index;
                    const options = question.options || [];
                    return (
                      <div key={key} className="p-4 bg-white/5 border border-white/10 rounded-lg">
                        <p className="text-sm font-medium text-white mb-3">
                          {index + 1}. {question.question || 'Answer the following:'}
                        </p>
                        <div className="space-y-2">
                          {options.map((option, optionIndex) => (
                            <label key={optionIndex} className="flex items-center space-x-2 text-sm text-white/80">
                              <input
                                type="radio"
                                name={`quiz-${key}`}
                                value={option.value ?? option}
                                checked={quizState[key] === (option.value ?? option)}
                                onChange={() => handleQuizOptionChange(key, option.value ?? option)}
                                className="text-blue-500 focus:ring-blue-400"
                              />
                              <span>{option.label ?? option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-3">
                  <GlassButton
                    variant="primary"
                    onClick={handleQuizSubmit}
                    disabled={hasMarked || quizSubmitted}
                  >
                    {hasMarked ? 'Quiz Completed' : 'Submit Quiz'}
                  </GlassButton>
                  {quizSubmitted && !hasMarked && (
                    <span className="text-xs text-white/60">
                      Quiz submitted. Once graded, your progress will update automatically.
                    </span>
                  )}
                </div>
              </GlassCard>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default LessonView;
