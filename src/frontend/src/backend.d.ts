import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserProfile {
    name: string;
}
export interface Activity {
    activityType: ActivityType;
    userId: Principal;
    description: string;
    timestamp: Time;
}
export type Time = bigint;
export interface Flashcard {
    userId: Principal;
    difficulty: bigint;
    term: string;
    subjectId: bigint;
    definition: string;
}
export interface Subject {
    userId: Principal;
    icon: string;
    name: string;
    color: string;
}
export interface UserStats {
    totalCardsReviewed: bigint;
    quizAverage: number;
    totalStudyTimeNanos: bigint;
    currentStreak: bigint;
}
export interface Note {
    title: string;
    content: string;
    userId: Principal;
    subjectId: bigint;
    timestamp: Time;
}
export enum ActivityType {
    QuizCompleted = "QuizCompleted",
    NoteCreated = "NoteCreated",
    SubjectCreated = "SubjectCreated",
    SessionEnded = "SessionEnded",
    FlashcardCreated = "FlashcardCreated",
    SessionStarted = "SessionStarted",
    FlashcardReviewed = "FlashcardReviewed"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_easy_hard_medium {
    easy = "easy",
    hard = "hard",
    medium = "medium"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createFlashcard(term: string, definition: string, difficulty: bigint, subjectId: bigint): Promise<bigint>;
    createNote(title: string, content: string, subjectId: bigint): Promise<bigint>;
    createSubject(name: string, color: string, icon: string): Promise<bigint>;
    deleteFlashcard(id: bigint): Promise<void>;
    deleteNote(id: bigint): Promise<void>;
    deleteSubject(id: bigint): Promise<void>;
    endSession(sessionId: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile>;
    getCallerUserRole(): Promise<UserRole>;
    getRecentActivity(): Promise<Array<Activity>>;
    getUserProfile(user: Principal): Promise<UserProfile>;
    getUserStats(): Promise<UserStats>;
    isCallerAdmin(): Promise<boolean>;
    listFlashcardsBySubject(subjectId: bigint): Promise<Array<Flashcard>>;
    listNotesBySubject(subjectId: bigint): Promise<Array<Note>>;
    listSubjects(): Promise<Array<Subject>>;
    recordQuiz(subjectId: bigint, score: bigint, totalQuestions: bigint): Promise<bigint>;
    reviewFlashcard(flashcardId: bigint, difficulty: Variant_easy_hard_medium): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    startSession(subjectId: bigint): Promise<bigint>;
    updateFlashcard(id: bigint, term: string, definition: string, difficulty: bigint): Promise<void>;
    updateNote(id: bigint, title: string, content: string): Promise<void>;
    updateSubject(id: bigint, name: string, color: string, icon: string): Promise<void>;
}
