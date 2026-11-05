import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../api";
import GameCard from "../components/GameCard";
import GameCardSkeleton from "../components/GameCardSkeleton";
import { sortGames, STATUS_ORDER } from "@/utils/status";
import FilterSelect from "@/components/FilterSelect";
import { type Status, type UserGame } from "../types/Game";
import GameAddForm from "../components/GameAddForm";
import { SearchBar } from "@/components/SearchBar";
import Logo from "@/components/Logo";
import ErrorState from "@/components/ErrorState";
import bonfireImg from "../assets/bonfire.png";
import { ArrowUp } from "lucide-react";
import { usePagination } from "../hooks/usePagination";
import Pagination from "../components/Pagination";

export default function Games() {
  const [filter, setFilter] = useState<Status | "all">("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
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

  const { page, totalPages, paginatedItems, goToPage, resetPage } =
    usePagination(sortedGames, PER_PAGE);

  const pageTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    resetPage();
  }, [filter, platformFilter, searchQuery, resetPage]);

  const paginate = (pageNumber: number) => {
    goToPage(pageNumber);
    setTimeout(() => {
      if (pageTopRef.current) {
        const yOffset = pageTopRef.current.getBoundingClientRect().top;
        const y = yOffset + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }, 10);
  };

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
      <main className="mx-auto max-w-5xl px-4 py-3 sm:px-6 sm:py-8">
        <div className="mb-4 flex flex-col items-center text-center sm:mb-8 sm:items-start sm:text-left">
          <Logo
            size="lg"
            tagline="Your journey, remembered."
            className="sm:mb-4"
          />
          <p className="mt-3 text-sm text-ink-muted sm:mt-0 sm:text-base">
            Track your games and take notes of your progress.
          </p>
        </div>

        <GameAddForm />

        {games.length > 0 && (
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
        )}

        <div ref={pageTopRef} className="scroll-mt-24">
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
            <div className="relative mt-24 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/30 px-6 py-20 text-center">
              {games.length === 0 && (
                <div className="absolute -top-16 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-brand">
                  <ArrowUp className="h-8 w-8 animate-bounce" />
                  <span className="text-[10px] font-medium uppercase tracking-wider">
                    Search above
                  </span>
                </div>
              )}

              <img
                src={bonfireImg}
                alt=""
                className="mb-6 h-20 w-20 object-contain opacity-40 grayscale"
              />
              <h3 className="text-xl font-bold tracking-tight text-ink">
                {games.length === 0
                  ? "Your campfire is empty"
                  : "No games found"}
              </h3>
              <p className="mt-2 max-w-md text-sm text-ink-muted">
                {games.length === 0
                  ? "Search for a game above to start tracking your journey and lighting the fire."
                  : "Try changing your filters or search query to find what you're looking for."}
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {paginatedItems.map((g, i) => (
                <GameCard key={g._id} game={g} index={i} />
              ))}
            </ul>
          )}
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={paginate}
        />
      </main>
    </div>
  );
}
