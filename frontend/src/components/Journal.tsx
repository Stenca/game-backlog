import { useJournalStore } from "../stores/journalStore";
import JournalAddForm from "./JournalAddForm";
import JournalEntryItem from "./JournalEntryItem";
import Loading from "@/components/Loading";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api";
import type { JournalEntry } from "@/types/Game";

type Props = {
  gameId: string;
  userGameId: string;
};

export default function Journal({ gameId, userGameId }: Props) {
  const editingId = useJournalStore((s) => s.editingId);

  const {
    data: entries = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["journal", gameId],
    queryFn: () => apiFetch<JournalEntry[]>(`/api/journal/game/${userGameId}`),
    enabled: !!userGameId,
  });

  if (isLoading) return <Loading text="Loading journal..." />;
  if (error)
    return (
      <p className="text-sm text-destructive">{(error as Error).message}</p>
    );

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
