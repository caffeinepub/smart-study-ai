import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import { Footer } from "./components/Footer";
import { LoginScreen } from "./components/LoginScreen";
import { Nav } from "./components/Nav";
import { SetNamePrompt } from "./components/SetNamePrompt";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useUserProfile } from "./hooks/useQueries";
import { DashboardPage } from "./pages/DashboardPage";
import { FlashcardsPage } from "./pages/FlashcardsPage";
import { NotesPage } from "./pages/NotesPage";
import { ProgressPage } from "./pages/ProgressPage";
import { QuizzesPage } from "./pages/QuizzesPage";

type Page = "dashboard" | "flashcards" | "quizzes" | "notes" | "progress";

function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const [activePage, setActivePage] = useState<Page>("dashboard");
  const { data: profile, isLoading: profileLoading } = useUserProfile();

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-3 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!identity) {
    return <LoginScreen />;
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-3 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (profile && !profile.name) {
    return <SetNamePrompt onSaved={() => {}} />;
  }

  const userName = profile?.name ?? "";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Nav
        activePage={activePage}
        onNavigate={setActivePage}
        userName={userName}
      />
      <main className="flex-1">
        {activePage === "dashboard" && (
          <DashboardPage
            userName={userName}
            onNavigate={(p) => setActivePage(p)}
          />
        )}
        {activePage === "flashcards" && <FlashcardsPage />}
        {activePage === "quizzes" && <QuizzesPage />}
        {activePage === "notes" && <NotesPage />}
        {activePage === "progress" && <ProgressPage />}
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <>
      <AppContent />
      <Toaster richColors position="top-right" />
    </>
  );
}
