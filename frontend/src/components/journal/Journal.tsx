import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api";
import type { JournalEntry } from "@/types/Game";
import JournalAddForm from "@/components/journal/JournalAddForm";
import JournalEntryItem from "@/components/journal/JournalEntryItem";
import JournalSkeleton from "@/components/journal/JournalSkeleton";
import ErrorState from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/utils/queryKeys";

type Props = {
  gameId: string;
  userGameId: string;
  isOwner: boolean;
};

const ENTRIES_PER_PAGE = 5;

export default function Journal({ gameId, userGameId, isOwner }: Props) {
  const {
    data: entries = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.journal.userGame(userGameId),
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

      {isOwner && <JournalAddForm gameId={gameId} />}

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
          {isOwner
            ? "No entries yet. Write your first one above!"
            : "This user hasn't written any journal entries for this game yet."}
        </p>
      ) : (
        <>
          <ul className="mt-6 flex flex-col gap-4">
            {visibleEntries.map((entry) => (
              <JournalEntryItem
                key={entry._id}
                entry={entry}
                isOwner={isOwner}
              />
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
