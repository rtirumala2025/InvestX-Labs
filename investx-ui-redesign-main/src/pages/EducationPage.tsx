import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Play,
  CheckCircle,
  Lock,
  Clock,
  Trophy,
  ChevronRight,
  Star,
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  locked: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  progress: number;
  lessonsCount: number;
  completedLessons: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  lessons: Lesson[];
}

const mockCourses: Course[] = [
  {
    id: "1",
    title: "Investment Fundamentals",
    description: "Learn the basics of investing, from stocks and bonds to understanding market dynamics.",
    progress: 60,
    lessonsCount: 10,
    completedLessons: 6,
    difficulty: "Beginner",
    lessons: [
      { id: "1-1", title: "What is Investing?", duration: "8 min", completed: true, locked: false },
      { id: "1-2", title: "Types of Investments", duration: "12 min", completed: true, locked: false },
      { id: "1-3", title: "Risk vs Reward", duration: "10 min", completed: true, locked: false },
      { id: "1-4", title: "Understanding Stocks", duration: "15 min", completed: true, locked: false },
      { id: "1-5", title: "Understanding Bonds", duration: "12 min", completed: true, locked: false },
      { id: "1-6", title: "Portfolio Basics", duration: "10 min", completed: true, locked: false },
      { id: "1-7", title: "Diversification", duration: "14 min", completed: false, locked: false },
      { id: "1-8", title: "Market Orders", duration: "11 min", completed: false, locked: false },
      { id: "1-9", title: "Reading Charts", duration: "18 min", completed: false, locked: true },
      { id: "1-10", title: "Your First Investment", duration: "15 min", completed: false, locked: true },
    ],
  },
  {
    id: "2",
    title: "Technical Analysis",
    description: "Master chart patterns, indicators, and trading strategies used by professionals.",
    progress: 20,
    lessonsCount: 12,
    completedLessons: 2,
    difficulty: "Intermediate",
    lessons: [
      { id: "2-1", title: "Introduction to Technical Analysis", duration: "10 min", completed: true, locked: false },
      { id: "2-2", title: "Candlestick Patterns", duration: "20 min", completed: true, locked: false },
      { id: "2-3", title: "Support and Resistance", duration: "15 min", completed: false, locked: false },
      { id: "2-4", title: "Moving Averages", duration: "18 min", completed: false, locked: true },
    ],
  },
  {
    id: "3",
    title: "Fundamental Analysis",
    description: "Evaluate companies using financial statements, ratios, and valuation methods.",
    progress: 0,
    lessonsCount: 8,
    completedLessons: 0,
    difficulty: "Advanced",
    lessons: [
      { id: "3-1", title: "Reading Financial Statements", duration: "25 min", completed: false, locked: false },
      { id: "3-2", title: "Key Financial Ratios", duration: "20 min", completed: false, locked: true },
    ],
  },
];

const difficultyColors = {
  Beginner: "bg-positive/10 text-positive border-positive/30",
  Intermediate: "bg-warning/10 text-warning border-warning/30",
  Advanced: "bg-negative/10 text-negative border-negative/30",
};

export default function EducationPage() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  if (selectedCourse) {
    return (
      <div className="min-h-screen">
        <TopBar
          title={selectedCourse.title}
          subtitle="Course Lessons"
        />
        
        <div className="p-6 space-y-6">
          <GlassButton
            variant="ghost"
            onClick={() => setSelectedCourse(null)}
            className="mb-4"
          >
            ← Back to Courses
          </GlassButton>

          {/* Progress */}
          <GlassCard variant="elevated">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {selectedCourse.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedCourse.completedLessons} of {selectedCourse.lessonsCount} lessons completed
                </p>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border",
                difficultyColors[selectedCourse.difficulty]
              )}>
                {selectedCourse.difficulty}
              </div>
            </div>
            <Progress value={selectedCourse.progress} className="h-2" />
          </GlassCard>

          {/* Lessons */}
          <div className="space-y-3">
            {selectedCourse.lessons.map((lesson, index) => (
              <GlassCard
                key={lesson.id}
                variant={lesson.locked ? "default" : "interactive"}
                className={cn(
                  "animate-slide-up",
                  lesson.locked && "opacity-60"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      lesson.completed
                        ? "bg-positive/20 text-positive"
                        : lesson.locked
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/20 text-primary"
                    )}
                  >
                    {lesson.completed ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : lesson.locked ? (
                      <Lock className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{lesson.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {lesson.duration}
                    </div>
                  </div>
                  {!lesson.locked && (
                    <GlassButton variant="ghost" size="icon">
                      <ChevronRight className="h-5 w-5" />
                    </GlassButton>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopBar
        title="Education"
        subtitle="Learn investing through structured courses and lessons"
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GlassCard variant="metric" size="sm" className="animate-slide-up stagger-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">8</p>
                <p className="text-xs text-muted-foreground">Lessons Completed</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard variant="metric" size="sm" className="animate-slide-up stagger-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20 text-warning">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">3.5h</p>
                <p className="text-xs text-muted-foreground">Time Invested</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard variant="metric" size="sm" className="animate-slide-up stagger-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-positive/20 text-positive">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">2</p>
                <p className="text-xs text-muted-foreground">Badges Earned</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Courses */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Your Courses</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {mockCourses.map((course, index) => (
              <GlassCard
                key={course.id}
                variant="interactive"
                className={cn("animate-slide-up")}
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => setSelectedCourse(course)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium border",
                    difficultyColors[course.difficulty]
                  )}>
                    {course.difficulty}
                  </div>
                  <div className="flex items-center gap-1 text-warning">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-medium">4.8</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-foreground mb-2">
                  {course.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {course.description}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {course.completedLessons}/{course.lessonsCount} lessons
                    </span>
                    <span className="font-medium text-foreground">
                      {course.progress}%
                    </span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                  <GlassButton variant="glow" size="sm">
                    {course.progress > 0 ? "Continue" : "Start"} Course
                  </GlassButton>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
