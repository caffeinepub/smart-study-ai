import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain } from "lucide-react";
import { useState } from "react";
import { useSaveProfile } from "../hooks/useQueries";

interface SetNamePromptProps {
  onSaved: () => void;
}

export function SetNamePrompt({ onSaved }: SetNamePromptProps) {
  const [name, setName] = useState("");
  const saveProfile = useSaveProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await saveProfile.mutateAsync({ name: name.trim() });
    onSaved();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="bg-card rounded-2xl shadow-card border border-border p-10 w-full max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Brain size={28} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Welcome to SmartStudy!
        </h2>
        <p className="text-muted-foreground mb-8">
          Let's set up your profile. What should we call you?
        </p>
        <form onSubmit={handleSubmit} className="text-left space-y-4">
          <div>
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              data-ocid="setname.input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              className="mt-1.5"
              autoFocus
            />
          </div>
          <Button
            data-ocid="setname.submit_button"
            type="submit"
            className="w-full"
            disabled={!name.trim() || saveProfile.isPending}
          >
            {saveProfile.isPending ? "Saving…" : "Start Studying →"}
          </Button>
        </form>
      </div>
    </div>
  );
}
