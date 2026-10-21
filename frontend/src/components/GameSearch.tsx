import { useEffect, useRef, useState } from "react";
import type { SearchResult } from "../types/Game";
import { apiFetch } from "../api";

type Props = {
  onSelect: (result: SearchResult) => void;
  selected: SearchResult | null;
  onClear: () => void;
};

export default function GameSearch({ onSelect, selected, onClear }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);
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
    if (selected) return;
    clearTimeout(timeoutRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    timeoutRef.current = window.setTimeout(async () => {
      try {
        const data = await apiFetch<SearchResult[]>(
          `/api/games/search?q=${encodeURIComponent(trimmed)}`,
        );
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutRef.current);
  }, [query, selected]);

  function handlePick(result: SearchResult) {
    setQuery(result.title);
    setOpen(false);
    setResults([]);
    onSelect(result);
  }

  function handleClear() {
    setQuery("");
    setOpen(false);
    setResults([]);
    onClear();
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selected) onClear();
          }}
          onFocus={() => {
            if (!selected && results.length > 0) {
              setOpen(true);
            }
          }}
          placeholder="Search a game to add..."
          disabled={!!selected}
          className="w-full rounded border border-border bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-dim transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
        />
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
        <ul className="absolute z-10 mt-1 max-h-96 w-full overflow-auto rounded border border-border bg-surface shadow-lg">
          {results.map((r) => (
            <li
              key={r.rawgId}
              onClick={() => handlePick(r)}
              className="flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors hover:bg-surface-2"
            >
              {r.coverUrl && (
                <img
                  src={r.coverUrl}
                  alt=""
                  className="h-16 w-12 shrink-0 rounded object-cover"
                />
              )}
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-ink">
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
      )}

      {loading && !open && (
        <p className="mt-1 text-xs text-ink-dim">Searching…</p>
      )}
    </div>
  );
}
