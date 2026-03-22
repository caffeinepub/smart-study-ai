import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Note } from "../backend.d";
import {
  useCreateNote,
  useDeleteNote,
  useNotesBySubject,
  useSubjects,
  useUpdateNote,
} from "../hooks/useQueries";

type SubjectWithId = { id: bigint; name: string; color: string; icon: string };
type NoteWithId = Note & { id: bigint };

function relativeTime(nanos: bigint): string {
  const ms = Number(nanos / BigInt(1_000_000));
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

export function NotesPage() {
  const { data: subjects, isLoading: subjLoading } = useSubjects();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const subjectsWithIds: SubjectWithId[] = (subjects ?? []).map((s, i) => ({
    ...s,
    id: (s as unknown as SubjectWithId).id ?? BigInt(i),
  }));
  const selectedSubject =
    selectedIdx !== null ? subjectsWithIds[selectedIdx] : null;

  const { data: notes, isLoading: notesLoading } = useNotesBySubject(
    selectedSubject?.id ?? null,
  );
  const notesWithIds: NoteWithId[] = (notes ?? []).map((n, i) => ({
    ...n,
    id: (n as unknown as NoteWithId).id ?? BigInt(i),
  }));

  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const [showDialog, setShowDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteWithId | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [activeNote, setActiveNote] = useState<NoteWithId | null>(null);

  const openDialog = (note?: NoteWithId) => {
    if (note) {
      setEditingNote(note);
      setNoteTitle(note.title);
      setNoteContent(note.content);
    } else {
      setEditingNote(null);
      setNoteTitle("");
      setNoteContent("");
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!selectedSubject || !noteTitle.trim()) return;
    try {
      if (editingNote) {
        await updateNote.mutateAsync({
          id: editingNote.id,
          title: noteTitle.trim(),
          content: noteContent.trim(),
          subjectId: selectedSubject.id,
        });
        if (activeNote?.id === editingNote.id) {
          setActiveNote({
            ...editingNote,
            title: noteTitle.trim(),
            content: noteContent.trim(),
          });
        }
        toast.success("Note updated!");
      } else {
        await createNote.mutateAsync({
          title: noteTitle.trim(),
          content: noteContent.trim(),
          subjectId: selectedSubject.id,
        });
        toast.success("Note created!");
      }
      setShowDialog(false);
    } catch {
      toast.error("Failed to save note");
    }
  };

  const handleDelete = async (note: NoteWithId) => {
    if (!selectedSubject) return;
    try {
      await deleteNote.mutateAsync({
        id: note.id,
        subjectId: selectedSubject.id,
      });
      if (activeNote?.id === note.id) setActiveNote(null);
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex gap-6">
      {/* Subject sidebar */}
      <aside className="w-56 shrink-0">
        <div className="bg-card rounded-xl border border-border shadow-card p-4">
          <h2 className="font-semibold text-foreground text-sm mb-4">
            Subjects
          </h2>
          {subjLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-9" />
              ))}
            </div>
          ) : subjectsWithIds.length === 0 ? (
            <div
              data-ocid="notes.subjects.empty_state"
              className="text-xs text-muted-foreground text-center py-4"
            >
              No subjects
            </div>
          ) : (
            <div className="space-y-1">
              {subjectsWithIds.map((s, i) => (
                <button
                  type="button"
                  key={s.name}
                  data-ocid={`notes.subjects.item.${i + 1}`}
                  onClick={() => {
                    setSelectedIdx(i);
                    setActiveNote(null);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                    selectedIdx === i
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <span>{s.icon || "📚"}</span>
                  <span className="flex-1 truncate font-medium">{s.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Notes list */}
      <div className="w-64 shrink-0">
        {selectedSubject ? (
          <div className="bg-card rounded-xl border border-border shadow-card p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground text-sm">
                {selectedSubject.name}
              </h2>
              <Button
                data-ocid="notes.add_note.button"
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => openDialog()}
              >
                <Plus size={14} />
              </Button>
            </div>
            {notesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : notesWithIds.length === 0 ? (
              <div
                data-ocid="notes.list.empty_state"
                className="text-center py-8"
              >
                <FileText
                  size={24}
                  className="text-muted-foreground mx-auto mb-2"
                />
                <p className="text-xs text-muted-foreground">No notes yet</p>
                <Button
                  data-ocid="notes.empty.add.button"
                  size="sm"
                  variant="outline"
                  className="mt-3 text-xs"
                  onClick={() => openDialog()}
                >
                  <Plus size={12} className="mr-1" /> Add Note
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {notesWithIds.map((note, i) => (
                  <button
                    type="button"
                    key={`${note.title}-${note.timestamp}`}
                    data-ocid={`notes.list.item.${i + 1}`}
                    onClick={() => setActiveNote(note)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      activeNote?.id === note.id
                        ? "border-primary bg-accent"
                        : "border-border hover:border-muted-foreground bg-transparent"
                    }`}
                  >
                    <p className="font-medium text-sm text-foreground truncate">
                      {note.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {note.content || "No content"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {relativeTime(note.timestamp)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-card border border-dashed border-border rounded-xl p-6 text-center h-full flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Select a subject</p>
          </div>
        )}
      </div>

      {/* Note viewer */}
      <main className="flex-1 min-w-0">
        {activeNote ? (
          <div className="bg-card border border-border rounded-xl shadow-card p-6 h-full">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {activeNote.title}
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  {relativeTime(activeNote.timestamp)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  data-ocid="notes.edit.button"
                  variant="outline"
                  size="sm"
                  onClick={() => openDialog(activeNote)}
                >
                  <Pencil size={14} className="mr-1" /> Edit
                </Button>
                <Button
                  data-ocid="notes.delete.button"
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(activeNote)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {activeNote.content || "No content"}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-dashed border-border rounded-xl p-16 text-center h-full flex flex-col items-center justify-center">
            <FileText
              size={40}
              className="text-muted-foreground mx-auto mb-4"
            />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No note selected
            </h3>
            <p className="text-sm text-muted-foreground">
              Select a note from the list or create a new one
            </p>
          </div>
        )}
      </main>

      {/* Note dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent data-ocid="notes.dialog">
          <DialogHeader>
            <DialogTitle>{editingNote ? "Edit Note" : "New Note"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Title</Label>
              <Input
                data-ocid="notes.title.input"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Note title"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                data-ocid="notes.content.textarea"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write your notes here…"
                className="mt-1.5 resize-none"
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              data-ocid="notes.save.button"
              onClick={handleSave}
              disabled={
                !noteTitle.trim() ||
                createNote.isPending ||
                updateNote.isPending
              }
            >
              {createNote.isPending || updateNote.isPending ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : null}
              {editingNote ? "Save Changes" : "Create Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
