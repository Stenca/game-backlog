import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react"; // Add this import
import { apiFetch } from "../api";
import type { SearchResult } from "../types/Game";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchBar } from "./SearchBar";

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
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        if (wrapperRef.current) {
          const input = wrapperRef.current.querySelector("input");
          input?.blur();
        }
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

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
      <SearchBar
        value={query}
        onChange={(value) => {
          setQuery(value);
          setOpen(true);
          if (selected) onClear();
        }}
        onFocus={() => {
          if (!selected && results.length > 0) {
            setOpen(true);
          }
        }}
        placeholder="Search a game to add..."
        isFetching={isFetching}
        selected={!!selected}
        onClear={handleClear}
      />

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 mt-1 w-full overflow-hidden rounded border border-border bg-surface/90 backdrop-blur-md shadow-lg origin-top"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
