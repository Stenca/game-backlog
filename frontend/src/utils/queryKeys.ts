import { queryClient } from "@/main";

export const queryKeys = {
  user: {
    all: ["user"] as const,
    profile: (username: string) => ["user", username] as const,
  },

  games: {
    all: ["games"] as const,
    user: (username: string) => ["games", username] as const,
  },

  game: {
    detail: (id: string) => ["game", id] as const,
  },

  journal: {
    all: ["journal"] as const,
    userGame: (userGameId: string) => ["journal", userGameId] as const,
  },

  gameSearch: {
    search: (query: string) => ["gameSearch", query] as const,
  },

  feed: {
    all: ["feed"] as const,
  },

  activity: {
    all: ["activity"] as const,
    user: (username: string) => ["activity", username] as const,
  },

  comments: {
    all: ["comments"] as const,
    entry: (entryId: string) => ["comments", entryId] as const,
  },

  likes: {
    all: ["likes"] as const,
  },
};

export const invalidate = {
  games: () => queryClient.invalidateQueries({ queryKey: queryKeys.games.all }),

  journal: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.journal.all }),

  feed: () => queryClient.invalidateQueries({ queryKey: queryKeys.feed.all }),

  activity: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.activity.all }),

  comments: (entryId?: string) =>
    queryClient.invalidateQueries({
      queryKey: entryId
        ? queryKeys.comments.entry(entryId)
        : queryKeys.comments.all,
    }),

  likes: () => queryClient.invalidateQueries({ queryKey: queryKeys.likes.all }),
};
