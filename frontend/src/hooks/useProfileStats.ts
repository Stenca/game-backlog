import { useMemo } from "react";
import { type UserGame } from "@/types/Game";

// Export the type so components can use it
export type UserProfileStats = ReturnType<typeof useProfileStats>;

export function useProfileStats(games: UserGame[]) {
  return useMemo(() => {
    if (!games || games.length === 0) {
      return {
        totalGames: 0,
        completedCount: 0,
        backlogCount: 0,
        droppedCount: 0,
        wishlistCount: 0,
        playingGames: [],
        favoritePlatform: null,
        favoriteGenre: null,
      };
    }

    const completedCount = games.filter((g) => g.status === "completed").length;
    const backlogCount = games.filter((g) => g.status === "backlog").length;
    const droppedCount = games.filter((g) => g.status === "dropped").length;
    const wishlistCount = games.filter((g) => g.status === "wishlist").length;
    const playingGames = games.filter((g) => g.status === "playing");

    const platformCounts = games.reduce(
      (acc, g) => {
        if (g.platform?.name) {
          acc[g.platform.name] = (acc[g.platform.name] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    const favoritePlatform =
      Object.keys(platformCounts).sort(
        (a, b) => platformCounts[b] - platformCounts[a],
      )[0] || null;

    const genreCounts = games.reduce(
      (acc, g) => {
        g.game.genres?.forEach((genre) => {
          acc[genre] = (acc[genre] || 0) + 1;
        });
        return acc;
      },
      {} as Record<string, number>,
    );

    const favoriteGenre =
      Object.keys(genreCounts).sort(
        (a, b) => genreCounts[b] - genreCounts[a],
      )[0] || null;

    return {
      totalGames: games.length,
      completedCount,
      backlogCount,
      droppedCount,
      wishlistCount,
      playingGames,
      favoritePlatform,
      favoriteGenre,
    };
  }, [games]);
}
