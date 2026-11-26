import { create } from "zustand";
import { apiFetch } from "../api";
import { useAuthStore } from "@/stores/authStore";
import { invalidate } from "@/utils/queryKeys";

type JournalStore = {
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  addEntry: (gameId: string, formData: FormData) => Promise<boolean>;
  updateEntry: (
    id: string,
    gameId: string,
    formData: FormData,
  ) => Promise<boolean>;
  removeEntry: (id: string, gameId: string) => Promise<boolean>;
};

export const useJournalStore = create<JournalStore>((set) => ({
  editingId: null,

  setEditingId: (id) => set({ editingId: id }),

  addEntry: async (_gameId, formData) => {
    try {
      const token = useAuthStore.getState().token;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/journal`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to add entry");

      await Promise.all([
        invalidate.journal(),
        invalidate.feed(),
        invalidate.activity(),
      ]);

      set({ editingId: null });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  updateEntry: async (id, _gameId, formData) => {
    try {
      const token = useAuthStore.getState().token;

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/journal/${id}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      if (!res.ok) throw new Error("Failed to update entry");

      await Promise.all([
        invalidate.journal(),
        invalidate.feed(),
        invalidate.activity(),
      ]);

      set({ editingId: null });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  removeEntry: async (id, _gameId) => {
    try {
      await apiFetch(`/api/journal/${id}`, { method: "DELETE" });

      await Promise.all([
        invalidate.journal(),
        invalidate.feed(),
        invalidate.activity(),
        invalidate.comments(),
      ]);

      set({ editingId: null });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },
}));
