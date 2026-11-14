import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { type Status, type UserGame } from "../types/Game";
import { useGameStore } from "../stores/gameStore";
import { apiFetch } from "../api";
import GameCover from "../components/games/GameCover";
import StatusMenu from "../components/games/StatusMenu";
import PlatformBadge from "../components/games/PlatformBadge";
import Journal from "../components/journal/Journal";
import StarRating from "@/components/games/StarRating";
import { Button } from "@/components/ui/button";
import GameTimeline from "@/components/games/GameTimeline";
import DeleteConfirmOverlay from "@/components/common/DeleteConfirmOverlay";
import ErrorState from "@/components/common/ErrorState";
import GameDetailSkeleton from "@/components/games/GameDetailSkeleton";

export default function GameDetail() {
  const { id } = useParams<{ id: string }>();
  const updateStatus = useGameStore((s) => s.updateStatus);
  const updateGame = useGameStore((s) => s.updateGame);

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [savingReview, setSavingReview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const {
    data: game,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["game", id],
    queryFn: () => apiFetch<UserGame>(`/api/games/${id}`),
    enabled: !!id,
  });

  useEffect(() => {
    if (game) {
      setRating(game.rating ?? 0);
      setReview(game.review ?? "");
      setIsEditing(!game.review);
    }
  }, [game]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;

      if (confirmingDelete) {
        e.preventDefault();
        setConfirmingDelete(false);
      } else if (isEditing) {
        e.preventDefault();
        setReview(game?.review ?? "");
        setIsEditing(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [confirmingDelete, isEditing, game?.review]);

  async function handleStatusChange(newStatus: Status) {
    if (!game) return;
    await updateStatus(game._id, newStatus);
  }

  async function handleRatingChange(newRating: number) {
    if (!game) return;
    const previousRating = rating;
    setRating(newRating);
    const ok = await updateGame(game._id, { rating: newRating });
    if (!ok) setRating(previousRating);
  }

  async function handleSaveReview() {
    if (!game) return;
    setSavingReview(true);
    try {
      await updateGame(game._id, { review });
      setIsEditing(false);
    } finally {
      setSavingReview(false);
    }
  }

  async function handleDeleteReview() {
    if (!game) return;
    setSavingReview(true);
    try {
      await updateGame(game._id, { review: "" });
      setReview("");
      setIsEditing(false);
      setConfirmingDelete(false);
    } finally {
      setSavingReview(false);
    }
  }

  if (isLoading) return <GameDetailSkeleton />;

  if (error && !game) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Link
          to="/games"
          className="mb-6 inline-block text-sm text-brand transition-colors hover:text-brand-hover"
        >
          ← Back to games
        </Link>
        <ErrorState
          title="Failed to load game"
          message={error.message}
          onRetry={() => refetch()}
        />
      </main>
    );
  }

  if (!game) return null;

  const hasReviewChanges = review !== (game.review ?? "");

  return (
    <main className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute -top-10 -left-10 -z-10 h-125 w-125 rounded-full bg-brand/10 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 -right-20 -z-10 h-100 w-100 rounded-full bg-brand/5 blur-[100px]" />

      <Link
        to="/games"
        className="mb-4 inline-block text-sm text-brand transition-colors hover:text-brand-hover sm:mb-6"
      >
        ← Back to games
      </Link>

      <div className="grid grid-cols-[100px_1fr] gap-4 sm:grid-cols-[150px_1fr] md:grid-cols-[224px_1fr] md:gap-8">
        <div className="flex flex-col gap-4">
          <GameCover game={game} showStatus={false} />
          <div className="flex flex-1 flex-col justify-end rounded bg-surface p-2 sm:p-3">
            <GameTimeline game={game} />
          </div>
        </div>

        {/* 
          This wrapper is normally the right column. 
          On mobile, we use `contents` so its children flow into the parent grid.
        */}
        <div className="contents md:flex md:flex-col">
          {/* Top Info (Title, Dev, Badges) - Right column on mobile, part of right col on desktop */}
          <div className="flex flex-col">
            <h1 className="mt-0 text-xl font-bold tracking-tight text-ink sm:text-3xl">
              {game.game.title}
            </h1>

            <div className="mt-1 text-xs text-ink-muted sm:text-sm">
              {game.game.developers && game.game.developers.length > 0 && (
                <p>
                  <span className="text-ink">by </span>
                  <span className="text-ink">
                    {game.game.developers.join(", ")}
                  </span>
                </p>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted sm:text-sm">
              {game.game.releaseDate && (
                <span>{game.game.releaseDate.slice(0, 4)}</span>
              )}
              {game.game.genres && game.game.genres.length > 0 && (
                <>
                  <span>•</span>
                  <span>{game.game.genres.join(", ")}</span>
                </>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-4 sm:gap-3">
              <StatusMenu status={game.status} onChange={handleStatusChange} />
              <PlatformBadge platform={game.platform} size="md" />
            </div>
          </div>

          {/* Review Section - Full width under grid on mobile, part of right col on desktop */}
          <div className="col-span-2 mt-2 flex flex-col border-t border-border pt-4 md:col-span-1 md:mt-6 md:flex-1">
            <h2 className="mb-3 text-sm font-semibold text-ink sm:text-base">
              Your rating and review
            </h2>

            <div className="mb-3 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 sm:gap-4">
                <StarRating value={rating} onChange={handleRatingChange} />
                <span className="text-xs text-ink-muted sm:text-sm">
                  {rating > 0 ? `${rating}/5` : "Not rated"}
                </span>
              </div>

              {game.review && !isEditing && (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="h-6 px-2 text-xs text-brand hover:text-brand-hover"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmingDelete(true)}
                    className="h-6 px-2 text-xs text-destructive hover:text-destructive-hover"
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>

            <div className="relative flex flex-1 flex-col">
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                onClick={() => {
                  if (!isEditing) setIsEditing(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && isEditing) {
                    if (hasReviewChanges) {
                      e.preventDefault();
                      handleSaveReview();
                    }
                  }
                  if (e.key === "Escape" && confirmingDelete) {
                    e.preventDefault();
                    setConfirmingDelete(false);
                  }
                }}
                placeholder="What did you think of this game?"
                readOnly={!isEditing || confirmingDelete}
                className={`block min-h-32 w-full flex-1 resize-none rounded border px-3 py-2 pb-10 text-sm leading-relaxed placeholder:text-ink-dim focus:outline-none transition-all [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none sm:min-h-40 sm:px-4 sm:py-3 sm:pb-12 ${
                  isEditing
                    ? "border-border bg-surface shadow-inner focus:border-brand focus:ring-2 focus:ring-brand/20"
                    : "cursor-pointer border-transparent bg-surface hover:border-brand focus:border-transparent focus:ring-0 text-ink-muted"
                }`}
              />

              <AnimatePresence>
                {confirmingDelete && (
                  <motion.div
                    key="delete-review-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20"
                  >
                    <DeleteConfirmOverlay
                      onConfirm={handleDeleteReview}
                      onCancel={() => setConfirmingDelete(false)}
                      isDeleting={savingReview}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {isEditing && !confirmingDelete && (
                <div className="absolute right-2 bottom-2 flex gap-2 sm:right-3 sm:bottom-3">
                  {game.review && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReview(game.review ?? "");
                        setIsEditing(false);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleSaveReview}
                    disabled={!hasReviewChanges}
                    isLoading={savingReview}
                  >
                    Save Review
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Journal gameId={game.game._id} userGameId={game._id} />
    </main>
  );
}
