import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { type Status, type UserGame } from "../types/Game";
import { useGameStore } from "../stores/gameStore";
import { apiFetch } from "../api";
import GameCover from "../components/GameCover";
import StatusMenu from "../components/StatusMenu";
import PlatformBadge from "../components/PlatformBadge";
import Journal from "../components/Journal";
import Loading from "@/components/Loading";
import StarRating from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import GameTimeline from "@/components/GameTimeline";
import DeleteConfirmOverlay from "@/components/DeleteConfirmOverlay";
import { Spinner } from "@/components/ui/spinner";

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

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Loading text="Loading game details…" fullScreen />
      </main>
    );
  }

  if (error && !game) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-8">
        <p className="text-sm text-ink-muted">{error.message}</p>
        <Link
          to="/games"
          className="mt-4 inline-block text-sm text-brand transition-colors hover:text-brand-hover"
        >
          ← Back to games
        </Link>
      </main>
    );
  }

  if (!game) return null;

  const hasReviewChanges = review !== (game.review ?? "");

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <Link
        to="/games"
        className="inline-block text-sm text-brand transition-colors hover:text-brand-hover"
      >
        ← Back to games
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-[224px_1fr]">
        <div className="flex flex-col gap-4">
          <GameCover game={game} showStatus={false} />
          <div className="flex flex-1 flex-col justify-end rounded bg-surface p-3">
            <GameTimeline game={game} />
          </div>
        </div>

        <div className="flex flex-col">
          <h1 className="mt-0 text-3xl leading-none font-bold tracking-tight text-ink">
            {game.game.title}
          </h1>

          <div className="mt-1 text-sm text-ink-muted">
            {game.game.developers && game.game.developers.length > 0 && (
              <p>
                <span className="text-ink">by </span>
                <span className="text-ink">
                  {game.game.developers.join(", ")}
                </span>
              </p>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
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

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <StatusMenu status={game.status} onChange={handleStatusChange} />
            <PlatformBadge platform={game.platform} size="md" />
          </div>

          <div className="mt-6 flex flex-1 flex-col border-t border-border pt-4">
            <h2 className="mb-3 text-base font-semibold text-ink">
              Your rating and review
            </h2>

            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <StarRating value={rating} onChange={handleRatingChange} />
                <span className="text-sm text-ink-muted">
                  {rating > 0 ? `${rating}/5` : "Not rated"}
                </span>
              </div>

              {game.review && !isEditing && (
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="cursor-pointer text-xs font-medium text-brand transition-colors hover:text-brand-hover"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmingDelete(true)}
                    className="cursor-pointer text-xs font-medium text-destructive transition-colors hover:text-red-600"
                  >
                    Delete
                  </button>
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
                  setConfirmingDelete(false);
                }}
                placeholder="What did you think of this game?"
                readOnly={!isEditing || confirmingDelete}
                className={`block min-h-32 w-full flex-1 resize-none rounded border px-3 py-2 text-sm placeholder:text-ink-dim focus:outline-none ${
                  isEditing
                    ? "border-border bg-surface focus:border-brand"
                    : "cursor-pointer border-transparent bg-surface-2/50 hover:border-border/50 focus:border-transparent focus:ring-0 text-ink-muted"
                }`}
              />

              {confirmingDelete && (
                <DeleteConfirmOverlay
                  onConfirm={handleDeleteReview}
                  onCancel={() => setConfirmingDelete(false)}
                  isDeleting={savingReview}
                />
              )}

              {isEditing && !confirmingDelete && (
                <div className="absolute right-2 bottom-2 flex gap-2">
                  {game.review && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setReview(game.review ?? "");
                        setIsEditing(false);
                      }}
                      className="cursor-pointer border-border bg-surface/80 text-ink hover:text-brand"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    onClick={handleSaveReview}
                    disabled={!hasReviewChanges || savingReview}
                    className="cursor-pointer rounded bg-brand px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {savingReview ? (
                      <>
                        <Spinner className="h-4 w-4 text-black" />
                        Saving...
                      </>
                    ) : (
                      "Save Review"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-destructive">
              {error.message}
            </p>
          )}
        </div>
      </div>

      <Journal gameId={game.game._id} userGameId={game._id} />
    </main>
  );
}
