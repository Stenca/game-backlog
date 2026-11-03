import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../api";
import GameCard from "../components/GameCard";
import GameCardSkeleton from "../components/GameCardSkeleton";
import { sortGames, STATUS_ORDER } from "@/utils/status";
import FilterSelect from "@/components/FilterSelect";
import { type Status, type UserGame } from "../types/Game";
import GameAddForm from "../components/GameAddForm";
import { SearchBar } from "../components/SearchBar";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import ErrorState from "@/components/ErrorState";

export default function Games() {
  const [filter, setFilter] = useState<Status | "all">("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 24;

  const {
    data: games = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["games"],
    queryFn: () => apiFetch<UserGame[]>("/api/games"),
  });

  const filteredGames = games.filter((g) => {
    const matchesStatus = filter === "all" || g.status === filter;
    const matchesPlatform =
      platformFilter === "all" || g.platform.name === platformFilter;
    const matchesSearch = g.game.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchesStatus && matchesPlatform && matchesSearch;
  });

  const sortedGames = sortGames(filteredGames);

  const totalPages = Math.ceil(sortedGames.length / PER_PAGE);
  const paginatedGames = sortedGames.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE,
  );

  useEffect(() => {
    setPage(1);
  }, [games.length, filter, platformFilter, searchQuery]);

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
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-col items-center text-center sm:mb-8 sm:items-start sm:text-left">
          <Logo
            size="lg"
            tagline="Your journey, remembered."
            className="mb-2 sm:mb-4 sm:scale-100"
          />
          <p className="text-sm text-ink sm:text-base">
            Track your games and take notes of your progress.
          </p>
        </div>

        <GameAddForm />

        <div className="mb-6 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:gap-2">
          <div className="order-2 w-full sm:order-1 sm:w-64">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search your library..."
              showClear={searchQuery.length > 0}
              onClear={() => setSearchQuery("")}
            />
          </div>

          <div className="order-1 flex w-full gap-2 sm:order-2 sm:w-auto">
            <div className="flex-1 sm:flex-none">
              <FilterSelect
                value={filter}
                onValueChange={(val) => setFilter(val as Status | "all")}
                options={statusOptions}
                placeholder="All Games"
              />
            </div>
            <div className="flex-1 sm:flex-none">
              <FilterSelect
                value={platformFilter}
                onValueChange={(val) => setPlatformFilter(val ?? "all")}
                options={platformOptions}
                placeholder="All Platforms"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <li key={i}>
                <GameCardSkeleton />
              </li>
            ))}
          </ul>
        ) : error ? (
          <ErrorState
            title="Failed to load your library"
            message={error.message}
            onRetry={() => refetch()}
          />
        ) : filteredGames.length === 0 ? (
          <div className="rounded border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
            <p className="text-base text-ink">
              {games.length === 0 ? "No games yet." : "No games found."}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              {games.length === 0
                ? "Search above to add your first one."
                : "Try changing your filters or search query."}
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {paginatedGames.map((g, i) => (
              <GameCard key={g._id} game={g} index={i} />
            ))}
          </ul>
        )}

        {totalPages > 1 && !isLoading && !error && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-ink-muted">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
