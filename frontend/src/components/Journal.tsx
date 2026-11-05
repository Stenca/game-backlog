import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../api";
import type { JournalEntry } from "../types/Game";
import JournalAddForm from "./JournalAddForm";
import JournalEntryItem from "./JournalEntryItem";
import JournalSkeleton from "./JournalSkeleton";
import ErrorState from "./ErrorState";
import { Button } from "@/components/ui/button";

type Props = {
  gameId: string;
  userGameId: string;
};

const ENTRIES_PER_PAGE = 5;

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

  const [visibleCount, setVisibleCount] = useState(ENTRIES_PER_PAGE);

  useEffect(() => {
    setVisibleCount(ENTRIES_PER_PAGE);
  }, [entries.length]);

  const visibleEntries = entries.slice(0, visibleCount);

  return (
    <div className="mt-12">
      <h2 className="mb-4 text-xl font-bold tracking-tight text-ink">
        Journal
      </h2>

      <JournalAddForm gameId={gameId} />

      {isLoading ? (
        <JournalSkeleton />
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
        <>
          <ul className="mt-6 flex flex-col gap-4">
            {visibleEntries.map((entry) => (
              <JournalEntryItem key={entry._id} entry={entry} />
            ))}
          </ul>

          {visibleCount < entries.length && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={() =>
                  setVisibleCount((prev) => prev + ENTRIES_PER_PAGE)
                }
              >
                Load more...
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
