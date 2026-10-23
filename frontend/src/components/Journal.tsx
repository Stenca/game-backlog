import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useAuthStore } from "../stores/authStore";
import type { JournalEntry } from "../types/Game";
import { formatRelative } from "@/utils/date";

type Props = {
  gameId: string;
  userGameId: string;
};

export default function Journal({ gameId, userGameId }: Props) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newEntry, setNewEntry] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const token = useAuthStore((s) => s.token);

  async function loadEntries() {
    try {
      const data = await apiFetch<JournalEntry[]>(
        `/api/journal/game/${userGameId}`,
      );
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load journal");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEntries();
  }, [userGameId]);

  async function handleAddEntry(e: React.SubmitEvent) {
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
      setEntries([created, ...entries]);
      setNewEntry("");
      setImageFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add entry");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(entryId: string) {
    try {
      await apiFetch(`/api/journal/${entryId}`, { method: "DELETE" });
      setEntries(entries.filter((e) => e._id !== entryId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entry");
    }
  }

  function formatEntryDate(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (loading)
    return <p className="text-sm text-ink-muted">Loading journal…</p>;

  return (
    <section className="mt-10 border-t border-border pt-8">
      <h2 className="text-xl font-semibold text-ink">Journal</h2>

      <form onSubmit={handleAddEntry} className="mt-4">
        <textarea
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          placeholder="What happened today? (Optional if you upload an image)"
          rows={3}
          className="w-full resize-none rounded border border-border bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-dim transition-colors focus:border-brand focus:outline-none"
        />

        <div className="mt-2 flex items-center gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="text-sm text-ink-muted file:mr-4 file:rounded file:border-0 file:bg-surface-2 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ink hover:file:bg-surface"
          />

          <button
            type="submit"
            disabled={submitting || (!newEntry.trim() && !imageFile)}
            className="ml-auto rounded bg-brand px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Saving…" : "Add entry"}
          </button>
        </div>
      </form>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {entries.length === 0 ? (
        <p className="mt-6 text-sm text-ink-muted">
          No entries yet. Write your first note above.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {entries.map((entry) => (
            <li
              key={entry._id}
              className="group overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-brand/50"
            >
              <div className="flex flex-col p-4">
                {/* Text Content */}
                {entry.body && (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
                    {entry.body}
                  </p>
                )}

                {/* Image Content */}
                {entry.imageUrl && (
                  <div
                    className={`relative overflow-hidden rounded-md border border-border/50 bg-surface-2 ${entry.body ? "mt-3" : ""}`}
                  >
                    <img
                      src={entry.imageUrl}
                      alt="Journal attachment"
                      className="max-h-[500px] w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Footer: Date and Delete Button */}
                <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
                  <p className="text-[11px] font-medium text-ink-dim uppercase tracking-wider">
                    {formatEntryDate(entry.createdAt)}
                    <span className="ml-2 opacity-60 normal-case">
                      ({formatRelative(entry.createdAt)})
                    </span>
                  </p>

                  <button
                    onClick={() => handleDelete(entry._id)}
                    className="cursor-pointer text-xs text-ink-dim opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
