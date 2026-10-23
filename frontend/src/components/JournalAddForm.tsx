import { useState } from "react";
import { useAuthStore } from "../stores/authStore";
import FileUpload from "./FileUpload";
import type { JournalEntry } from "../types/Game";

type Props = {
  gameId: string;
  onEntryAdded: (entry: JournalEntry) => void;
};

export default function JournalAddForm({ gameId, onEntryAdded }: Props) {
  const [newEntry, setNewEntry] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const token = useAuthStore((s) => s.token);

  async function handleAdd(e: React.SubmitEvent) {
    e.preventDefault();
    if (!newEntry.trim() && !imageFile) return;

    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("gameId", gameId);
      if (newEntry.trim()) formData.append("body", newEntry.trim());
      if (imageFile) formData.append("image", imageFile);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/journal`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add entry");
      }

      const created = await res.json();
      onEntryAdded(created);

      setNewEntry("");
      setImageFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add entry");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleAdd}
      className="rounded-xl border border-border bg-surface p-4 shadow-sm transition-colors focus-within:border-brand hover:border-brand"
    >
      <textarea
        value={newEntry}
        onChange={(e) => setNewEntry(e.target.value)}
        placeholder="What happened today?"
        rows={3}
        className="w-full resize-none bg-transparent text-sm text-ink placeholder:text-ink-dim focus:outline-none"
      />

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
        <FileUpload onChange={(file) => setImageFile(file)} file={imageFile} />
        <button
          type="submit"
          disabled={submitting || (!newEntry.trim() && !imageFile)}
          className="rounded bg-brand px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Saving…" : "Post"}
        </button>
      </div>
    </form>
  );
}
