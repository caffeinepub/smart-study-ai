import { Button } from "@/components/ui/button";
import { BookOpen, Brain, TrendingUp, Zap } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function LoginScreen() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  const features = [
    {
      icon: <BookOpen size={22} className="text-primary" />,
      title: "Smart Flashcards",
      desc: "Create and review cards with spaced repetition",
    },
    {
      icon: <Brain size={22} className="text-chart-2" />,
      title: "AI Quizzes",
      desc: "Auto-generated multiple-choice from your notes",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="text-chart-3"
          aria-label="Notes icon"
          role="img"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      title: "Rich Notes",
      desc: "Organize notes by subject with timestamps",
    },
    {
      icon: <TrendingUp size={22} className="text-chart-4" />,
      title: "Track Progress",
      desc: "Visualize streaks, quiz scores, and study time",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-8 py-5 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Brain size={18} className="text-primary-foreground" />
        </div>
        <span className="font-bold text-foreground text-lg">SmartStudy</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-5xl w-full grid md:grid-cols-2 gap-16 items-center">
          {/* Left column */}
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-3 py-1.5 rounded-full text-sm font-medium mb-6">
              <Zap size={14} className="text-primary" />
              AI-Powered Learning
            </div>
            <h1 className="text-4xl font-extrabold text-foreground leading-tight mb-4">
              Study smarter,
              <br />
              <span className="text-primary">not harder.</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Flashcards, quizzes, notes, and progress tracking — all in one
              place. Built for students who mean business.
            </p>
            <Button
              data-ocid="login.primary_button"
              size="lg"
              onClick={() => login()}
              disabled={isLoggingIn}
              className="text-base px-8 py-6"
            >
              {isLoggingIn ? "Connecting…" : "Get Started — It's Free"}
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Sign in with Internet Identity. No password needed.
            </p>
          </div>

          {/* Right column — feature cards */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-card rounded-xl p-5 shadow-card border border-border"
              >
                <div className="mb-3">{f.icon}</div>
                <h3 className="font-semibold text-foreground text-sm mb-1">
                  {f.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
