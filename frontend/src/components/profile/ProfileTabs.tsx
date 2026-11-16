import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type UserGame, type Status } from "@/types/Game";
import GameCard from "@/components/games/GameCard";
import { sortGames } from "@/utils/status";
import SettingsForm from "./SettingsForm";
import { Button } from "@/components/ui/button";
import GameFilters from "@/components/games/GameFilters";

type Props = {
  games: UserGame[];
  isOwner: boolean;
};

function ProfileTab({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return (
    <TabsTrigger
      value={value}
      className="flex h-full items-center justify-center rounded-md border-none bg-transparent px-6 text-sm font-medium text-ink-muted transition-all hover:bg-transparent focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 data-active:bg-transparent data-active:text-brand! data-active:shadow-none"
    >
      {children}
    </TabsTrigger>
  );
}

export default function ProfileTabs({ games, isOwner }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(24);

  const filteredGames = games.filter((g) => {
    const matchesSearch = g.game.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || g.status === statusFilter;
    const matchesPlatform =
      platformFilter === "all" || g.platform.name === platformFilter;
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const sortedGames = sortGames(filteredGames);
  const visibleGames = sortedGames.slice(0, visibleCount);

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="mb-6 grid h-12 w-full grid-cols-[1fr_auto_1fr] items-center rounded-lg border border-border bg-surface-2 p-1">
        <div />

        <div className="flex h-full items-center gap-1">
          <ProfileTab value="overview">Overview</ProfileTab>
          <ProfileTab value="games">Games</ProfileTab>
          {isOwner && <ProfileTab value="settings">Edit Settings</ProfileTab>}
        </div>

        <div />
      </TabsList>

      <TabsContent value="overview">
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-xl font-bold text-ink">Profile Stats</h2>
          <p className="mt-2 text-sm text-ink-muted">
            This is where your stats will go (Total games, Completed, etc).
          </p>
        </div>
      </TabsContent>

      <TabsContent value="games">
        <GameFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          platformFilter={platformFilter}
          setPlatformFilter={setPlatformFilter}
          games={games}
          isOwner={isOwner}
        />

        {sortedGames.length === 0 ? (
          <p className="text-center text-ink-muted">No games found.</p>
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {visibleGames.map((g, i) => (
                <GameCard key={g._id} game={g} index={i} isOwner={false} />
              ))}
            </ul>

            {visibleCount < sortedGames.length && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setVisibleCount((prev) => prev + 24)}
                >
                  Load More Games
                </Button>
              </div>
            )}
          </>
        )}
      </TabsContent>

      {isOwner && (
        <TabsContent value="settings">
          <SettingsForm />
        </TabsContent>
      )}
    </Tabs>
  );
}
