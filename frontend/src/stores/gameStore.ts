import { create } from "zustand";
import type { Status, UserGame } from "../types/Game";
import { apiFetch } from "../api";

type GameStore = {
  games: UserGame[];
  loading: boolean;
  error: string;
  load: () => Promise<void>;
  add: (payload: any) => Promise<void>;
  updateStatus: (id: string, status: Status) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export const useGameStore = create<GameStore>((set, get) => ({
  games: [],
  loading: false,
  error: "",

  load: async () => {
    set({ loading: true, error: "" });
    try {
      const data = await apiFetch<UserGame[]>("/api/games");
      set({ games: data, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load",
        loading: false,
      });
    }
  },

  add: async (payload) => {
    try {
      await apiFetch("/api/games", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await get().load();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to add" });
      throw err;
    }
  },

  updateStatus: async (id, status) => {
    const updated = await apiFetch<UserGame>(`/api/games/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    set({
      games: get().games.map((g) => (g._id === id ? updated : g)),
    });
  },

  remove: async (id) => {
    await apiFetch(`/api/games/${id}`, { method: "DELETE" });
    set({ games: get().games.filter((g) => g._id !== id) });
  },
}));
