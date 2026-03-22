import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserProfile, Variant_easy_hard_medium } from "../backend.d";
import { useActor } from "./useActor";

export function useSubjects() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listSubjects();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useFlashcardsBySubject(subjectId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["flashcards", subjectId?.toString()],
    queryFn: async () => {
      if (!actor || subjectId === null) return [];
      return actor.listFlashcardsBySubject(subjectId);
    },
    enabled: !!actor && !isFetching && subjectId !== null,
  });
}

export function useNotesBySubject(subjectId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["notes", subjectId?.toString()],
    queryFn: async () => {
      if (!actor || subjectId === null) return [];
      return actor.listNotesBySubject(subjectId);
    },
    enabled: !!actor && !isFetching && subjectId !== null,
  });
}

export function useUserStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userStats"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUserStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRecentActivity() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["recentActivity"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRecentActivity();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateSubject() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { name: string; color: string; icon: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createSubject(vars.name, vars.color, vars.icon);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
}

export function useUpdateSubject() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      id: bigint;
      name: string;
      color: string;
      icon: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateSubject(vars.id, vars.name, vars.color, vars.icon);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
}

export function useDeleteSubject() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteSubject(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
}

export function useCreateFlashcard() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      term: string;
      definition: string;
      difficulty: bigint;
      subjectId: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createFlashcard(
        vars.term,
        vars.definition,
        vars.difficulty,
        vars.subjectId,
      );
    },
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({
        queryKey: ["flashcards", vars.subjectId.toString()],
      }),
  });
}

export function useUpdateFlashcard() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      id: bigint;
      term: string;
      definition: string;
      difficulty: bigint;
      subjectId: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateFlashcard(
        vars.id,
        vars.term,
        vars.definition,
        vars.difficulty,
      );
    },
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({
        queryKey: ["flashcards", vars.subjectId.toString()],
      }),
  });
}

export function useDeleteFlashcard() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: bigint; subjectId: bigint }) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteFlashcard(vars.id);
    },
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({
        queryKey: ["flashcards", vars.subjectId.toString()],
      }),
  });
}

export function useReviewFlashcard() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      flashcardId: bigint;
      difficulty: Variant_easy_hard_medium;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.reviewFlashcard(vars.flashcardId, vars.difficulty);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flashcards"] });
      qc.invalidateQueries({ queryKey: ["userStats"] });
    },
  });
}

export function useCreateNote() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      title: string;
      content: string;
      subjectId: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createNote(vars.title, vars.content, vars.subjectId);
    },
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["notes", vars.subjectId.toString()] }),
  });
}

export function useUpdateNote() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      id: bigint;
      title: string;
      content: string;
      subjectId: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateNote(vars.id, vars.title, vars.content);
    },
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["notes", vars.subjectId.toString()] }),
  });
}

export function useDeleteNote() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: bigint; subjectId: bigint }) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteNote(vars.id);
    },
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["notes", vars.subjectId.toString()] }),
  });
}

export function useStartSession() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (subjectId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.startSession(subjectId);
    },
  });
}

export function useEndSession() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.endSession(sessionId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userStats"] });
      qc.invalidateQueries({ queryKey: ["recentActivity"] });
    },
  });
}

export function useRecordQuiz() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      subjectId: bigint;
      score: bigint;
      totalQuestions: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.recordQuiz(vars.subjectId, vars.score, vars.totalQuestions);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userStats"] });
      qc.invalidateQueries({ queryKey: ["recentActivity"] });
    },
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["userProfile"] }),
  });
}
