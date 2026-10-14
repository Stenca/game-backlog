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
          placeholder="Search a game..."
          disabled={!!selected}
          className="flex-1"
        />
        {selected && (
          <button type="button" onClick={handleClear}>
            ×
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-80 w-full overflow-auto rounded border bg-white shadow">
          {results.map((r) => (
            <li
              key={r.rawgId}
              onClick={() => handlePick(r)}
              className="flex cursor-pointer items-center gap-3 p-2 hover:bg-gray-100"
            >
              {r.coverUrl && (
                <img
                  src={r.coverUrl}
                  alt=""
                  className="h-12 w-9 rounded object-cover"
                />
              )}
              <div className="flex flex-col">
                <span className="font-medium">{r.title}</span>
                {r.released && (
                  <span className="text-xs text-gray-500">
                    {r.released.slice(0, 4)}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {loading && !open && (
        <p className="mt-1 text-xs text-gray-500">Searching…</p>
      )}
    </div>
  );
}
