export const STATUSES = [
  "backlog",
  "playing",
  "completed",
  "dropped",
  "wishlist",
] as const;

export type Status = (typeof STATUSES)[number];

export type Platform = {
  name: string;
  slug?: string;
  releasedAt?: string;
};

export type GameCatalog = {
  _id: string;
  title: string;
  titleLower: string;
  coverUrl?: string;
  releaseDate?: string;
  playtime?: number;
  genres?: string[];
  developers?: string[];
  rawgId?: number;
  availablePlatforms?: Platform[];
};

export type UserGame = {
  _id: string;
  status: Status;
  platform: Platform;
  rating?: number;
  notes?: string;
  game: GameCatalog;
  createdAt: string;
  updatedAt: string;
};

export type SearchResult = {
  rawgId: number;
  title: string;
  coverUrl?: string;
  released?: string;
};

export type GameDetails = {
  rawgId: number;
  title: string;
  coverUrl?: string;
  releaseDate?: string;
  playtime?: number;
  genres: string[];
  availablePlatforms: Platform[];
};

export type JournalEntry = {
  _id: string;
  userId: string;
  gameId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};
