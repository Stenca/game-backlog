import { useState } from "react";
import { useAuthStore } from "../stores/authStore";
import type { JournalEntry } from "../types/Game";
import { formatEntryDate, formatRelative } from "@/utils/date";
import FileUpload from "./FileUpload";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";
import { apiFetch } from "../api";

type Props = {
  entry: JournalEntry;
  onUpdate: (updatedEntry: JournalEntry) => void;
  onDelete: (entryId: string) => void;
};

export default function JournalEntryItem({ entry, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(entry.body || "");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");
  const token = useAuthStore((s) => s.token);

  function startEdit() {
    setEditing(true);
    setEditBody(entry.body || "");
    setEditImage(null);
    setRemoveImage(false);
  }

  async function handleSave(e: React.SubmitEvent) {
    e.preventDefault();

    const hasBody = !!editBody.trim();
    const hasNewImage = !!editImage;
    const hasExistingImage = !!entry.imageUrl && !removeImage;

    if (!hasBody && !hasNewImage && !hasExistingImage) {
      setConfirmOpen(true);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("body", editBody);
      if (removeImage) formData.append("removeImage", "true");
      if (editImage) formData.append("image", editImage);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/journal/${entry._id}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      if (!res.ok) throw new Error("Failed to update entry");

      const updated = await res.json();
      onUpdate(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function handleConfirmDelete() {
    try {
      await apiFetch(`/api/journal/${entry._id}`, { method: "DELETE" });
      onDelete(entry._id);
      setConfirmOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <li className="group relative rounded-xl border border-border bg-surface p-4 transition-colors hover:border-brand">
      {editing ? (
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={3}
            className="w-full resize-none rounded border border-border bg-surface-2 px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
            placeholder="Update your thoughts..."
          />

          {entry.imageUrl && !removeImage && !editImage && (
            <div className="flex items-center justify-between rounded border border-border bg-surface-2 p-2">
              <span className="text-xs text-ink-muted">Current image</span>
              <button
                type="button"
                onClick={() => setRemoveImage(true)}
                className="cursor-pointer text-xs font-medium text-destructive hover:text-red-300"
              >
                Remove
              </button>
            </div>
          )}

          <FileUpload onChange={setEditImage} file={editImage} />

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex justify-end gap-3 border-t border-border/50 pt-3">
            <button
              type="button"
              onClick={() => setEditing(false)}
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
                onClick={startEdit}
                className="cursor-pointer text-xs text-ink-muted hover:text-brand"
              >
                Edit
              </button>
              <button
                onClick={() => setConfirmOpen(true)}
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

      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleConfirmDelete}
        title="Delete entry ?"
        description="Are you sure you want to permanently delete this journal entry ?"
      />
    </li>
  );
}
