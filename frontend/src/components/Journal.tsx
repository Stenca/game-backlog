import { useEffect } from "react";
import { useJournalStore } from "../stores/journalStore";
import JournalAddForm from "./JournalAddForm";
import JournalEntryItem from "./JournalEntryItem";
import Loading from "@/components/Loading";

type Props = {
  gameId: string;
  userGameId: string;
};

export default function Journal({ gameId, userGameId }: Props) {
  const entries = useJournalStore((s) => s.entries);
  const loading = useJournalStore((s) => s.loading);
  const load = useJournalStore((s) => s.load);
  const editingId = useJournalStore((s) => s.editingId);

  useEffect(() => {
    if (userGameId) load(userGameId);
  }, [userGameId, load]);

  if (loading) return <Loading text="Loading journal..." />;

  return (
    <section className="mt-10 border-t border-border pt-8">
      <h2 className="mb-4 text-xl font-semibold text-ink">Journal</h2>

      <JournalAddForm key={editingId || "new"} gameId={gameId} />

      {entries.length === 0 ? (
        <p className="mt-8 text-center text-sm text-ink-muted">
          No entries yet. Write your first note above.
        </p>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {entries.map((entry) => (
            <JournalEntryItem key={entry._id} entry={entry} />
          ))}
        </ul>
      )}
    </section>
  );
}
