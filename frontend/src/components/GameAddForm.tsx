import { useState } from "react";
import { apiFetch } from "../api";
import { useGameStore } from "../stores/gameStore";
import GameSearch from "./GameSearch";
import FilterSelect from "./FilterSelect";
import { Button } from "@/components/ui/button";
import {
  STATUSES,
  type GameDetails,
  type Platform,
  type SearchResult,
  type Status,
} from "../types/Game";

export default function GameAddForm() {
  const add = useGameStore((s) => s.add);

  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [details, setDetails] = useState<GameDetails | null>(null);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [status, setStatus] = useState<Status>("backlog");
  const [searchKey, setSearchKey] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  async function handleSelect(result: SearchResult) {
    setSelected(result);
    setDetails(null);
    setPlatform(null);
    try {
      const d = await apiFetch<GameDetails>(
        `/api/games/details/${result.rawgId}`,
      );
      setDetails(d);
      setPlatform(d.availablePlatforms[0] ?? null);
    } catch (err) {
      console.error(err);
    }
  }

  function handleClearSelection() {
    setSelected(null);
    setDetails(null);
    setPlatform(null);
    setStatus("backlog");
    setSearchKey((k) => k + 1);
  }

  async function handleAdd(e: React.SubmitEvent) {
    e.preventDefault();
    if (!selected || !platform) return;

    setIsAdding(true);
    try {
      const ok = await add({
        rawgId: selected.rawgId,
        platform: {
          name: platform.name,
          slug: platform.slug,
          releasedAt: platform.releasedAt,
        },
        status,
      });
      if (ok) handleClearSelection();
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <form onSubmit={handleAdd} className="mb-8">
      <GameSearch
        key={searchKey}
        onSelect={handleSelect}
        selected={selected}
        onClear={handleClearSelection}
      />

      {details && (
        <>
          <div className="mt-4 flex gap-4 rounded border border-border bg-surface p-4">
            <img
              src={details.coverUrl}
              alt=""
              className="h-32 w-24 shrink-0 rounded object-cover"
            />
            <div className="flex-1">
              <h3 className="text-base font-semibold text-ink">
                {details.title}
              </h3>
              {details.developers && details.developers.length > 0 && (
                <p className="mt-1 text-sm text-ink-muted">
                  {details.developers.join(", ")}
                </p>
              )}
              <p className="mt-1 text-xs text-ink-muted">
                {details.releaseDate?.slice(0, 4)}
                {details.genres.length > 0 && ` · ${details.genres.join(", ")}`}
              </p>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <FilterSelect
              value={platform?.name ?? ""}
              onValueChange={(val) => {
                const p = details.availablePlatforms.find(
                  (x) => x.name === val,
                );
                setPlatform(p ?? null);
              }}
              options={details.availablePlatforms.map((p) => ({
                label: p.name,
                value: p.name,
              }))}
              placeholder="Select platform"
              className="w-45"
            />

            <FilterSelect
              value={status}
              onValueChange={(val) => setStatus(val as Status)}
              options={STATUSES.map((s) => ({
                label: s.charAt(0).toUpperCase() + s.slice(1),
                value: s,
              }))}
              placeholder="Select status"
            />

            <Button
              type="submit"
              disabled={!platform}
              isLoading={isAdding}
              className="min-w-20"
            >
              Add
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
