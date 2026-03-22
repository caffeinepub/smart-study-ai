import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, ChevronRight, RotateCcw, Trophy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Flashcard } from "../backend.d";
import {
  useFlashcardsBySubject,
  useRecordQuiz,
  useSubjects,
} from "../hooks/useQueries";

type SubjectWithId = { id: bigint; name: string; color: string; icon: string };
type FlashcardWithId = Flashcard & { id: bigint };

interface Question {
  term: string;
  correct: string;
  choices: string[];
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildQuestions(cards: FlashcardWithId[]): Question[] {
  if (cards.length < 2) return [];
  return cards.map((card) => {
    const others = cards.filter((c) => c.id !== card.id);
    const distractors = shuffle(others)
      .slice(0, 3)
      .map((c) => c.definition);
    const choices = shuffle([card.definition, ...distractors]);
    return { term: card.term, correct: card.definition, choices };
  });
}

export function QuizzesPage() {
  const { data: subjects, isLoading: subjLoading } = useSubjects();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const subjectsWithIds: SubjectWithId[] = (subjects ?? []).map((s, i) => ({
    ...s,
    id: (s as unknown as SubjectWithId).id ?? BigInt(i),
  }));
  const selectedSubject =
    selectedIdx !== null ? subjectsWithIds[selectedIdx] : null;

  const { data: flashcards, isLoading: cardsLoading } = useFlashcardsBySubject(
    selectedSubject?.id ?? null,
  );
  const flashcardsWithIds: FlashcardWithId[] = (flashcards ?? []).map(
    (f, i) => ({
      ...f,
      id: (f as unknown as FlashcardWithId).id ?? BigInt(i),
    }),
  );

  const recordQuiz = useRecordQuiz();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizActive, setQuizActive] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  const startQuiz = () => {
    const qs = shuffle(buildQuestions(flashcardsWithIds));
    if (qs.length === 0) {
      toast.error("Need at least 2 flashcards to start a quiz!");
      return;
    }
    setQuestions(qs);
    setCurrentQ(0);
    setScore(0);
    setSelected(null);
    setAnswered(false);
    setQuizDone(false);
    setQuizActive(true);
  };

  const handleSelect = (choice: string) => {
    if (answered) return;
    setSelected(choice);
    setAnswered(true);
    if (choice === questions[currentQ].correct) {
      setScore((p) => p + 1);
    }
  };

  const handleNext = async () => {
    if (currentQ + 1 >= questions.length) {
      const total = questions.length;
      setQuizDone(true);
      setQuizActive(false);
      if (selectedSubject) {
        try {
          await recordQuiz.mutateAsync({
            subjectId: selectedSubject.id,
            score: BigInt(score),
            totalQuestions: BigInt(total),
          });
        } catch {
          // Silent
        }
      }
    } else {
      setCurrentQ((p) => p + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const resetQuiz = () => {
    setQuizActive(false);
    setQuizDone(false);
    setSelected(null);
    setAnswered(false);
    setCurrentQ(0);
    setScore(0);
  };

  // Quiz active
  if (quizActive && questions.length > 0) {
    const q = questions[currentQ];
    const progress = (currentQ / questions.length) * 100;
    return (
      <div
        className="max-w-2xl mx-auto px-6 py-12"
        data-ocid="quizzes.quiz.panel"
      >
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={resetQuiz}>
            <RotateCcw size={14} className="mr-1" /> Restart
          </Button>
          <span className="text-sm text-muted-foreground font-medium">
            Question {currentQ + 1} of {questions.length}
          </span>
          <Badge variant="secondary">{score} pts</Badge>
        </div>
        <Progress value={progress} className="mb-6 h-2" />
        <Card className="shadow-card border-border mb-6">
          <CardContent className="pt-8 pb-8 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              What is the definition of…
            </p>
            <p className="text-2xl font-bold text-foreground">{q.term}</p>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 gap-3">
          {q.choices.map((choice, i) => {
            let extra = "";
            if (answered) {
              if (choice === q.correct) {
                extra = "border-green-500 bg-green-50 text-green-800";
              } else if (choice === selected) {
                extra = "border-destructive bg-red-50 text-red-700";
              }
            }
            return (
              <button
                type="button"
                key={choice}
                data-ocid={`quizzes.choice.item.${i + 1}`}
                onClick={() => handleSelect(choice)}
                disabled={answered}
                className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium text-sm transition-all ${
                  answered
                    ? "cursor-default"
                    : "hover:border-primary hover:bg-accent cursor-pointer"
                } ${extra || "border-border bg-card text-foreground"}`}
              >
                <span className="font-bold mr-3 text-muted-foreground">
                  {String.fromCharCode(65 + i)}.
                </span>
                {choice}
              </button>
            );
          })}
        </div>
        {answered && (
          <div className="mt-6 flex justify-end">
            <Button data-ocid="quizzes.next.button" onClick={handleNext}>
              {currentQ + 1 >= questions.length
                ? "Finish Quiz"
                : "Next Question"}
              <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Quiz done
  if (quizDone) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div
        className="max-w-md mx-auto px-6 py-16 text-center"
        data-ocid="quizzes.result.panel"
      >
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Trophy size={36} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Quiz Complete!
        </h2>
        <p className="text-muted-foreground mb-6">
          You scored{" "}
          <span className="font-semibold text-foreground">{score}</span> out of{" "}
          <span className="font-semibold text-foreground">
            {questions.length}
          </span>
        </p>
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <p className="text-5xl font-extrabold text-primary mb-1">{pct}%</p>
          <p className="text-sm text-muted-foreground">
            {pct >= 80
              ? "Excellent work! 🎉"
              : pct >= 60
                ? "Good job! Keep studying 📚"
                : "Keep practicing! You'll get it 💪"}
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button
            data-ocid="quizzes.retry.button"
            variant="outline"
            onClick={resetQuiz}
          >
            <RotateCcw size={14} className="mr-1" /> Try Again
          </Button>
          <Button data-ocid="quizzes.new_quiz.button" onClick={startQuiz}>
            New Quiz <ChevronRight size={14} className="ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // Subject selection
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Quizzes</h1>
        <p className="text-muted-foreground mt-1">
          Test your knowledge with auto-generated multiple choice quizzes
        </p>
      </div>

      {subjLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : subjectsWithIds.length === 0 ? (
        <div
          data-ocid="quizzes.empty_state"
          className="bg-card border border-dashed border-border rounded-xl p-16 text-center"
        >
          <Brain size={40} className="text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No subjects yet. Add flashcards first to take a quiz!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjectsWithIds.map((s, i) => (
            <Card
              key={s.name}
              data-ocid={`quizzes.subjects.item.${i + 1}`}
              className={`shadow-card border-border cursor-pointer hover:shadow-card-hover transition-all ${
                selectedIdx === i ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedIdx(i)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${s.color}25` }}
                  >
                    {s.icon || "📚"}
                  </div>
                  <CardTitle className="text-base">{s.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {selectedIdx === i ? (
                  cardsLoading ? (
                    <Skeleton className="h-9" />
                  ) : (
                    <Button
                      data-ocid="quizzes.start.button"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        startQuiz();
                      }}
                      disabled={flashcardsWithIds.length < 2}
                    >
                      <Brain size={14} className="mr-1" />
                      {flashcardsWithIds.length < 2
                        ? `Need ${2 - flashcardsWithIds.length} more card${2 - flashcardsWithIds.length !== 1 ? "s" : ""}`
                        : `Start Quiz (${flashcardsWithIds.length} cards)`}
                    </Button>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Click to select and start quiz
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
