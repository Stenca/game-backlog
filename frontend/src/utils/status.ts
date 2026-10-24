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
  playing: "bg-brand",
  completed: "bg-green-700",
  dropped: "bg-red-700",
  wishlist: "bg-purple-700",
};

export function getStatusColor(status: Status): string {
  return STATUS_COLOR[status] ?? "bg-ink-dim";
}

import type { UserGame } from "../types/Game";

export function sortGames(games: UserGame[]): UserGame[] {
  return [...games].sort((a, b) => {
    const diff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    return diff !== 0 ? diff : a.game.title.localeCompare(b.game.title);
  });
}
