import { motion, AnimatePresence } from "motion/react";
import type { JournalEntry } from "../types/Game";
import { formatEntryDate, formatRelative } from "@/utils/date";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ImageCarousel from "./ImageCarousel";

type Props = {
  entry: JournalEntry;
  onEdit: () => void;
  onDelete: () => void;
};

export default function JournalEntryView({ entry, onEdit, onDelete }: Props) {
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const openCarousel = (index: number) => {
    setCarouselIndex(index);
    setCarouselOpen(true);
  };

  return (
    <>
      <div className="mb-2 flex items-start justify-between gap-4">
        <span className="text-[11px] font-medium tracking-wide text-ink-dim uppercase">
          {formatEntryDate(entry.createdAt)}
          <span className="ml-2 normal-case opacity-60">
            ({formatRelative(entry.createdAt)})
          </span>
        </span>

        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-7 px-2 text-xs text-ink-muted hover:text-brand"
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-7 px-2 text-xs text-ink-muted hover:text-destructive"
          >
            Delete
          </Button>
        </div>
      </div>

      {entry.imageUrls && entry.imageUrls.length > 0 && (
        <div
          className={`mt-3 grid gap-2 ${
            entry.imageUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"
          }`}
        >
          {entry.imageUrls.map((url, i) => {
            const isHero =
              (entry.imageUrls!.length === 3 ||
                entry.imageUrls!.length === 5) &&
              i === 0;

            return (
              <motion.div
                key={url}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => openCarousel(i)}
                className={`cursor-pointer overflow-hidden rounded border border-border/50 bg-surface-2 transition-transform hover:border-brand hover:scale-[1.02] ${
                  isHero ? "col-span-2" : "col-span-1"
                }`}
              >
                <img
                  src={url}
                  alt={`Attachment ${i + 1}`}
                  className={`w-full object-cover ${
                    entry.imageUrls!.length === 1 || isHero
                      ? "max-h-96 aspect-video"
                      : "aspect-video"
                  }`}
                  loading="lazy"
                />
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {carouselOpen && (
          <ImageCarousel
            images={entry.imageUrls || []}
            initialIndex={carouselIndex}
            onClose={() => setCarouselOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
