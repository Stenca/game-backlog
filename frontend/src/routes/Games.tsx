import { useEffect, useState } from "react";
import {
  STATUSES,
  type GameDetails,
  type Platform,
  type SearchResult,
  type Status,
} from "../types/Game";
import { apiFetch } from "../api";
import GameSearch from "../components/GameSearch";
import GameCard from "../components/GameCard";
import { useGameStore } from "../stores/gameStore";
import bonfireImg from "../assets/bonfire.png";

export default function Games() {
  const games = useGameStore((s) => s.games);
  const loading = useGameStore((s) => s.loading);
  const error = useGameStore((s) => s.error);
  const load = useGameStore((s) => s.load);
  const add = useGameStore((s) => s.add);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [details, setDetails] = useState<GameDetails | null>(null);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [status, setStatus] = useState<Status>("backlog");
  const [searchKey, setSearchKey] = useState(0);

  const [page, setPage] = useState(1);
  const PER_PAGE = 24;
  const totalPages = Math.ceil(games.length / PER_PAGE);
  const paginatedGames = games.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [games.length]);

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
      console.error(err);
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
    const ok = await add({
      rawgId: selected.rawgId,
      platform: {
        name: platform.name,
        slug: platform.slug,
        releasedAt: platform.releasedAt,
      },
      status,
    });
    if (ok) handleClearSelection();
  }

  return (
    <div className="min-h-screen bg-bg">
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-5">
          <div className="mb-5 flex flex-wrap items-baseline">
            <img src={bonfireImg} alt="" className="h-12 w-12 object-contain" />
            <h1 className="mr-4 text-6xl font-bold tracking-tight text-ink">
              <span className="text-accent">Bon</span>fire.
            </h1>
            <p className="text-lg text-ink-muted">Your journey, remembered.</p>
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
                  {details.developers && details.developers.length > 0 && (
                    <p className="mt-1 text-sm text-ink-muted">
                      {details.developers.join(", ")}
                    </p>
                  )}
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

        {paginatedGames.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {paginatedGames.map((g) => (
              <GameCard key={g._id} game={g} />
            ))}
          </ul>
        )}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="cursor-pointer rounded border border-border px-3 py-1.5 text-sm text-ink-muted transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-ink-muted">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="cursor-pointer rounded border border-border px-3 py-1.5 text-sm text-ink-muted transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
