import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useJournalStore } from "../stores/journalStore";
import type { JournalEntry } from "../types/Game";
import DeleteConfirmOverlay from "./DeleteConfirmOverlay";
import JournalEntryEditForm from "./JournalEntryEditForm";
import JournalEntryView from "./JournalEntryView";

type Props = {
  entry: JournalEntry;
};

export default function JournalEntryItem({ entry }: Props) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");

  const editingId = useJournalStore((s) => s.editingId);
  const setEditingId = useJournalStore((s) => s.setEditingId);
  const updateEntry = useJournalStore((s) => s.updateEntry);
  const removeEntry = useJournalStore((s) => s.removeEntry);

  const isEditing = editingId === entry._id;

  useEffect(() => {
    if (!isEditing && !confirmOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (confirmOpen) {
        e.preventDefault();
        setConfirmOpen(false);
      } else if (isEditing) {
        e.preventDefault();
        setEditingId(null);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isEditing, confirmOpen, setEditingId]);

  async function handleSave(formData: FormData) {
    setSaving(true);
    try {
      const ok = await updateEntry(entry._id, entry.gameId, formData);
      if (!ok) setError("Failed to update entry");
      else setEditingId(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      const ok = await removeEntry(entry._id, entry.gameId);
      if (ok) setConfirmOpen(false);
      else setError("Failed to delete entry");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <li className="group relative rounded border border-border bg-surface p-4 transition-colors hover:border-brand">
      {isEditing ? (
        <JournalEntryEditForm
          entry={entry}
          onCancel={() => setEditingId(null)}
          onSave={handleSave}
          isSaving={saving}
        />
      ) : (
        <JournalEntryView
          entry={entry}
          onEdit={() => setEditingId(entry._id)}
          onDelete={() => setConfirmOpen(true)}
        />
      )}

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            key="delete-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20"
          >
            <DeleteConfirmOverlay
              onConfirm={handleConfirmDelete}
              onCancel={() => setConfirmOpen(false)}
              isDeleting={deleting}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
