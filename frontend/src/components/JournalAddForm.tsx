import { useState } from "react";
import { useJournalStore } from "../stores/journalStore";
import FileUpload from "./FileUpload";
import { Button } from "@/components/ui/button";

type Props = {
  gameId: string;
};

const MAX_IMAGES = 4;

export default function JournalAddForm({ gameId }: Props) {
  const [newEntry, setNewEntry] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");

  const addEntry = useJournalStore((s) => s.addEntry);

  function handleAddImages(newFiles: File[]) {
    setUploadError("");
    const combined = [...imageFiles, ...newFiles];
    const uniqueFiles = Array.from(
      new Map(combined.map((f) => [f.name, f])).values(),
    );

    if (uniqueFiles.length > MAX_IMAGES) {
      setUploadError(`You can only upload up to ${MAX_IMAGES} images.`);
      setImageFiles(uniqueFiles.slice(0, MAX_IMAGES));
    } else {
      setImageFiles(uniqueFiles);
    }
  }

  function handleRemoveImage(indexToRemove: number) {
    setUploadError("");
    setImageFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newEntry.trim() && imageFiles.length === 0) return;

    setSubmitting(true);
    setError("");

    const formData = new FormData();
    formData.append("gameId", gameId);
    if (newEntry.trim()) formData.append("body", newEntry.trim());
    imageFiles.forEach((file) => formData.append("images", file));

    try {
      const ok = await addEntry(gameId, formData);
      if (!ok) {
        setError("Failed to add entry. Please try again.");
      } else {
        setNewEntry("");
        setImageFiles([]);
        setUploadError("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const isAtLimit = imageFiles.length >= MAX_IMAGES;

  return (
    <form
      onSubmit={handleAdd}
      className="rounded border border-border bg-surface p-4 shadow-sm transition-colors focus-within:border-brand hover:border-brand"
    >
      <textarea
        value={newEntry}
        onChange={(e) => setNewEntry(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
        placeholder="What happened today?"
        rows={3}
        className="w-full resize-none bg-transparent text-sm text-ink placeholder:text-ink-dim focus:outline-none"
      />

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      <div className="mt-3 flex flex-col gap-3 border-t border-border/50 pt-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full min-w-0 flex-1">
          <FileUpload
            multiple
            disabled={isAtLimit}
            onAdd={handleAddImages}
            onRemove={handleRemoveImage}
            files={imageFiles}
          />

          {uploadError && (
            <p className="mt-2 text-xs text-destructive">{uploadError}</p>
          )}

          {isAtLimit && !uploadError && (
            <p className="mt-2 text-xs text-ink-muted">
              Maximum of {MAX_IMAGES} images reached.
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={!newEntry.trim() && imageFiles.length === 0}
          isLoading={submitting}
          className="shrink-0"
        >
          Post
        </Button>
      </div>
    </form>
  );
}
