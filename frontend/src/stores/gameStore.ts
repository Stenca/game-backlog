import { create } from "zustand";
import { apiFetch } from "../api";
import { queryClient } from "../main";
import type { Status, UserGame } from "../types/Game";

type AddGamePayload = {
  rawgId: number;
  platform: { name: string; slug?: string; releasedAt?: string };
  status: Status;
  rating?: number;
  notes?: string;
};

type UpdateGamePayload = {
  status?: Status;
  rating?: number;
  review?: string;
  notes?: string;
  platform?: { name: string; slug?: string; releasedAt?: string };
};

type GameStore = {
  add: (payload: AddGamePayload) => Promise<boolean>;
  updateGame: (id: string, payload: UpdateGamePayload) => Promise<boolean>;
  updateStatus: (id: string, status: Status) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
};

export const useGameStore = create<GameStore>((_, get) => ({
  add: async (payload) => {
    try {
      const created = await apiFetch<UserGame>("/api/games", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      queryClient.setQueryData<UserGame[]>(["games"], (old = []) => [
        created,
        ...old,
      ]);

      return true;
    } catch (err) {
      console.error("[gameStore/add]", err);
      return false;
    }
  },

  updateGame: async (id, payload) => {
    try {
      const updated = await apiFetch<UserGame>(`/api/games/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      queryClient.setQueryData<UserGame[]>(["games"], (old = []) =>
        old.map((g) => (g._id === id ? updated : g)),
      );

      queryClient.setQueryData<UserGame>(["game", id], updated);

      return true;
    } catch (err) {
      console.error("[gameStore/updateGame]", err);
      return false;
    }
  },

  updateStatus: async (id, status) => {
    return get().updateGame(id, { status });
  },

  remove: async (id) => {
    try {
      await apiFetch(`/api/games/${id}`, { method: "DELETE" });

      queryClient.setQueryData<UserGame[]>(["games"], (old = []) =>
        old.filter((g) => g._id !== id),
      );

      return true;
    } catch (err) {
      console.error("[gameStore/remove]", err);
      return false;
    }
  },
}));
