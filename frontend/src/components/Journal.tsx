// In Journal.tsx
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../api";
import type { JournalEntry } from "../types/Game";
import Loading from "@/components/Loading";
import JournalAddForm from "./JournalAddForm";
import JournalEntryItem from "./JournalEntryItem";
import ErrorState from "./ErrorState";

type Props = {
  gameId: string;
  userGameId: string;
};

export default function Journal({ gameId, userGameId }: Props) {
  const {
    data: entries = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["journal", userGameId],
    queryFn: () => apiFetch<JournalEntry[]>(`/api/journal/game/${userGameId}`),
  });

  return (
    <div className="mt-12">
      <h2 className="mb-4 text-xl font-bold tracking-tight text-ink">
        Journal
      </h2>

      <JournalAddForm gameId={gameId} />

      {isLoading ? (
        <Loading text="Loading journal..." />
      ) : error ? (
        <div className="mt-6">
          <ErrorState
            title="Failed to load journal"
            message={error.message}
            onRetry={() => refetch()}
          />
        </div>
      ) : entries.length === 0 ? (
        <p className="mt-6 text-sm text-ink-muted">
          No entries yet. Write your first one above!
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {entries.map((entry) => (
            <JournalEntryItem key={entry._id} entry={entry} />
          ))}
        </ul>
      )}
    </div>
  );
}
