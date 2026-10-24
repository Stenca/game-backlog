import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { type Status, type UserGame } from "../types/Game";
import { useGameStore } from "../stores/gameStore";
import { apiFetch } from "../api";
import GameCover from "../components/GameCover";
import StatusMenu from "../components/StatusMenu";
import PlatformBadge from "../components/PlatformBadge";
import Journal from "../components/Journal";
import Loading from "@/components/Loading";

export default function GameDetail() {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<UserGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const updateStatus = useGameStore((s) => s.updateStatus);

  async function loadGame() {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const gameData = await apiFetch<UserGame>(`/api/games/${id}`);
      setGame(gameData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load game");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGame();
  }, [id]);

  async function handleStatusChange(newStatus: Status) {
    if (!game) return;
    const ok = await updateStatus(game._id, newStatus);
    if (ok) setGame({ ...game, status: newStatus });
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Loading text="Loading game details…" fullScreen />
      </main>
    );
  }

  if (error && !game) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-8">
        <p className="text-sm text-ink-muted">{error}</p>
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

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <Link
        to="/games"
        className="inline-block text-sm text-brand transition-colors hover:text-brand-hover"
      >
        ← Back to games
      </Link>

      <div className="mt-6 flex flex-col gap-6 md:flex-row">
        <div className="w-full shrink-0 md:w-56">
          <GameCover game={game} showStatus={false} />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            {game.game.title}
          </h1>
          <div className="mt-1 text-sm text-ink-muted">
            {game.game.developers && game.game.developers.length > 0 && (
              <p>
                <span className="text-ink">by </span>{" "}
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
            {game.game.playtime && (
              <>
                <span>•</span>
                <span>~{game.game.playtime}h</span>
              </>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <StatusMenu status={game.status} onChange={handleStatusChange} />
            <PlatformBadge platform={game.platform} size="md" />
          </div>

          {error && (
            <p className="mt-4 rounded border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
        </div>
      </div>

      <Journal gameId={game.game._id} userGameId={game._id} />
    </main>
  );
}
