import { useState } from "react";
import { Button } from "@/components/ui/button";
import FileUpload from "./FileUpload";
import type { JournalEntry } from "../types/Game";

type Props = {
  entry: JournalEntry;
  onCancel: () => void;
  onSave: (formData: FormData) => Promise<void>;
  isSaving: boolean;
};

const MAX_IMAGES = 4;

export default function JournalEntryEditForm({
  entry,
  onCancel,
  onSave,
  isSaving,
}: Props) {
  const [editBody, setEditBody] = useState(entry.body || "");
  const [editImages, setEditImages] = useState<File[]>([]);
  const [removedUrls, setRemovedUrls] = useState<Set<string>>(new Set());

  const keptUrls =
    entry.imageUrls?.filter((url) => !removedUrls.has(url)) || [];
  const totalCount = keptUrls.length + editImages.length;

  function handleRemoveExisting(url: string) {
    setRemovedUrls((prev) => {
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  }

  function handleAddImages(newFiles: File[]) {
    setEditImages((prev) => {
      const combined = [...prev, ...newFiles];
      const uniqueFiles = Array.from(
        new Map(combined.map((f) => [f.name, f])).values(),
      );
      return uniqueFiles.slice(0, MAX_IMAGES - keptUrls.length);
    });
  }

  function handleRemoveNewImage(indexToRemove: number) {
    setEditImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const formData = new FormData();
    formData.append("body", editBody);
    formData.append("existingImages", JSON.stringify(keptUrls));

    const removedPublicIds: string[] = [];
    entry.imageUrls?.forEach((url, index) => {
      if (removedUrls.has(url)) {
        const publicId = entry.imagePublicIds?.[index];
        if (publicId) removedPublicIds.push(publicId);
      }
    });
    formData.append("removedPublicIds", JSON.stringify(removedPublicIds));

    editImages.forEach((file) => formData.append("images", file));

    await onSave(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <textarea
        value={editBody}
        onChange={(e) => setEditBody(e.target.value)}
        rows={3}
        className="w-full resize-none rounded border border-border bg-surface-2 px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
        placeholder="Update your thoughts..."
      />

      <div className="mt-1 flex items-center justify-between border-t border-border/50 pt-3">
        <div className="flex flex-1 items-center">
          <FileUpload
            multiple
            files={editImages}
            onAdd={handleAddImages}
            onRemove={handleRemoveNewImage}
            existingUrls={keptUrls}
            onRemoveExisting={handleRemoveExisting}
            disabled={totalCount >= MAX_IMAGES}
          />
        </div>

        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSaving}>
            Save changes
          </Button>
        </div>
      </div>
    </form>
  );
}
