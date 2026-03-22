import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Variant_easy_hard_medium } from "../backend.d";
import type { Flashcard } from "../backend.d";
import {
  useCreateFlashcard,
  useCreateSubject,
  useDeleteFlashcard,
  useDeleteSubject,
  useFlashcardsBySubject,
  useReviewFlashcard,
  useSubjects,
  useUpdateFlashcard,
} from "../hooks/useQueries";

type SubjectWithId = { id: bigint; name: string; color: string; icon: string };
type FlashcardWithId = Flashcard & { id: bigint };

const SUBJECT_ICONS = [
  "📚",
  "🔬",
  "🧮",
  "🌍",
  "🎨",
  "💻",
  "🎵",
  "🏛️",
  "⚗️",
  "🧬",
];
const SUBJECT_COLORS = [
  "#2F80ED",
  "#27AE60",
  "#E2B93B",
  "#EB5757",
  "#9B51E0",
  "#F2994A",
  "#56CCF2",
  "#6FCF97",
];

export function FlashcardsPage() {
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

  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();
  const createFlashcard = useCreateFlashcard();
  const updateFlashcard = useUpdateFlashcard();
  const deleteFlashcard = useDeleteFlashcard();
  const reviewFlashcard = useReviewFlashcard();

  // Subject dialog
  const [showSubjDialog, setShowSubjDialog] = useState(false);
  const [subjName, setSubjName] = useState("");
  const [subjIcon, setSubjIcon] = useState("📚");
  const [subjColor, setSubjColor] = useState("#2F80ED");

  // Flashcard dialog
  const [showCardDialog, setShowCardDialog] = useState(false);
  const [editingCard, setEditingCard] = useState<FlashcardWithId | null>(null);
  const [cardTerm, setCardTerm] = useState("");
  const [cardDef, setCardDef] = useState("");

  // Review mode
  const [reviewing, setReviewing] = useState(false);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const handleCreateSubject = async () => {
    if (!subjName.trim()) return;
    try {
      await createSubject.mutateAsync({
        name: subjName.trim(),
        color: subjColor,
        icon: subjIcon,
      });
      toast.success("Subject created!");
      setShowSubjDialog(false);
      setSubjName("");
    } catch {
      toast.error("Failed to create subject");
    }
  };

  const handleDeleteSubject = async (id: bigint) => {
    try {
      await deleteSubject.mutateAsync(id);
      setSelectedIdx(null);
      toast.success("Subject deleted");
    } catch {
      toast.error("Failed to delete subject");
    }
  };

  const openCardDialog = (card?: FlashcardWithId) => {
    if (card) {
      setEditingCard(card);
      setCardTerm(card.term);
      setCardDef(card.definition);
    } else {
      setEditingCard(null);
      setCardTerm("");
      setCardDef("");
    }
    setShowCardDialog(true);
  };

  const handleSaveCard = async () => {
    if (!selectedSubject || !cardTerm.trim() || !cardDef.trim()) return;
    try {
      if (editingCard) {
        await updateFlashcard.mutateAsync({
          id: editingCard.id,
          term: cardTerm.trim(),
          definition: cardDef.trim(),
          difficulty: editingCard.difficulty,
          subjectId: selectedSubject.id,
        });
        toast.success("Flashcard updated!");
      } else {
        await createFlashcard.mutateAsync({
          term: cardTerm.trim(),
          definition: cardDef.trim(),
          difficulty: BigInt(1),
          subjectId: selectedSubject.id,
        });
        toast.success("Flashcard created!");
      }
      setShowCardDialog(false);
    } catch {
      toast.error("Failed to save flashcard");
    }
  };

  const handleDeleteCard = async (card: FlashcardWithId) => {
    if (!selectedSubject) return;
    try {
      await deleteFlashcard.mutateAsync({
        id: card.id,
        subjectId: selectedSubject.id,
      });
      toast.success("Flashcard deleted");
    } catch {
      toast.error("Failed to delete flashcard");
    }
  };

  const handleReview = async (difficulty: Variant_easy_hard_medium) => {
    const card = flashcardsWithIds[reviewIdx];
    if (!card) return;
    await reviewFlashcard.mutateAsync({ flashcardId: card.id, difficulty });
    const next = reviewIdx + 1;
    if (next >= flashcardsWithIds.length) {
      toast.success("Review complete! Great job! 🎉");
      setReviewing(false);
      setReviewIdx(0);
    } else {
      setReviewIdx(next);
      setFlipped(false);
    }
  };

  // Review mode render
  if (reviewing && flashcardsWithIds.length > 0) {
    const card = flashcardsWithIds[reviewIdx];
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => {
              setReviewing(false);
              setReviewIdx(0);
              setFlipped(false);
            }}
          >
            <ChevronLeft size={16} className="mr-1" /> Exit Review
          </Button>
          <span className="text-sm text-muted-foreground">
            {reviewIdx + 1} / {flashcardsWithIds.length}
          </span>
        </div>
        <button
          type="button"
          className="flip-card w-full h-64 cursor-pointer text-left"
          onClick={() => setFlipped((p) => !p)}
        >
          <div
            className={`flip-card-inner w-full h-full ${flipped ? "flipped" : ""}`}
          >
            {/* Front */}
            <div className="flip-card-front w-full h-full bg-card rounded-2xl shadow-card border border-border flex flex-col items-center justify-center p-8">
              <Badge variant="secondary" className="mb-4 text-xs">
                Term
              </Badge>
              <p className="text-2xl font-semibold text-foreground text-center">
                {card.term}
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Click to reveal definition
              </p>
            </div>
            {/* Back */}
            <div className="flip-card-back w-full h-full bg-primary rounded-2xl shadow-card border border-primary flex flex-col items-center justify-center p-8">
              <Badge className="mb-4 text-xs bg-white/20 text-white border-white/30">
                Definition
              </Badge>
              <p className="text-xl font-medium text-primary-foreground text-center">
                {card.definition}
              </p>
            </div>
          </div>
        </button>
        {flipped && (
          <div className="flex gap-3 mt-6 justify-center">
            <Button
              data-ocid="flashcards.review.hard_button"
              variant="destructive"
              onClick={() => handleReview(Variant_easy_hard_medium.hard)}
            >
              Hard
            </Button>
            <Button
              data-ocid="flashcards.review.medium_button"
              variant="outline"
              onClick={() => handleReview(Variant_easy_hard_medium.medium)}
            >
              Medium
            </Button>
            <Button
              data-ocid="flashcards.review.easy_button"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleReview(Variant_easy_hard_medium.easy)}
            >
              Easy
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex gap-6">
      {/* Sidebar */}
      <aside className="w-64 shrink-0">
        <div className="bg-card rounded-xl border border-border shadow-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground text-sm">Subjects</h2>
            <Button
              data-ocid="flashcards.add_subject.button"
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => setShowSubjDialog(true)}
            >
              <Plus size={14} />
            </Button>
          </div>
          {subjLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-9" />
              ))}
            </div>
          ) : subjectsWithIds.length === 0 ? (
            <div
              data-ocid="flashcards.subjects.empty_state"
              className="text-xs text-muted-foreground text-center py-4"
            >
              No subjects yet
            </div>
          ) : (
            <div className="space-y-1">
              {subjectsWithIds.map((s, i) => (
                <button
                  type="button"
                  key={s.name}
                  data-ocid={`flashcards.subjects.item.${i + 1}`}
                  onClick={() => setSelectedIdx(i)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                    selectedIdx === i
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <span>{s.icon || "📚"}</span>
                  <span className="flex-1 truncate font-medium">{s.name}</span>
                  {selectedIdx === i && (
                    <button
                      type="button"
                      data-ocid={`flashcards.subjects.delete.${i + 1}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSubject(s.id);
                      }}
                      className="ml-auto opacity-70 hover:opacity-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </button>
              ))}
            </div>
          )}
          <Button
            data-ocid="flashcards.new_subject.button"
            variant="outline"
            size="sm"
            className="w-full mt-4 text-xs"
            onClick={() => setShowSubjDialog(true)}
          >
            <Plus size={12} className="mr-1" /> New Subject
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {selectedSubject ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${selectedSubject.color}25` }}
                >
                  {selectedSubject.icon}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    {selectedSubject.name}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {flashcardsWithIds.length} flashcard
                    {flashcardsWithIds.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {flashcardsWithIds.length > 0 && (
                  <Button
                    data-ocid="flashcards.review.button"
                    variant="outline"
                    onClick={() => {
                      setReviewing(true);
                      setReviewIdx(0);
                      setFlipped(false);
                    }}
                  >
                    <Play size={14} className="mr-1" /> Review
                  </Button>
                )}
                <Button
                  data-ocid="flashcards.add_card.button"
                  onClick={() => openCardDialog()}
                >
                  <Plus size={14} className="mr-1" /> Add Card
                </Button>
              </div>
            </div>

            {cardsLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : flashcardsWithIds.length === 0 ? (
              <div
                data-ocid="flashcards.cards.empty_state"
                className="bg-card border border-dashed border-border rounded-xl p-12 text-center"
              >
                <BookOpen
                  size={32}
                  className="text-muted-foreground mx-auto mb-3"
                />
                <p className="text-muted-foreground mb-4">
                  No flashcards yet. Add your first card!
                </p>
                <Button
                  data-ocid="flashcards.empty.add_card.button"
                  onClick={() => openCardDialog()}
                >
                  <Plus size={14} className="mr-1" /> Add Flashcard
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {flashcardsWithIds.map((card, i) => (
                  <div
                    key={card.term}
                    data-ocid={`flashcards.cards.item.${i + 1}`}
                    className="bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary" className="text-xs">
                        Term
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          data-ocid={`flashcards.cards.edit.${i + 1}`}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => openCardDialog(card)}
                        >
                          <Pencil size={12} />
                        </Button>
                        <Button
                          data-ocid={`flashcards.cards.delete.${i + 1}`}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteCard(card)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                    <p className="font-semibold text-foreground mb-2">
                      {card.term}
                    </p>
                    <div className="border-t border-border pt-2 mt-2">
                      <p className="text-xs text-muted-foreground mb-1">
                        Definition
                      </p>
                      <p className="text-sm text-foreground line-clamp-2">
                        {card.definition}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="bg-card border border-dashed border-border rounded-xl p-16 text-center h-full flex flex-col items-center justify-center">
            <BookOpen
              size={40}
              className="text-muted-foreground mx-auto mb-4"
            />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Select a Subject
            </h3>
            <p className="text-muted-foreground text-sm">
              Choose a subject from the sidebar to view and manage flashcards
            </p>
          </div>
        )}
      </main>

      {/* Subject dialog */}
      <Dialog open={showSubjDialog} onOpenChange={setShowSubjDialog}>
        <DialogContent data-ocid="flashcards.subject.dialog">
          <DialogHeader>
            <DialogTitle>Create New Subject</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Name</Label>
              <Input
                data-ocid="flashcards.subject.name.input"
                value={subjName}
                onChange={(e) => setSubjName(e.target.value)}
                placeholder="e.g. Biology"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {SUBJECT_ICONS.map((icon) => (
                  <button
                    type="button"
                    key={icon}
                    onClick={() => setSubjIcon(icon)}
                    className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border-2 transition-colors ${
                      subjIcon === icon
                        ? "border-primary bg-accent"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-1.5">
                {SUBJECT_COLORS.map((color) => (
                  <button
                    type="button"
                    key={color}
                    onClick={() => setSubjColor(color)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      subjColor === color
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubjDialog(false)}>
              Cancel
            </Button>
            <Button
              data-ocid="flashcards.subject.save.button"
              onClick={handleCreateSubject}
              disabled={!subjName.trim() || createSubject.isPending}
            >
              {createSubject.isPending ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : null}
              Create Subject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Flashcard dialog */}
      <Dialog open={showCardDialog} onOpenChange={setShowCardDialog}>
        <DialogContent data-ocid="flashcards.card.dialog">
          <DialogHeader>
            <DialogTitle>
              {editingCard ? "Edit Flashcard" : "Add Flashcard"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Term</Label>
              <Input
                data-ocid="flashcards.card.term.input"
                value={cardTerm}
                onChange={(e) => setCardTerm(e.target.value)}
                placeholder="Enter term or question"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Definition</Label>
              <Textarea
                data-ocid="flashcards.card.definition.textarea"
                value={cardDef}
                onChange={(e) => setCardDef(e.target.value)}
                placeholder="Enter definition or answer"
                className="mt-1.5 resize-none"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCardDialog(false)}>
              Cancel
            </Button>
            <Button
              data-ocid="flashcards.card.save.button"
              onClick={handleSaveCard}
              disabled={
                !cardTerm.trim() ||
                !cardDef.trim() ||
                createFlashcard.isPending ||
                updateFlashcard.isPending
              }
            >
              {createFlashcard.isPending || updateFlashcard.isPending ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : null}
              {editingCard ? "Save Changes" : "Add Flashcard"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
