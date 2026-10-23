import { useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { useJournalStore } from "../stores/journalStore";
import type { JournalEntry } from "../types/Game";
import { formatEntryDate, formatRelative } from "@/utils/date";
import FileUpload from "./FileUpload";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";
import { apiFetch } from "../api";
import AttachmentPreview from "@/components/AttachmentPreview";

type Props = {
  entry: JournalEntry;
};

export default function JournalEntryItem({ entry }: Props) {
  const [editBody, setEditBody] = useState(entry.body || "");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");

  const token = useAuthStore((s) => s.token);
  const editingId = useJournalStore((s) => s.editingId);
  const setEditingId = useJournalStore((s) => s.setEditingId);
  const updateEntry = useJournalStore((s) => s.updateEntry);
  const removeEntry = useJournalStore((s) => s.removeEntry);

  const isEditing = editingId === entry._id;

  function startEdit() {
    setEditBody(entry.body || "");
    setEditImage(null);
    setRemoveImage(false);
    setEditingId(entry._id);
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
      updateEntry(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function handleConfirmDelete() {
    try {
      await apiFetch(`/api/journal/${entry._id}`, { method: "DELETE" });
      removeEntry(entry._id);
      setConfirmOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <li className="group relative rounded-xl border border-border bg-surface p-4 transition-colors hover:border-brand">
      {isEditing ? (
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={3}
            className="w-full resize-none rounded border border-border bg-surface-2 px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
            placeholder="Update your thoughts..."
          />

          <FileUpload onChange={setEditImage} file={editImage} />
          {entry.imageUrl && !removeImage && !editImage && (
            <AttachmentPreview
              name={entry.imageUrl.split("/").pop() || "Current image"}
              onRemove={() => setRemoveImage(true)}
            />
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex justify-end gap-3 border-t border-border/50 pt-3">
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="cursor-pointer text-xs font-medium text-ink-muted  hover:text-brand transition-colors"
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
