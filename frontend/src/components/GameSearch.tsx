import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../api";
import { Spinner } from "@/components/ui/spinner";
import type { SearchResult } from "../types/Game";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
  onSelect: (result: SearchResult) => void;
  selected: SearchResult | null;
  onClear: () => void;
};

export default function GameSearch({ onSelect, selected, onClear }: Props) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["gameSearch", debouncedQuery],
    queryFn: () =>
      apiFetch<SearchResult[]>(
        `/api/games/search?q=${encodeURIComponent(debouncedQuery)}`,
      ),
    enabled: debouncedQuery.trim().length >= 2 && !selected,

    placeholderData: (previousData) => previousData,
  });

  function handlePick(result: SearchResult) {
    setQuery(result.title);
    setOpen(false);
    onSelect(result);
  }

  function handleClear() {
    setQuery("");
    setDebouncedQuery("");
    setOpen(false);
    onClear();
  }

  return (
    <div ref={wrapperRef} className="relative z-30">
      <div className="relative flex gap-2">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (selected) onClear();
          }}
          onFocus={() => {
            if (!selected && results.length > 0) {
              setOpen(true);
            }
          }}
          placeholder="Search a game to add..."
          disabled={!!selected}
          className="w-full rounded border border-border bg-surface-2/60 px-3 py-2 pr-10 text-sm text-ink placeholder:text-ink-dim transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-60"
        />

        {isFetching && !selected && (
          <div className="absolute top-2.5 right-3">
            <Spinner className="h-4 w-4 text-ink-muted" />
          </div>
        )}

        {selected && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded border border-border px-3 text-sm text-ink-muted transition-colors hover:border-ink-muted hover:text-ink"
          >
            ×
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded border border-border bg-surface shadow-lg">
          <ScrollArea className="h-100">
            <ul>
              {results.map((r) => (
                <li
                  key={r.rawgId}
                  onClick={() => handlePick(r)}
                  className="group flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors hover:bg-surface-2"
                >
                  {r.coverUrl && (
                    <img
                      src={r.coverUrl}
                      alt=""
                      className="h-16 w-12 shrink-0 rounded object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink group-hover:text-brand">
                      {r.title}
                    </div>
                    {r.released && (
                      <div className="text-xs text-ink-muted">
                        {r.released.slice(0, 4)}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
