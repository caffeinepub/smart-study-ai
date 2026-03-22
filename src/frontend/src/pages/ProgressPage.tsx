import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Clock, Flame, Star, Target, Trophy } from "lucide-react";
import { ActivityType } from "../backend.d";
import type { Activity } from "../backend.d";
import {
  useFlashcardsBySubject,
  useRecentActivity,
  useSubjects,
  useUserStats,
} from "../hooks/useQueries";

type SubjectWithId = { id: bigint; name: string; color: string; icon: string };

function formatStudyTime(nanos: bigint): string {
  const minutes = Number(nanos / BigInt(60_000_000_000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function relativeTime(nanos: bigint): string {
  const ms = Number(nanos / BigInt(1_000_000));
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function SubjectMasteryBar({ subject }: { subject: SubjectWithId }) {
  const { data: cards } = useFlashcardsBySubject(subject.id);
  if (!cards || cards.length === 0) return null;
  const avgDifficulty =
    cards.reduce((sum, c) => sum + Number(c.difficulty), 0) / cards.length;
  const mastery = Math.min(
    100,
    Math.max(0, Math.round(((3 - avgDifficulty) / 2) * 100)),
  );
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 w-36 shrink-0">
        <span className="text-base">{subject.icon || "📚"}</span>
        <span className="text-sm font-medium text-foreground truncate">
          {subject.name}
        </span>
      </div>
      <Progress value={mastery} className="flex-1 h-2" />
      <span className="text-sm font-semibold text-foreground w-12 text-right">
        {mastery}%
      </span>
      <Badge variant="secondary" className="text-xs w-16 justify-center">
        {mastery >= 70 ? "Mastered" : mastery >= 40 ? "Learning" : "Novice"}
      </Badge>
    </div>
  );
}

export function ProgressPage() {
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const { data: activities, isLoading: activitiesLoading } =
    useRecentActivity();
  const { data: subjects } = useSubjects();

  const subjectsWithIds: SubjectWithId[] = (subjects ?? []).map((s, i) => ({
    ...s,
    id: (s as unknown as SubjectWithId).id ?? BigInt(i),
  }));

  const quizActivities = (activities ?? []).filter(
    (a: Activity) => a.activityType === ActivityType.QuizCompleted,
  );

  const statCards = [
    {
      icon: <Star size={20} className="text-chart-3" />,
      label: "Cards Reviewed",
      value: statsLoading
        ? null
        : Number(stats?.totalCardsReviewed ?? 0).toLocaleString(),
      bg: "bg-amber-50",
    },
    {
      icon: <Clock size={20} className="text-chart-2" />,
      label: "Study Time",
      value: statsLoading
        ? null
        : formatStudyTime(stats?.totalStudyTimeNanos ?? BigInt(0)),
      bg: "bg-teal-50",
    },
    {
      icon: <Flame size={20} className="text-chart-5" />,
      label: "Current Streak",
      value: statsLoading ? null : `${Number(stats?.currentStreak ?? 0)} days`,
      bg: "bg-orange-50",
    },
    {
      icon: <Trophy size={20} className="text-primary" />,
      label: "Quiz Average",
      value: statsLoading
        ? null
        : `${Math.round((stats?.quizAverage ?? 0) * 100)}%`,
      bg: "bg-blue-50",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Your Progress</h1>
        <p className="text-muted-foreground mt-1">
          Track your learning journey and achievements
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <Card
            key={s.label}
            data-ocid={`progress.stats.item.${i + 1}`}
            className="shadow-card border-border"
          >
            <CardContent className="pt-5 pb-5">
              <div
                className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}
              >
                {s.icon}
              </div>
              {statsLoading ? (
                <Skeleton className="h-7 w-16 mb-1" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
              )}
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subject mastery */}
      <Card className="shadow-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-primary" />
            <CardTitle className="text-base">Subject Mastery</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {subjectsWithIds.length === 0 ? (
            <div
              data-ocid="progress.mastery.empty_state"
              className="text-center py-6 text-muted-foreground text-sm"
            >
              Add subjects and flashcards to track mastery
            </div>
          ) : (
            <div className="space-y-4">
              {subjectsWithIds.map((s) => (
                <SubjectMasteryBar key={s.name} subject={s} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent quiz activity */}
      <Card className="shadow-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-primary" />
            <CardTitle className="text-base">Recent Quiz Activity</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {activitiesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : quizActivities.length === 0 ? (
            <div
              data-ocid="progress.quiz_activity.empty_state"
              className="text-center py-6 text-muted-foreground text-sm"
            >
              No quiz activity yet. Take a quiz to see results here!
            </div>
          ) : (
            <div className="space-y-3">
              {quizActivities.slice(0, 10).map((a, i) => (
                <div
                  key={`quiz-${a.timestamp}`}
                  data-ocid={`progress.quiz_activity.item.${i + 1}`}
                  className="flex items-center gap-4 p-3 bg-muted rounded-lg"
                >
                  <span className="text-xl">🏆</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {a.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {relativeTime(a.timestamp)}
                    </p>
                  </div>
                  <Badge className="text-xs">Quiz</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
