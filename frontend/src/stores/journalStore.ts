import { create } from "zustand";
import { apiFetch } from "../api";
import { queryClient } from "../main";
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

  addEntry: async (gameId, formData) => {
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/journal`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to add entry");

      await queryClient.invalidateQueries({ queryKey: ["journal"] });
      set({ editingId: null });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  updateEntry: async (id, gameId, formData) => {
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

      await queryClient.invalidateQueries({ queryKey: ["journal"] });
      set({ editingId: null });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  removeEntry: async (id, gameId) => {
    try {
      await apiFetch(`/api/journal/${id}`, { method: "DELETE" });

      await queryClient.invalidateQueries({ queryKey: ["journal"] });
      set({ editingId: null });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },
}));
