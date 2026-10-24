import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../api";
import GameCard from "../components/GameCard";
import Loading from "@/components/Loading";
import { sortGames, STATUS_ORDER } from "@/utils/status";
import FilterSelect from "@/components/FilterSelect";
import { type Status, type UserGame } from "../types/Game";
import bonfireImg from "../assets/bonfire.png";
import GameAddForm from "../components/GameAddForm";

export default function Games() {
  const [filter, setFilter] = useState<Status | "all">("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const PER_PAGE = 24;

  const {
    data: games = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["games"],
    queryFn: () => apiFetch<UserGame[]>("/api/games"),
  });

  const filteredGames = games.filter((g) => {
    const matchesStatus = filter === "all" || g.status === filter;
    const matchesPlatform =
      platformFilter === "all" || g.platform.name === platformFilter;
    return matchesStatus && matchesPlatform;
  });

  const sortedGames = sortGames(filteredGames);

  const totalPages = Math.ceil(sortedGames.length / PER_PAGE);
  const paginatedGames = sortedGames.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE,
  );

  useEffect(() => {
    setPage(1);
  }, [games.length, filter, platformFilter]);

  const uniqueStatuses = Array.from(new Set(games.map((g) => g.status))).sort(
    (a, b) => STATUS_ORDER[a] - STATUS_ORDER[b],
  );
  const statusOptions = [
    { label: "All Games", value: "all" },
    ...uniqueStatuses.map((s) => ({
      label: s.charAt(0).toUpperCase() + s.slice(1),
      value: s,
    })),
  ];

  const uniquePlatforms = Array.from(
    new Set(games.map((g) => g.platform.name)),
  ).sort();

  const platformOptions = [
    { label: "All Platforms", value: "all" },
    ...uniquePlatforms.map((p) => ({ label: p, value: p })),
  ];

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

        <GameAddForm />

        {error && (
          <p className="mb-4 rounded border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-destructive">
            {error.message}
          </p>
        )}

        {isLoading ? (
          <Loading text="Loading your library" />
        ) : (
          <>
            <div className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4">
              <FilterSelect
                value={filter}
                onValueChange={(val) => setFilter(val as Status | "all")}
                options={statusOptions}
                placeholder="Filter by status"
              />

              <FilterSelect
                value={platformFilter}
                onValueChange={(val) => setPlatformFilter(val ?? "all")}
                options={platformOptions}
                placeholder="Filter by platform"
              />
            </div>

            {filteredGames.length === 0 ? (
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
            ) : (
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
          </>
        )}
      </main>
    </div>
  );
}
