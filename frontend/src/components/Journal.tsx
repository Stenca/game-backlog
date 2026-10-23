import { useState } from "react";
import { apiFetch } from "../api";
import { useAuthStore } from "../stores/authStore";
import type { JournalEntry } from "../types/Game";
import { formatEntryDate, formatRelative } from "@/utils/date";
import FileUpload from "./FileUpload";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

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

  useState(() => {
    loadEntries();
  });

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
      setEditingId(null);
      setNewEntry("");
      setImageFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add entry");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(entry: JournalEntry) {
    setEditingId(entry._id);
    setEditBody(entry.body || "");
    setEditImage(null);
    setRemoveImage(false);
  }

  async function handleUpdateEntry(e: React.SubmitEvent) {
    e.preventDefault();
    if (!editingId) return;

    const entry = entries.find((en) => en._id === editingId);
    if (!entry) return;

    const hasBody = !!editBody.trim();
    const hasNewImage = !!editImage;
    const hasExistingImage = !!entry.imageUrl && !removeImage;

    const willBeEmpty = !hasBody && !hasNewImage && !hasExistingImage;

    if (willBeEmpty) {
      setIsConfirmDeleteOpen(true);
      return;
    }

    await saveEntry();
  }

  async function saveEntry() {
    if (!editingId) return;

    try {
      const formData = new FormData();
      formData.append("body", editBody);
      if (removeImage) formData.append("removeImage", "true");
      if (editImage) formData.append("image", editImage);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/journal/${editingId}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      if (!res.ok) throw new Error("Failed to update entry");

      const updated = await res.json();
      setEntries(entries.map((en) => (en._id === editingId ? updated : en)));
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function handleConfirmDelete() {
    if (entryToDelete) {
      try {
        await apiFetch(`/api/journal/${entryToDelete}`, { method: "DELETE" });
        setEntries(entries.filter((e) => e._id !== entryToDelete));
        setEntryToDelete(null);
        setIsConfirmDeleteOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete entry");
      }
      return;
    }

    if (editingId) {
      try {
        await apiFetch(`/api/journal/${editingId}`, { method: "DELETE" });
        setEntries(entries.filter((e) => e._id !== editingId));
        setEditingId(null);
        setIsConfirmDeleteOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete entry");
      }
    }
  }

  if (loading)
    return <p className="text-sm text-ink-muted">Loading journal…</p>;

  return (
    <section className="mt-10 border-t border-border pt-8">
      <h2 className="mb-4 text-xl font-semibold text-ink">Journal</h2>

      <form
        onSubmit={handleAddEntry}
        className="rounded-xl border border-border bg-surface p-4 shadow-sm transition-colors focus-within:border-brand hover:border-brand"
      >
        <textarea
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          placeholder="What happened today?"
          rows={3}
          className="w-full resize-none bg-transparent text-sm text-ink placeholder:text-ink-dim focus:outline-none"
        />

        <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
          <FileUpload
            onChange={(file) => setImageFile(file)}
            file={imageFile}
          />

          <button
            type="submit"
            disabled={submitting || (!newEntry.trim() && !imageFile)}
            className="rounded bg-brand px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Saving…" : "Post"}
          </button>
        </div>
      </form>

      {error && (
        <p className="mt-4 rounded border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {entries.length === 0 ? (
        <p className="mt-8 text-center text-sm text-ink-muted">
          No entries yet. Write your first note above.
        </p>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {entries.map((entry) => (
            <li
              key={entry._id}
              className="group relative rounded-xl border border-border bg-surface p-4 transition-colors hover:border-brand/40"
            >
              {editingId === entry._id ? (
                <form
                  onSubmit={handleUpdateEntry}
                  className="flex flex-col gap-3"
                >
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded border border-border bg-surface-2 px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
                    placeholder="Update your thoughts..."
                  />

                  {entry.imageUrl && !removeImage && !editImage && (
                    <div className="flex items-center justify-between rounded border border-border bg-surface-2 p-2">
                      <span className="text-xs text-ink-muted">
                        Current image
                      </span>
                      <button
                        type="button"
                        onClick={() => setRemoveImage(true)}
                        className="cursor-pointer text-xs font-medium text-destructive hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  <FileUpload
                    onChange={(file) => setEditImage(file)}
                    file={editImage}
                  />

                  <div className="flex justify-end gap-3 border-t border-border/50 pt-3">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="cursor-pointer text-xs font-medium text-ink-muted hover:text-ink"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="cursor-pointer rounded bg-brand px-4 py-1.5 text-xs font-medium text-black transition-colors hover:bg-brand-hover"
                    >
                      Save changes
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <span className="text-[11px] font-medium tracking-wide text-ink-dim uppercase">
                      {formatEntryDate(entry.createdAt)}
                      <span className="ml-2 normal-case opacity-60">
                        ({formatRelative(entry.createdAt)})
                      </span>
                    </span>

                    <div className="flex shrink-0 gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => startEdit(entry)}
                        className="cursor-pointer text-xs text-ink-muted hover:text-brand"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setEntryToDelete(entry._id);
                          setIsConfirmDeleteOpen(true);
                        }}
                        className="cursor-pointer text-xs text-ink-muted hover:text-destructive"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {entry.body && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-ink">
                      {entry.body}
                    </p>
                  )}

                  {entry.imageUrl && (
                    <div className="mt-3 overflow-hidden rounded-lg border border-border/50 bg-surface-2">
                      <img
                        src={entry.imageUrl}
                        alt="Journal attachment"
                        className="max-h-125 w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <ConfirmDeleteDialog
        open={isConfirmDeleteOpen}
        onOpenChange={(open) => {
          setIsConfirmDeleteOpen(open);
          if (!open) setEntryToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title={entryToDelete ? "Delete entry?" : "Delete empty entry?"}
        description={
          entryToDelete
            ? "Are you sure you want to permanently delete this journal entry?"
            : "You are removing both the text and the image from this entry. This will permanently delete it from your journal."
        }
      />
    </section>
  );
}
