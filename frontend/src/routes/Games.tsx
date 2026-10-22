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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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
  const [filter, setFilter] = useState<Status | "all">("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const PER_PAGE = 24;

  const uniquePlatforms = Array.from(
    new Set(games.map((g) => g.platform.name)),
  ).sort();

  const filteredGames = games.filter((g) => {
    const matchesStatus = filter === "all" || g.status === filter;
    const matchesPlatform =
      platformFilter === "all" || g.platform.name === platformFilter;
    return matchesStatus && matchesPlatform;
  });

  const totalPages = Math.ceil(filteredGames.length / PER_PAGE);
  const paginatedGames = filteredGames.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE,
  );

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [games.length, filter, platformFilter]);

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
              <span className="text-brand">Bon</span>fire.
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
                <Select
                  value={platform?.name ?? ""}
                  onValueChange={(value) => {
                    const p = details.availablePlatforms.find(
                      (x) => x.name === value,
                    );
                    setPlatform(p ?? null);
                  }}
                >
                  <SelectTrigger className="cursor-pointer rounded border border-border bg-surface-2 text-ink font-medium  focus:ring-0 focus-visible:ring-0 data-popup-open:border-brand! data-popup-open:text-brand! transition-colors">
                    {" "}
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {" "}
                    {details.availablePlatforms.map((p) => (
                      <SelectItem key={p.slug ?? p.name} value={p.name}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as Status)}
                >
                  <SelectTrigger className="cursor-pointer rounded border border-border bg-surface-2 text-ink font-medium  focus:ring-0 focus-visible:ring-0 data-popup-open:border-brand! data-popup-open:text-brand! transition-colors">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  type="submit"
                  disabled={!platform}
                  className="rounded bg-brand px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Add
                </Button>
              </div>
            </>
          )}
        </form>

        {error && (
          <p className="mb-4 rounded border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {loading && <p className="text-sm text-ink-muted">Loading…</p>}

        <div className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4">
          <Select
            value={filter}
            onValueChange={(value) => setFilter(value as Status | "all")}
          >
            <SelectTrigger className="w-37 cursor-pointer rounded border border-border bg-surface-2 text-ink font-medium focus:ring-0 hover:text-brand! focus-visible:ring-0 data-popup-open:border-brand! data-popup-open:text-brand! transition-colors">
              <SelectValue placeholder="Filter">
                {filter === "all"
                  ? "All Games"
                  : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent
              alignItemWithTrigger={false}
              className="border-border bg-surface text-ink"
            >
              <SelectItem value="all">All Games</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={platformFilter}
            onValueChange={(value) => setPlatformFilter(value ?? "all")}
          >
            <SelectTrigger className="w-37 cursor-pointer rounded border border-border bg-surface-2 text-ink font-medium  focus:ring-0 hover:text-brand! focus-visible:ring-0 data-popup-open:border-brand! data-popup-open:text-brand! transition-colors">
              <SelectValue placeholder="Platform">
                {platformFilter === "all" ? "All Platforms" : platformFilter}
              </SelectValue>
            </SelectTrigger>

            <SelectContent
              alignItemWithTrigger={false}
              className="border-border bg-surface text-ink"
            >
              <SelectItem value="all">All Platforms</SelectItem>
              {uniquePlatforms.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!loading && filteredGames.length === 0 && (
          <div className="rounded border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
            <p className="text-base text-ink">
              {games.length === 0
                ? "No games yet."
                : `No games marked as ${filter}.`}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              {games.length === 0
                ? "Search above to add your first one."
                : "Try changing the filter or adding a new game."}
            </p>
          </div>
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
              className="cursor-pointer rounded border border-border px-3 py-1.5 text-sm text-ink-muted transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-ink-muted">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="cursor-pointer rounded border border-border px-3 py-1.5 text-sm text-ink-muted transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
