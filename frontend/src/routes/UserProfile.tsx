import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api";
import GameCard from "@/components/games/GameCard";
import { useAuthStore } from "@/stores/authStore";
import { type UserGame, type Status } from "@/types/Game";
import Avatar from "@/components/common/Avatar";
import { Button } from "@/components/ui/button";
import Loading from "@/components/common/Loading";
import ErrorState from "@/components/common/ErrorState";
import { SearchBar } from "@/components/common/SearchBar";
import FilterSelect from "@/components/games/FilterSelect";
import { sortGames } from "@/utils/status";

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const currentUser = useAuthStore((s) => s.user);

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<Status | "all">("all");

  const {
    data: userProfile,
    isLoading: userLoading,
    error: userError,
  } = useQuery({
    queryKey: ["user", username],
    queryFn: () => apiFetch<{ user: any }>(`/api/users/${username}`),
  });

  const { data: games = [], isLoading: gamesLoading } = useQuery({
    queryKey: ["games", username],
    queryFn: () => apiFetch<UserGame[]>(`/api/games?user=${username}`),
    enabled: !!username,
  });

  if (userLoading || gamesLoading)
    return <Loading text="Loading profile..." fullScreen />;

  if (userError)
    return (
      <ErrorState
        title="User not found"
        message="This profile does not exist."
      />
    );

  if (!userProfile || !userProfile.user) {
    return null;
  }

  const isOwner = currentUser?.username === username;

  const filteredGames = games.filter((g) => {
    const matchesSearch = g.game.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = filter === "all" || g.status === filter;
    return matchesSearch && matchesStatus;
  });

  const sortedGames = sortGames(filteredGames);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col items-center gap-4 border-b border-border pb-8 sm:flex-row sm:items-start sm:gap-6">
        <Avatar user={userProfile.user} size="lg" />
        <div className="flex flex-1 flex-col items-center sm:items-start">
          <h1 className="text-3xl font-bold text-ink">
            {userProfile.user.displayName}
          </h1>
          <p className="text-sm text-ink-muted">@{userProfile.user.username}</p>
          <p className="mt-2 text-sm text-ink-muted">
            {games.length} games tracked
          </p>
        </div>

        {isOwner && (
          <Link to="/settings">
            <Button variant="outline">Edit Profile</Button>
          </Link>
        )}
      </div>

      <div className="mb-6 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:gap-2">
        <div className="w-full sm:w-64">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search their library..."
            showClear={searchQuery.length > 0}
            onClear={() => setSearchQuery("")}
          />
        </div>
        <FilterSelect
          value={filter}
          onValueChange={(val) => setFilter(val as Status | "all")}
          options={[
            { label: "All Games", value: "all" },
            ...Array.from(new Set(games.map((g) => g.status))).map((s) => ({
              label: s.charAt(0).toUpperCase() + s.slice(1),
              value: s,
            })),
          ]}
          placeholder="All Games"
        />
      </div>

      {sortedGames.length === 0 ? (
        <p className="text-center text-ink-muted">
          No games found matching your criteria.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {sortedGames.map((g, i) => (
            <GameCard
              key={g._id}
              game={g}
              index={i}
              isOwner={currentUser?.id === g.userId.id}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
