import { create } from "zustand";
import { apiFetch } from "../api";
import type { JournalEntry } from "../types/Game";

type JournalStore = {
  entries: JournalEntry[];
  editingId: string | null;
  loading: boolean;
  error: string;
  load: (userGameId: string) => Promise<void>;
  setEditingId: (id: string | null) => void;
  addEntry: (entry: JournalEntry) => void;
  updateEntry: (entry: JournalEntry) => void;
  removeEntry: (id: string) => void;
};

export const useJournalStore = create<JournalStore>((set) => ({
  entries: [],
  editingId: null,
  loading: false,
  error: "",

  load: async (userGameId: string) => {
    set({ loading: true, error: "", entries: [] });
    try {
      const data = await apiFetch<JournalEntry[]>(
        `/api/journal/game/${userGameId}`,
      );
      set({ entries: data });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load" });
    } finally {
      set({ loading: false });
    }
  },

  setEditingId: (id) => set({ editingId: id }),

  addEntry: (entry) => set((state) => ({ entries: [entry, ...state.entries] })),

  updateEntry: (updated) =>
    set((state) => ({
      entries: state.entries.map((e) => (e._id === updated._id ? updated : e)),
      editingId: null,
    })),

  removeEntry: (id) =>
    set((state) => ({
      entries: state.entries.filter((e) => e._id !== id),
      editingId: state.editingId === id ? null : state.editingId,
    })),
}));
