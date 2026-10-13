export type Game = {
  _id: string;
  title: string;
  platform: string;
  status: "backlog" | "playing" | "completed" | "dropped" | "wishlist";
  rating?: number;
  notes?: string;
  coverUrl?: string;
  createdAt: string;
  updatedAt: string;
};
