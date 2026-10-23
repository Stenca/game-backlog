import { useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { useJournalStore } from "../stores/journalStore";
import FileUpload from "./FileUpload";

type Props = {
  gameId: string;
};

export default function JournalAddForm({ gameId }: Props) {
  const [newEntry, setNewEntry] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const token = useAuthStore((s) => s.token);
  const addEntry = useJournalStore((s) => s.addEntry);
  const setEditingId = useJournalStore((s) => s.setEditingId);

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
      addEntry(created);
      setEditingId(null);

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

      <div className="mt-3 flex flex-col gap-3 border-t border-border/50 pt-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full min-w-0 flex-1">
          <FileUpload
            onChange={(file) => setImageFile(file)}
            file={imageFile}
          />
        </div>

        <button
          type="submit"
          disabled={submitting || (!newEntry.trim() && !imageFile)}
          className="shrink-0 rounded bg-brand px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Saving…" : "Post"}
        </button>
      </div>
    </form>
  );
}
