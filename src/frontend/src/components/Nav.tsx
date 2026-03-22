import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  BookOpen,
  Brain,
  FileText,
  LayoutDashboard,
  LogIn,
  LogOut,
} from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

type Page = "dashboard" | "flashcards" | "quizzes" | "notes" | "progress";

interface NavProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  userName: string;
}

const navLinks: { page: Page; label: string; icon: React.ReactNode }[] = [
  {
    page: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard size={16} />,
  },
  { page: "flashcards", label: "Flashcards", icon: <BookOpen size={16} /> },
  { page: "quizzes", label: "Quizzes", icon: <Brain size={16} /> },
  { page: "notes", label: "Notes", icon: <FileText size={16} /> },
  { page: "progress", label: "Progress", icon: <BarChart3 size={16} /> },
];

export function Nav({ activePage, onNavigate, userName }: NavProps) {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const isLoggedIn = !!identity;
  const initials = userName
    ? userName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-xs">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Brain size={18} className="text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground text-lg tracking-tight">
            SmartStudy
          </span>
        </div>

        {/* Nav Links */}
        {isLoggedIn && (
          <nav className="flex items-center gap-1" aria-label="Main navigation">
            {navLinks.map(({ page, label, icon }) => (
              <button
                type="button"
                key={page}
                data-ocid={`nav.${page}.link`}
                onClick={() => onNavigate(page)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activePage === page
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          {isLoggedIn ? (
            <>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground hidden md:block">
                {userName || "User"}
              </span>
              <Button
                data-ocid="nav.logout.button"
                variant="ghost"
                size="sm"
                onClick={() => clear()}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut size={16} />
              </Button>
            </>
          ) : (
            <Button
              data-ocid="nav.login.button"
              size="sm"
              onClick={() => login()}
              disabled={loginStatus === "logging-in"}
            >
              <LogIn size={16} className="mr-1" />
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
