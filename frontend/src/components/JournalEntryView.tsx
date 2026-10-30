import { motion } from "motion/react";
import type { JournalEntry } from "../types/Game";
import { formatEntryDate, formatRelative } from "@/utils/date";
import { Button } from "@/components/ui/button";

type Props = {
  entry: JournalEntry;
  onEdit: () => void;
  onDelete: () => void;
};

export default function JournalEntryView({ entry, onEdit, onDelete }: Props) {
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

      {entry.body && (
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-ink">
          {entry.body}
        </p>
      )}

      {entry.imageUrls && entry.imageUrls.length > 0 && (
        <div className="mt-3 w-full">
          {entry.imageUrls.length === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded border border-border/50 bg-surface-2"
            >
              <img
                src={entry.imageUrls[0]}
                alt="Journal attachment"
                className="max-h-125 w-full object-cover transition-transform duration-500 hover:scale-105"
                loading="lazy"
              />
            </motion.div>
          )}

          {entry.imageUrls.length === 2 && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {entry.imageUrls.map((url, i) => (
                <motion.div
                  key={url}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="overflow-hidden rounded border border-border/50 bg-surface-2"
                >
                  <img
                    src={url}
                    alt="Attachment"
                    className="aspect-video w-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                  />
                </motion.div>
              ))}
            </div>
          )}

          {entry.imageUrls.length === 3 && (
            <div className="flex flex-col gap-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden rounded border border-border/50 bg-surface-2"
              >
                <img
                  src={entry.imageUrls[0]}
                  alt="Hero attachment"
                  className="max-h-100 w-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
              </motion.div>
              <div className="grid grid-cols-2 gap-2">
                {entry.imageUrls.slice(1).map((url, i) => (
                  <motion.div
                    key={url}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (i + 1) * 0.1 }}
                    className="overflow-hidden rounded border border-border/50 bg-surface-2"
                  >
                    <img
                      src={url}
                      alt="Attachment"
                      className="aspect-video w-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {entry.imageUrls.length === 4 && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {entry.imageUrls.map((url, i) => (
                <motion.div
                  key={url}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="overflow-hidden rounded border border-border/50 bg-surface-2"
                >
                  <img
                    src={url}
                    alt="Attachment"
                    className="aspect-video w-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                  />
                </motion.div>
              ))}
            </div>
          )}

          {entry.imageUrls.length === 5 && (
            <div className="flex flex-col gap-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden rounded border border-border/50 bg-surface-2"
              >
                <img
                  src={entry.imageUrls[0]}
                  alt="Hero attachment"
                  className="max-h-100 w-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
              </motion.div>
              <div className="grid grid-cols-2 gap-2">
                {entry.imageUrls.slice(1).map((url, i) => (
                  <motion.div
                    key={url}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (i + 1) * 0.1 }}
                    className="overflow-hidden rounded border border-border/50 bg-surface-2"
                  >
                    <img
                      src={url}
                      alt="Attachment"
                      className="aspect-video w-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
