import { useEffect, useState } from "react";
import {
  STATUSES,
  type GameDetails,
  type Platform,
  type SearchResult,
  type Status,
  type UserGame,
} from "../types/Game";
import { useAuthStore } from "../stores/authStore";
import { apiFetch } from "../api";
import GameSearch from "../components/GameSearch";

const statusColor: Record<Status, string> = {
  backlog: "bg-ink-dim",
  playing: "bg-blue-600",
  completed: "bg-green-700",
  dropped: "bg-red-700",
  wishlist: "bg-purple-700",
};

export default function Games() {
  const [games, setGames] = useState<UserGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [details, setDetails] = useState<GameDetails | null>(null);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [status, setStatus] = useState<Status>("backlog");

  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  async function load() {
    setError("");
    try {
      const data = await apiFetch<UserGame[]>("/api/games");
      setGames(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load games");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSelect(result: SearchResult) {
    setSelected(result);
    setDetails(null);
    setPlatform(null);
    try {
      const d = await apiFetch<GameDetails>(
        `/api/games/details/${result.rawgId}`,
      );
      setDetails(d);
      setPlatform(d.availablePlatforms[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load details");
    }
  }

  function handleClearSelection() {
    setSelected(null);
    setDetails(null);
    setPlatform(null);
    setStatus("backlog");
  }

  async function handleAdd(e: React.SubmitEvent) {
    e.preventDefault();
    if (!selected || !platform) return;
    setError("");
    try {
      await apiFetch("/api/games", {
        method: "POST",
        body: JSON.stringify({
          rawgId: selected.rawgId,
          platform: {
            name: platform.name,
            slug: platform.slug,
            releasedAt: platform.releasedAt,
          },
          status,
        }),
      });
      handleClearSelection();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add game");
    }
  }

  async function handleStatusChange(id: string, newStatus: Status) {
    setError("");
    try {
      const updated = await apiFetch<UserGame>(`/api/games/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setGames((prev) => prev.map((g) => (g._id === id ? updated : g)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update game");
    }
  }

  async function handleDelete(id: string) {
    setError("");
    try {
      await apiFetch(`/api/games/${id}`, { method: "DELETE" });
      setGames((prev) => prev.filter((g) => g._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete game");
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-sm font-medium text-ink-muted">
            {user?.username}
          </span>
          <button
            onClick={logout}
            className="text-xs text-ink-muted transition-colors hover:text-ink"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-5">
          <div className="mb-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="text-6xl font-bold tracking-tight text-ink">
              <span className="text-accent">Bon</span>fire.
            </h1>
            <p className="text-lg text-ink-muted">
              Where your journey is kept.
            </p>
          </div>

          <p className="text-base">
            Track your games and take notes of your progress.
          </p>
        </div>
        <form onSubmit={handleAdd} className="mb-8">
          <GameSearch
            onSelect={handleSelect}
            selected={selected}
            onClear={handleClearSelection}
          />

          {details && (
            <>
              <div className="mt-4 flex gap-4 rounded border border-border bg-surface p-4">
                <img
                  src={details.coverUrl}
                  alt=""
                  className="h-32 w-24 shrink-0 rounded object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-ink">
                    {details.title}
                  </h3>
                  <p className="mt-1 text-xs text-ink-muted">
                    {details.releaseDate?.slice(0, 4)}
                    {details.genres.length > 0 &&
                      ` · ${details.genres.join(", ")}`}
                  </p>
                  {details.playtime && (
                    <p className="mt-1 text-xs text-ink-dim">
                      ~{details.playtime}h to beat
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <select
                  value={platform?.name ?? ""}
                  onChange={(e) => {
                    const p = details.availablePlatforms.find(
                      (x) => x.name === e.target.value,
                    );
                    setPlatform(p ?? null);
                  }}
                  className="rounded border border-border bg-surface-2 px-3 py-1.5 text-sm text-ink focus:outline-none"
                >
                  <option value="">Select platform</option>
                  {details.availablePlatforms.map((p) => (
                    <option key={p.slug ?? p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                  className="rounded border border-border bg-surface-2 px-3 py-1.5 text-sm text-ink focus:outline-none"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={!platform}
                  className="rounded bg-accent px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            </>
          )}
        </form>

        {error && (
          <p className="mb-4 rounded border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        {loading && <p className="text-sm text-ink-muted">Loading…</p>}

        {!loading && games.length === 0 && (
          <p className="text-sm text-ink-muted">
            No games yet. Search above to add one.
          </p>
        )}

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {games.map((g) => (
            <li key={g._id} className="group">
              <div className="relative aspect-3/4 overflow-hidden rounded bg-surface-2">
                {g.game.coverUrl ? (
                  <img
                    src={g.game.coverUrl}
                    alt={g.game.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-ink-dim">
                    No cover
                  </div>
                )}

                <span
                  className={`absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white ${statusColor[g.status]}`}
                >
                  {g.status}
                </span>

                <button
                  onClick={() => handleDelete(g._id)}
                  className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  ×
                </button>
              </div>

              <div className="mt-1.5 truncate text-xs font-medium text-ink">
                {g.game.title}
              </div>
              <div className="text-[11px] text-ink-muted">
                {g.platform.name}
              </div>

              <select
                value={g.status}
                onChange={(e) =>
                  handleStatusChange(g._id, e.target.value as Status)
                }
                className="mt-1 w-full rounded border border-border bg-surface-2 px-1 py-0.5 text-[11px] text-ink-muted focus:outline-none"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
