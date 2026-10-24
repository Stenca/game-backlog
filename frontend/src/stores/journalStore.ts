import { create } from "zustand";
import { apiFetch } from "../api";
import { queryClient } from "../main";
import type { JournalEntry } from "../types/Game";
import { useAuthStore } from "@/stores/authStore";

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

  addEntry: async (gameId: string, formData: FormData) => {
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/journal`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to add entry");
      const created = await res.json();

      queryClient.setQueryData<JournalEntry[]>(
        ["journal", gameId],
        (old = []) => [created, ...old],
      );
      set({ editingId: null });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  updateEntry: async (id: string, gameId: string, formData: FormData) => {
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
      const updated = await res.json();

      queryClient.setQueryData<JournalEntry[]>(
        ["journal", gameId],
        (old = []) => old.map((e) => (e._id === id ? updated : e)),
      );
      set({ editingId: null });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  removeEntry: async (id: string, gameId: string) => {
    try {
      await apiFetch(`/api/journal/${id}`, { method: "DELETE" });

      queryClient.setQueryData<JournalEntry[]>(
        ["journal", gameId],
        (old = []) => old.filter((e) => e._id !== id),
      );
      set({ editingId: null });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },
}));
