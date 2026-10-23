import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import type { JournalEntry } from "../types/Game";
import JournalAddForm from "./JournalAddForm";
import JournalEntryItem from "./JournalEntryItem";

type Props = { gameId: string; userGameId: string };

export default function Journal({ gameId, userGameId }: Props) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userGameId) return;

    setLoading(true);
    apiFetch<JournalEntry[]>(`/api/journal/game/${userGameId}`)
      .then(setEntries)
      .catch((err) => console.error("Journal fetch error:", err))
      .finally(() => setLoading(false));
  }, [userGameId]);

  function handleEntryAdded(entry: JournalEntry) {
    setEntries([entry, ...entries]);
  }

  function handleEntryUpdated(updated: JournalEntry) {
    setEntries(entries.map((e) => (e._id === updated._id ? updated : e)));
  }

  function handleEntryDeleted(id: string) {
    setEntries(entries.filter((e) => e._id !== id));
  }

  if (loading) return <p>Loading...</p>;

  return (
    <section className="mt-10 border-t border-border pt-8">
      <h2 className="mb-4 text-xl font-semibold text-ink">Journal</h2>

      <JournalAddForm gameId={gameId} onEntryAdded={handleEntryAdded} />

      <ul className="mt-8 flex flex-col gap-4">
        {entries.map((entry) => (
          <JournalEntryItem
            key={entry._id}
            entry={entry}
            onUpdate={handleEntryUpdated}
            onDelete={handleEntryDeleted}
          />
        ))}
      </ul>
    </section>
  );
}
