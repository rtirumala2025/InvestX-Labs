import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ProgressBar from '../components/ui/ProgressBar';
import Celebration from '../components/ui/Celebration';
import { useEducation } from '../contexts/EducationContext';
import { useAchievements } from '../contexts/AchievementsContext';
import { useApp } from '../contexts/AppContext';

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const staggerChildren = {
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const formatLabel = (value) =>
  (value || 'general')
    .toString()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const EducationPage = () => {
  const {
    courses,
    modules,
    lessons,
    progress,
    loading,
    error,
    offline,
    refreshEducation,
  } = useEducation();
  const {
    achievements: achievementsList,
    loading: achievementsLoading,
    error: achievementsError,
  } = useAchievements();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { queueToast } = useApp();
  
  // Calculate achievements count first
  const achievementsCount = achievementsList?.length || 0;
  
  // Track previous achievement count to detect new achievements
  const prevAchievementsCount = React.useRef(achievementsCount);
  
  useEffect(() => {
    if (achievementsCount > prevAchievementsCount.current && achievementsList?.length > 0) {
      const latestAchievement = achievementsList[0];
      setCelebrationData({
        title: 'Achievement Unlocked! 🎉',
        message: latestAchievement.details?.description || `You earned: ${latestAchievement.type.replace(/_/g, ' ')}`,
        icon: '🏆'
      });
      setShowCelebration(true);
      prevAchievementsCount.current = achievementsCount;
    }
  }, [achievementsCount, achievementsList]);

  const categories = useMemo(() => {
    const set = new Set();
    courses.forEach((course) => {
      if (course?.category) {
        set.add(course.category);
      }
    });
    return ['all', ...Array.from(set)];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    let filtered = courses;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((course) => course.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((course) => {
        const matchesTitle = course.title?.toLowerCase().includes(query);
        const matchesDescription = course.description?.toLowerCase().includes(query);
        const matchesCategory = course.category?.toLowerCase().includes(query);
        
        // Also check modules and lessons
        const courseModules = modules[course.id] || [];
        const matchesModule = courseModules.some((module) => 
          module.title?.toLowerCase().includes(query) ||
          module.summary?.toLowerCase().includes(query)
        );
        
        const courseLessons = courseModules.flatMap((module) => lessons[module.id] || []);
        const matchesLesson = courseLessons.some((lesson) =>
          lesson.title?.toLowerCase().includes(query) ||
          lesson.summary?.toLowerCase().includes(query)
        );
        
        return matchesTitle || matchesDescription || matchesCategory || matchesModule || matchesLesson;
      });
    }
    
    return filtered;
  }, [courses, selectedCategory, searchQuery, modules, lessons]);

  useEffect(() => {
    if (!filteredCourses.length) {
      setSelectedCourseId(null);
      return;
    }

    setSelectedCourseId((current) => {
      if (current && filteredCourses.some((course) => course.id === current)) {
        return current;
      }
      return filteredCourses[0]?.id ?? null;
    });
  }, [filteredCourses]);

  const courseModules = useMemo(() => {
    if (!selectedCourseId) return [];
    return modules[selectedCourseId] || [];
  }, [modules, selectedCourseId]);

  useEffect(() => {
    if (!courseModules.length) {
      setSelectedModuleId(null);
      return;
    }

    setSelectedModuleId((current) => {
      if (current && courseModules.some((module) => module.id === current)) {
        return current;
      }
      return courseModules[0]?.id ?? null;
    });
  }, [courseModules]);

  const selectedModuleLessons = useMemo(() => {
    if (!selectedModuleId) return [];
    return lessons[selectedModuleId] || [];
  }, [lessons, selectedModuleId]);

  const computeModuleProgress = useCallback(
    (moduleId) => {
      const moduleLessons = lessons[moduleId] || [];
      if (!moduleLessons.length) return 0;
      const completed = moduleLessons.filter((lesson) => progress[lesson.id] === 'completed').length;
      return Math.round((completed / moduleLessons.length) * 100);
    },
    [lessons, progress]
  );

  const computeCourseProgress = useCallback(
    (courseId) => {
      const courseModules = modules[courseId] || [];
      if (!courseModules.length) return 0;
      const lessonIds = courseModules.flatMap((module) => (lessons[module.id] || []).map((lesson) => lesson.id));
      if (!lessonIds.length) return 0;
      const completed = lessonIds.filter((id) => progress[id] === 'completed').length;
      return Math.round((completed / lessonIds.length) * 100);
    },
    [modules, lessons, progress]
  );

  const totalLessons = useMemo(
    () => Object.values(lessons).reduce((count, moduleLessons) => count + moduleLessons.length, 0),
    [lessons]
  );

  const completedLessons = useMemo(
    () => Object.values(progress).filter((status) => status === 'completed').length,
    [progress]
  );

  const overallProgress = totalLessons
    ? Math.round((completedLessons / Math.max(totalLessons, 1)) * 100)
    : 0;

  const activeCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) || null,
    [courses, selectedCourseId]
  );

  const activeModules = useMemo(
    () => (selectedCourseId ? modules[selectedCourseId] || [] : []),
    [modules, selectedCourseId]
  );

  const filteredCourseCount = filteredCourses.length;

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">
      {celebrationData && (
        <Celebration
          show={showCelebration}
          onComplete={() => {
            setShowCelebration(false);
            setCelebrationData(null);
          }}
          type="achievement"
          title={celebrationData.title}
          message={celebrationData.message}
          icon={celebrationData.icon}
          duration={3000}
        />
      )}
      <motion.div
        className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-r from-blue-500/30 to-purple-500/20 rounded-full blur-3xl"
        animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 15, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-40 -right-32 w-[28rem] h-[28rem] bg-gradient-to-r from-green-400/25 to-emerald-400/15 rounded-full blur-3xl"
        animate={{ y: [0, -25, 0], x: [0, -15, 0] }}
        transition={{ repeat: Infinity, duration: 20, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-orange-400/20 to-pink-400/15 rounded-full blur-3xl"
        animate={{ y: [0, 15, 0], x: [0, 20, 0] }}
        transition={{ repeat: Infinity, duration: 18, ease: 'easeInOut', delay: 5 }}
      />

      <main className="relative z-10 w-full max-w-[1920px] mx-auto px-3 lg:px-4 xl:px-6 py-4 lg:py-6">
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mb-4 lg:mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-green-300 to-orange-300 mb-2">
                Investment Academy 📚
              </h1>
              <p className="text-gray-300 text-base lg:text-lg max-w-2xl">
                Build real investing skills with courses, modular lessons, and interactive quizzes. Your progress syncs automatically with your InvestX profile.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <GlassButton variant="glass" size="default" onClick={refreshEducation} disabled={loading}>
                🔄 Refresh Content
              </GlassButton>
              <GlassButton variant="primary" size="default">
                📊 My Progress
              </GlassButton>
              {offline ? (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200/90">
                  Offline mode
                </span>
              ) : null}
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mb-4 lg:mb-6">
          <GlassCard variant="accent" padding="large" glow>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{overallProgress}%</div>
                <div className="text-sm text-white/80">Overall Progress</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-1">{completedLessons}</div>
                <div className="text-sm text-white/80">Lessons Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-1">{totalLessons}</div>
                <div className="text-sm text-white/80">Lessons Available</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-1">{achievementsCount}</div>
                <div className="text-sm text-white/80">Achievements Earned</div>
              </div>
            </div>
            <div className="mt-6">
              <ProgressBar
                progress={overallProgress}
                label="Learning Journey Progress"
                showLabel={true}
                showPercentage={true}
                height="h-3"
                color="from-blue-400 via-green-400 to-orange-400"
                animated={true}
              />
            </div>
          </GlassCard>
        </motion.div>

        {loading && !courses.length ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="large" />
          </div>
        ) : null}

        {error && (
          <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mb-6">
            <GlassCard variant="default" padding="large">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-red-300 mb-1">We ran into an issue loading your education content.</h3>
                  <p className="text-sm text-red-200/80">{typeof error === 'string' ? error : error.message || 'An error occurred'}</p>
                </div>
                <GlassButton variant="primary" onClick={refreshEducation} disabled={loading}>
                  Try Again
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Empty State for No Courses */}
        {!loading && !error && (!courses || courses.length === 0) && (
          <motion.div variants={fadeIn} initial="hidden" animate="visible" className="flex justify-center py-20">
            <GlassCard variant="default" padding="large" className="max-w-md text-center">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-bold text-white mb-3">Education Content Coming Soon</h2>
              <p className="text-white/70 mb-6">
                {offline 
                  ? "Education content is not available in offline mode. Please check your connection."
                  : "We're preparing exciting courses for you. Check back soon for investment education content."
                }
              </p>
              {offline && (
                <GlassButton variant="primary" onClick={refreshEducation} disabled={loading}>
                  Retry Connection
                </GlassButton>
              )}
            </GlassCard>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <motion.div variants={fadeIn} initial="hidden" animate="visible">
              <GlassCard variant="default" padding="large">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Search Content</h3>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search courses, modules, lessons..."
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Filter by Category</h3>
                      <div className="flex flex-wrap gap-3">
                        {categories.map((category) => (
                          <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                              selectedCategory === category
                                ? 'bg-blue-500/30 text-white border border-blue-400/30'
                                : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
                            }`}
                          >
                            <span>{category === 'all' ? '🧭' : '🏷️'}</span>
                            <span className="text-sm font-medium">{formatLabel(category)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-white/60">
                      Showing {filteredCourseCount} course{filteredCourseCount === 1 ? '' : 's'}
                      {searchQuery && ` matching "${searchQuery}"`}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            <motion.div variants={staggerChildren} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCourses.map((course) => {
                const courseProgress = computeCourseProgress(course.id);
                const isActive = selectedCourseId === course.id;

                return (
                  <motion.div key={course.id} variants={fadeIn}>
                    <GlassCard
                      variant="hero"
                      padding="large"
                      shadow="xl"
                      interactive
                      className={`h-full transition-all ${
                        isActive ? 'border-blue-400/40 shadow-blue-500/20' : 'border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="space-y-2">
                          <span className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded-full">
                            {formatLabel(course.category)}
                          </span>
                          <h3 className="text-xl font-semibold text-white">{course.title}</h3>
                          <p className="text-white/70 text-sm leading-relaxed">{course.description}</p>
                        </div>
                        {course.image_url && (
                          <div
                            className="hidden md:block w-20 h-20 rounded-xl bg-cover bg-center border border-white/10"
                            style={{ backgroundImage: `url(${course.image_url})` }}
                          />
                        )}
                      </div>

                        <div className="mb-4">
                          <ProgressBar
                            progress={courseProgress}
                            label="Course Progress"
                            showLabel={true}
                            showPercentage={true}
                            height="h-2"
                            color="from-blue-400 to-green-400"
                            animated={true}
                          />
                        </div>

                      <div className="flex gap-3">
                        <GlassButton
                          variant={isActive ? 'primary' : 'glass'}
                          size="default"
                          className="flex-1"
                          onClick={() => setSelectedCourseId(course.id)}
                        >
                          {isActive ? 'Viewing Course' : 'View Course'}
                        </GlassButton>
                        <GlassButton variant="glass" size="default">
                          📋 Syllabus
                        </GlassButton>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}

              {!filteredCourses.length && !loading && (
                <GlassCard variant="default" padding="large" className="col-span-full text-center">
                  <p className="text-white/70">No courses found in this category yet. Try selecting a different category.</p>
                </GlassCard>
              )}
            </motion.div>

            <motion.div variants={fadeIn} initial="hidden" animate="visible">
              <GlassCard variant="default" padding="large" shadow="large">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Course Curriculum</h2>
                    <p className="text-sm text-white/60">
                      {activeCourse ? `Modules for ${activeCourse.title}` : 'Select a course to view modules and lessons.'}
                    </p>
                  </div>
                  {activeCourse && (
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-200 text-xs rounded-full">
                      {formatLabel(activeCourse.category)}
                    </span>
                  )}
                </div>

                {loading && courses.length > 0 ? (
                  <div className="flex justify-center py-10">
                    <LoadingSpinner />
                  </div>
                ) : null}

                {!loading && (!activeCourse || !activeModules.length) ? (
                  <div className="text-white/60 text-sm">
                    {activeCourse
                      ? 'Modules for this course are coming soon. Check back later!'
                      : 'Choose a course to explore its modules and lessons.'}
                  </div>
                ) : null}

                <div className="space-y-6">
                  {activeModules.map((module) => {
                    const moduleLessons = lessons[module.id] || [];
                    const moduleProgress = computeModuleProgress(module.id);

                    return (
                      <GlassCard
                        key={module.id}
                        variant="floating"
                        padding="large"
                        interactive
                        className={`border ${
                          selectedModuleId === module.id ? 'border-green-400/30' : 'border-white/10'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-white">{module.title}</h3>
                            {module.summary && (
                              <p className="text-white/60 text-sm mt-1">{module.summary}</p>
                            )}
                          </div>
                          <div className="text-sm text-white/70 min-w-[100px]">
                            <ProgressBar
                              progress={moduleProgress}
                              showLabel={false}
                              showPercentage={true}
                              height="h-2"
                              color="from-green-400 to-emerald-500"
                              animated={true}
                              className="mt-2"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          {moduleLessons.map((lesson) => {
                            const status = progress[lesson.id] === 'completed' ? 'Completed' : 'Not started';
                            const statusColor = progress[lesson.id] === 'completed' ? 'text-green-300' : 'text-white/60';

                            return (
                              <div
                                key={lesson.id}
                                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                              >
                                <div>
                                  <h4 className="text-sm font-semibold text-white mb-1">{lesson.title}</h4>
                                  {lesson.summary && (
                                    <p className="text-xs text-white/60 leading-relaxed">{lesson.summary}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className={`text-xs ${statusColor}`}>
                                    {status === 'Completed' ? '✅ Completed' : '🕒 Not Started'}
                                  </span>
                                  <GlassButton
                                    as={Link}
                                    to={`/education/lessons/${lesson.id}`}
                                    variant="glass"
                                    size="small"
                                  >
                                    {status === 'Completed' ? 'Review' : 'Start'}
                                  </GlassButton>
                                </div>
                              </div>
                            );
                          })}

                          {!moduleLessons.length && (
                            <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-sm text-white/60">
                              Lessons for this module are coming soon.
                            </div>
                          )}
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              </GlassCard>
            </motion.div>
          </div>

          <div className="space-y-8">
            <motion.div variants={fadeIn} initial="hidden" animate="visible">
              <GlassCard variant="floating" padding="large" interactive>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">Achievements</h3>
                    <p className="text-xs text-white/50">
                      Earn badges by completing lessons, diagnostics, and simulations.
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-purple-500/30 text-purple-300 text-xs rounded-full">
                    {achievementsLoading ? 'Loading…' : achievementsCount}
                  </span>
                </div>

                {achievementsLoading ? (
                  <div className="flex justify-center py-6">
                    <LoadingSpinner size="small" />
                  </div>
                ) : achievementsError ? (
                  <div className="text-center py-6 text-red-300 text-sm">
                    {achievementsError.message || achievementsError}
                  </div>
                ) : achievementsList && achievementsList.length > 0 ? (
                  <div className="space-y-3">
                    {achievementsList.slice(0, 6).map((achievement) => (
                      <div
                        key={achievement.id}
                        className="p-3 rounded-lg border border-purple-400/30 bg-purple-500/10"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">🏅</span>
                            <div>
                              <h4 className="text-sm font-medium text-white capitalize">
                                {achievement.type.replace(/_/g, ' ')}
                              </h4>
                              <p className="text-xs text-white/60">
                                {achievement.details?.description || 'No description available.'}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-white/50">
                            {achievement.earned_at
                              ? new Date(achievement.earned_at).toLocaleDateString()
                              : 'Recently earned'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {achievementsList.length > 6 && (
                      <p className="text-xs text-white/50">
                        Showing 6 of {achievementsList.length} achievements.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🎯</div>
                    <p className="text-sm text-white/60">
                      Complete your first lesson or diagnostic to earn your first badge.
                    </p>
                  </div>
                )}
              </GlassCard>
            </motion.div>

            <motion.div variants={fadeIn} initial="hidden" animate="visible">
              <GlassCard variant="accent" padding="large" glow>
                <h3 className="text-xl font-semibold text-white mb-3">Learning Tips</h3>
                <ul className="space-y-3 text-sm text-white/70">
                  <li>• Set aside focused study blocks to finish a module each week.</li>
                  <li>• Revisit completed lessons periodically to reinforce knowledge.</li>
                  <li>• Apply what you learn by updating your simulated or live portfolio.</li>
                </ul>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EducationPage;
