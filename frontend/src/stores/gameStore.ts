import { create } from "zustand";
import type { Status, UserGame } from "../types/Game";
import { apiFetch } from "../api";

const STATUS_ORDER: Record<Status, number> = {
  playing: 0,
  backlog: 1,
  wishlist: 2,
  completed: 3,
  dropped: 4,
};

function sortGames(games: UserGame[]): UserGame[] {
  return [...games].sort((a, b) => {
    const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    return statusDiff !== 0
      ? statusDiff
      : a.game.title.localeCompare(b.game.title);
  });
}

type GameStore = {
  games: UserGame[];
  loading: boolean;
  error: string;
  load: () => Promise<void>;
  add: (payload: AddGamePayload) => Promise<boolean>;
  updateStatus: (id: string, status: Status) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
};

type AddGamePayload = {
  rawgId: number;
  platform: { name: string; slug?: string; releasedAt?: string };
  status: Status;
  rating?: number;
  notes?: string;
};

export const useGameStore = create<GameStore>((set, get) => ({
  games: [],
  loading: false,
  error: "",

  load: async () => {
    set({ loading: true, error: "" });
    try {
      const data = await apiFetch<UserGame[]>("/api/games");
      set({ games: sortGames(data), loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load",
        loading: false,
      });
    }
  },

  add: async (payload) => {
    set({ error: "" });
    try {
      const created = await apiFetch<UserGame>("/api/games", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      set((state) => ({
        games: sortGames([...state.games, created]),
      }));
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to add" });
      return false;
    }
  },

  updateStatus: async (id, status) => {
    try {
      const updated = await apiFetch<UserGame>(`/api/games/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      set((state) => ({
        games: sortGames(state.games.map((g) => (g._id === id ? updated : g))),
      }));
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to update status",
      });
      return false;
    }
  },

  remove: async (id) => {
    try {
      await apiFetch(`/api/games/${id}`, { method: "DELETE" });
      set((state) => ({
        games: state.games.filter((g) => g._id !== id),
      }));
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to delete game",
      });
      return false;
    }
  },
}));
