export const PLATFORMS = [
  "PC",
  "PlayStation 5",
  "PlayStation 4",
  "Xbox Series X|S",
  "Xbox One",
  "Nintendo Switch",
  "Mobile",
  "Other",
] as const;

export type Platform = (typeof PLATFORMS)[number];

export type Game = {
  _id: string;
  title: string;
  platform: Platform;
  status: "backlog" | "playing" | "completed" | "dropped" | "wishlist";
  rating?: number;
  notes?: string;
  coverUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export const STATUSES = [
  "backlog",
  "playing",
  "completed",
  "dropped",
  "wishlist",
] as const;

export type Status = (typeof STATUSES)[number];
