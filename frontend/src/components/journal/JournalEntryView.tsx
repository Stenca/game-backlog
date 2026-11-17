import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/api";
import { useAuthStore } from "@/stores/authStore";
import type { JournalEntry } from "@/types/Game";
import { formatEntryDate, formatRelative } from "@/utils/date";
import { Button } from "@/components/ui/button";
import ImageCarousel from "../common/ImageCarousel";
import { Heart, MessageSquare } from "lucide-react";
import JournalEntryComments from "@/components/journal/JournalEntryComments";

type Props = {
  entry: JournalEntry;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

export default function JournalEntryView({
  entry,
  isOwner,
  onEdit,
  onDelete,
}: Props) {
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);

  const currentUser = useAuthStore((s) => s.user);
  const [likes, setLikes] = useState<string[]>(entry.likes || []);

  const isLiked = currentUser ? likes.includes(currentUser.id) : false;

  const likeMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ likesCount: number; isLiked: boolean }>(
        `/api/journal/${entry._id}/like`,
        { method: "POST" },
      ),
    onSuccess: (data) => {
      if (data.isLiked && currentUser) {
        setLikes([...likes, currentUser.id]);
      } else {
        setLikes(likes.filter((id) => id !== currentUser?.id));
      }
    },
  });

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

        {isOwner && (
          <div className="flex shrink-0 items-center gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
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
        )}
      </div>

      {entry.body && (
        <p className="mb-3 text-sm leading-relaxed whitespace-pre-wrap text-ink">
          {entry.body}
        </p>
      )}

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
                className={`cursor-pointer overflow-hidden rounded border border-border/50 bg-surface-2 transition-all duration-300 hover:border-brand hover:scale-[1.02] ${
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

      <div className="mt-4 flex items-center gap-4 border-t border-border/50 pt-3 text-sm text-ink-muted">
        <button
          onClick={() => likeMutation.mutate()}
          disabled={likeMutation.isPending}
          className={`flex items-center gap-1 transition-colors hover:text-brand ${
            isLiked ? "text-brand" : ""
          }`}
        >
          <Heart className={`h-4 w-4 ${isLiked ? "fill-brand" : ""}`} />
          {likes.length > 0 && <span>{likes.length}</span>}
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-1 transition-colors hover:text-brand ${
            showComments ? "text-brand" : ""
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Comment</span>
        </button>
      </div>

      {showComments && <JournalEntryComments entryId={entry._id} />}

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
