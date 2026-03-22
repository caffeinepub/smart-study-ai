import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  ChevronRight,
  Clock,
  Flame,
  Pause,
  Play,
  Plus,
  Square,
  Star,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Activity } from "../backend.d";
import { ActivityType } from "../backend.d";
import {
  useEndSession,
  useRecentActivity,
  useStartSession,
  useSubjects,
  useUserStats,
} from "../hooks/useQueries";

type SubjectWithId = { id: bigint; name: string; color: string; icon: string };

function formatStudyTime(nanos: bigint): string {
  const minutes = Number(nanos / BigInt(60_000_000_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
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

function activityIcon(type: ActivityType): string {
  const map: Record<ActivityType, string> = {
    [ActivityType.FlashcardCreated]: "🃏",
    [ActivityType.FlashcardReviewed]: "✅",
    [ActivityType.NoteCreated]: "📝",
    [ActivityType.QuizCompleted]: "🏆",
    [ActivityType.SessionStarted]: "▶️",
    [ActivityType.SessionEnded]: "⏹️",
    [ActivityType.SubjectCreated]: "📚",
  };
  return map[type] ?? "📌";
}

function WeeklyChart({ activities }: { activities: Activity[] }) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const counts = Array(7).fill(0);
  for (const a of activities) {
    const ms = Number(a.timestamp / BigInt(1_000_000));
    const d = new Date(ms);
    const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
    if (diff >= 0 && diff < 7) counts[6 - diff]++;
  }
  const max = Math.max(...counts, 1);
  const labels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return days[d.getDay()];
  });

  return (
    <div className="flex items-end gap-2 h-24 mt-2">
      {counts.map((c, i) => (
        <div
          key={labels[i]}
          className="flex-1 flex flex-col items-center gap-1"
        >
          <div
            className="w-full rounded-t-sm bg-primary/80 transition-all"
            style={{ height: `${(c / max) * 72}px`, minHeight: c > 0 ? 4 : 0 }}
          />
          <span className="text-[10px] text-muted-foreground">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

interface DashboardProps {
  userName: string;
  onNavigate: (page: "flashcards" | "quizzes" | "notes" | "progress") => void;
}

export function DashboardPage({ userName, onNavigate }: DashboardProps) {
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const { data: activities, isLoading: activitiesLoading } =
    useRecentActivity();
  const startSession = useStartSession();
  const endSession = useEndSession();

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState<bigint | null>(null);
  const [selectedSubjectIdx, setSelectedSubjectIdx] = useState("0");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const subjectsWithIds: SubjectWithId[] = (subjects ?? []).map((s, i) => ({
    ...s,
    id: (s as unknown as SubjectWithId).id ?? BigInt(i),
  }));

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(
        () => setTimerSeconds((p) => p + 1),
        1000,
      );
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const handleStart = async () => {
    const subj = subjectsWithIds[Number.parseInt(selectedSubjectIdx)];
    if (!subj) {
      toast.error("Please select a subject first");
      return;
    }
    try {
      const id = await startSession.mutateAsync(subj.id);
      setSessionId(id);
      setIsRunning(true);
      toast.success("Session started!");
    } catch {
      toast.error("Failed to start session");
    }
  };

  const handleEnd = async () => {
    if (!sessionId) return;
    setIsRunning(false);
    try {
      await endSession.mutateAsync(sessionId);
      toast.success(`Session ended — ${formatSeconds(timerSeconds)} studied!`);
    } catch {
      toast.error("Failed to end session");
    }
    setSessionId(null);
    setTimerSeconds(0);
  };

  const subjectColors = [
    "#2F80ED",
    "#27AE60",
    "#E2B93B",
    "#EB5757",
    "#9B51E0",
    "#F2994A",
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Greeting */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {userName || "Student"}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Ready to continue your learning journey?
        </p>
      </div>

      {/* Hero cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Today's Focus */}
        <Card
          className="shadow-card border-border"
          data-ocid="dashboard.focus.card"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Today's Focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subjectsLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : subjectsWithIds.length > 0 ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ backgroundColor: `${subjectsWithIds[0].color}20` }}
                  >
                    {subjectsWithIds[0].icon || "📚"}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {subjectsWithIds[0].name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Primary subject
                    </p>
                  </div>
                </div>
                <Button
                  data-ocid="dashboard.study.button"
                  size="sm"
                  className="w-full"
                  onClick={() => onNavigate("flashcards")}
                >
                  Study Now <ChevronRight size={14} className="ml-1" />
                </Button>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Add a subject to get started
                </p>
                <Button
                  data-ocid="dashboard.add_subject.button"
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate("flashcards")}
                >
                  <Plus size={14} className="mr-1" /> Add Subject
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card
          className="shadow-card border-border"
          data-ocid="dashboard.stats.card"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-lg p-3">
                  <BookOpen size={16} className="text-primary mb-1" />
                  <p className="text-xl font-bold text-foreground">
                    {subjectsWithIds.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Subjects</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <Star size={16} className="text-chart-3 mb-1" />
                  <p className="text-xl font-bold text-foreground">
                    {stats ? Number(stats.totalCardsReviewed) : 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cards Reviewed
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <Clock size={16} className="text-chart-2 mb-1" />
                  <p className="text-xl font-bold text-foreground">
                    {stats ? formatStudyTime(stats.totalStudyTimeNanos) : "0m"}
                  </p>
                  <p className="text-xs text-muted-foreground">Study Time</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <Flame size={16} className="text-chart-5 mb-1" />
                  <p className="text-xl font-bold text-foreground">
                    {stats ? Number(stats.currentStreak) : 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Study Session */}
        <Card
          className="shadow-card border-border"
          data-ocid="dashboard.session.card"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Study Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-4xl font-mono font-bold text-foreground tabular-nums">
                {formatSeconds(timerSeconds)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isRunning ? "Session in progress" : "Ready to start"}
              </p>
            </div>
            {!isRunning && (
              <Select
                value={selectedSubjectIdx}
                onValueChange={setSelectedSubjectIdx}
              >
                <SelectTrigger
                  className="text-sm"
                  data-ocid="dashboard.session.select"
                >
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjectsWithIds.length === 0 ? (
                    <SelectItem value="-1" disabled>
                      No subjects yet
                    </SelectItem>
                  ) : (
                    subjectsWithIds.map((s, i) => (
                      <SelectItem key={s.name} value={String(i)}>
                        {s.icon} {s.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
            <div className="flex gap-2">
              {!isRunning ? (
                <Button
                  data-ocid="dashboard.session.start_button"
                  className="flex-1"
                  size="sm"
                  onClick={handleStart}
                  disabled={startSession.isPending}
                >
                  <Play size={14} className="mr-1" /> Start
                </Button>
              ) : (
                <>
                  <Button
                    data-ocid="dashboard.session.pause_button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRunning((p) => !p)}
                    className="flex-1"
                  >
                    <Pause size={14} className="mr-1" /> Pause
                  </Button>
                  <Button
                    data-ocid="dashboard.session.end_button"
                    variant="destructive"
                    size="sm"
                    onClick={handleEnd}
                    disabled={endSession.isPending}
                    className="flex-1"
                  >
                    <Square size={14} className="mr-1" /> End
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subjects grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Your Subjects
          </h2>
          <Button
            data-ocid="dashboard.add_subject_nav.button"
            variant="outline"
            size="sm"
            onClick={() => onNavigate("flashcards")}
          >
            <Plus size={14} className="mr-1" /> Add Subject
          </Button>
        </div>
        {subjectsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : subjectsWithIds.length === 0 ? (
          <div
            data-ocid="dashboard.subjects.empty_state"
            className="bg-card border border-dashed border-border rounded-xl p-10 text-center"
          >
            <p className="text-muted-foreground mb-3">
              No subjects yet. Create your first subject to start studying!
            </p>
            <Button
              data-ocid="dashboard.subjects.empty.button"
              onClick={() => onNavigate("flashcards")}
            >
              <Plus size={14} className="mr-1" /> Create Subject
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectsWithIds.map((s, i) => (
              <div
                key={s.name}
                data-ocid={`dashboard.subjects.item.${i + 1}`}
                className="bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{
                      backgroundColor: `${s.color || subjectColors[i % subjectColors.length]}25`,
                    }}
                  >
                    {s.icon || "📚"}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{s.name}</p>
                    <div
                      className="w-2 h-2 rounded-full inline-block mr-1"
                      style={{
                        backgroundColor:
                          s.color || subjectColors[i % subjectColors.length],
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      Active
                    </span>
                  </div>
                </div>
                <Progress
                  value={Math.random() * 60 + 20}
                  className="h-1.5 mb-3"
                />
                <Button
                  data-ocid={`dashboard.subjects.study.${i + 1}`}
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => onNavigate("flashcards")}
                >
                  Study
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bottom row: Activity + Weekly Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Activity */}
        <Card className="shadow-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : (activities ?? []).length === 0 ? (
              <div
                data-ocid="dashboard.activity.empty_state"
                className="text-center py-6 text-muted-foreground text-sm"
              >
                No activity yet. Start studying to see your history!
              </div>
            ) : (
              <div className="space-y-3">
                {(activities ?? []).slice(0, 8).map((a, i) => (
                  <div
                    key={`activity-${a.timestamp}`}
                    data-ocid={`dashboard.activity.item.${i + 1}`}
                    className="flex items-start gap-3"
                  >
                    <span className="text-base mt-0.5">
                      {activityIcon(a.activityType)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">
                        {a.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {relativeTime(a.timestamp)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {a.activityType}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Progress */}
        <Card className="shadow-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Weekly Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <Skeleton className="h-28 w-full" />
            ) : (
              <WeeklyChart activities={activities ?? []} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
