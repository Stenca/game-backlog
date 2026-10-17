import type { Status } from "../types/Game";

export const STATUS_ORDER: Record<Status, number> = {
  playing: 0,
  backlog: 1,
  wishlist: 2,
  completed: 3,
  dropped: 4,
};

export const STATUS_COLOR: Record<Status, string> = {
  backlog: "bg-ink-dim",
  playing: "bg-accent",
  completed: "bg-green-700",
  dropped: "bg-red-700",
  wishlist: "bg-purple-700",
};
