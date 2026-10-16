import { useEffect, useState } from "react";
import {
  STATUSES,
  type GameDetails,
  type Platform,
  type SearchResult,
  type Status,
  type UserGame,
} from "../types/Game";
import { apiFetch } from "../api";
import GameSearch from "../components/GameSearch";
import GameCard from "../components/GameCard";

export default function Games() {
  const [games, setGames] = useState<UserGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [details, setDetails] = useState<GameDetails | null>(null);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [status, setStatus] = useState<Status>("backlog");
  const [searchKey, setSearchKey] = useState(0);

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
    setSearchKey((k) => k + 1);
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
            key={searchKey}
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

        {games.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {games.map((g) => (
              <GameCard
                key={g._id}
                game={g}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onClick={(g) => console.log("open", g._id)}
              />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
