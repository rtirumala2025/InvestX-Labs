import { Progress } from "@/components/ui/progress";
import { BookOpen, Play, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface LearningProgressProps {
  progress?: {
    completedLessons: number;
    totalLessons: number;
    currentCourse?: string;
    currentLesson?: string;
    percentComplete: number;
  };
}

const defaultProgress = {
  completedLessons: 12,
  totalLessons: 48,
  currentCourse: "Investment Fundamentals",
  currentLesson: "Understanding P/E Ratios",
  percentComplete: 25,
};

export function LearningProgress({ progress = defaultProgress }: LearningProgressProps) {
  return (
    <div className="premium-card overflow-hidden opacity-0 animate-in" style={{ animationDelay: '300ms' }}>
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10 text-info">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Your Learning</h3>
              <p className="text-xs text-muted-foreground">
                {progress.completedLessons} of {progress.totalLessons} lessons
              </p>
            </div>
          </div>
          <span className="text-2xl font-bold text-foreground tabular-nums">
            {progress.percentComplete}%
          </span>
        </div>
        <Progress value={progress.percentComplete} className="h-2" />
      </div>

      {/* Current lesson */}
      {progress.currentLesson && (
        <Link to="/education" className="block group">
          <div className="p-5 transition-colors hover:bg-muted/30">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Continue where you left off
            </p>
            <p className="text-xs text-muted-foreground mb-1">
              {progress.currentCourse}
            </p>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {progress.currentLesson}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-110">
                  <Play className="h-4 w-4 ml-0.5" />
                </div>
              </div>
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}
