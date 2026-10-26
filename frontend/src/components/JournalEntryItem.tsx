import { useEffect, useState } from "react";
import { useJournalStore } from "../stores/journalStore";
import type { JournalEntry } from "../types/Game";
import { formatEntryDate, formatRelative } from "@/utils/date";
import FileUpload from "./FileUpload";
import AttachmentPreview from "@/components/AttachmentPreview";
import DeleteConfirmOverlay from "./DeleteConfirmOverlay";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  entry: JournalEntry;
};

export default function JournalEntryItem({ entry }: Props) {
  const [editBody, setEditBody] = useState(entry.body || "");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [removeImage, setRemoveImage] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");

  const editingId = useJournalStore((s) => s.editingId);
  const setEditingId = useJournalStore((s) => s.setEditingId);
  const updateEntry = useJournalStore((s) => s.updateEntry);
  const removeEntry = useJournalStore((s) => s.removeEntry);

  const isEditing = editingId === entry._id;

  function startEdit() {
    setEditBody(entry.body || "");
    setEditImage(null);
    setRemoveImage(false);
    setError("");
    setEditingId(entry._id);
  }

  function cancelEdit() {
    setEditBody(entry.body || "");
    setEditImage(null);
    setRemoveImage(false);
    setError("");
    setEditingId(null);
  }

  useEffect(() => {
    if (!isEditing && !confirmOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;

      if (confirmOpen) {
        e.preventDefault();
        setConfirmOpen(false);
      } else if (isEditing) {
        e.preventDefault();
        cancelEdit();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isEditing, confirmOpen, entry.body]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const hasBody = !!editBody.trim();
    const hasNewImage = !!editImage;
    const hasExistingImage = !!entry.imageUrl && !removeImage;

    if (!hasBody && !hasNewImage && !hasExistingImage) {
      setConfirmOpen(true);
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("body", editBody);
      if (removeImage) formData.append("removeImage", "true");
      if (editImage) formData.append("image", editImage);

      const ok = await updateEntry(entry._id, entry.gameId, formData);
      if (!ok) setError("Failed to update entry");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    const ok = await removeEntry(entry._id, entry.gameId);
    if (ok) {
      setConfirmOpen(false);
    } else {
      setError("Failed to delete entry");
    }
  }

  return (
    <li className="group relative rounded border border-border bg-surface p-4 transition-colors hover:border-brand">
      {isEditing ? (
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
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
              onClick={cancelEdit}
              className="cursor-pointer text-xs font-medium text-ink-muted transition-colors hover:text-brand"
            >
              Cancel
            </button>
            <Button
              type="submit"
              className="cursor-pointer rounded bg-brand px-4 py-1.5 text-xs font-medium text-black transition-colors hover:bg-brand-hover"
            >
              {saving ? (
                <>
                  <Spinner className="h-4 w-4 text-black" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
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
            <div className="mt-3 overflow-hidden rounded border border-border/50 bg-surface-2">
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

      {confirmOpen && (
        <DeleteConfirmOverlay
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </li>
  );
}
