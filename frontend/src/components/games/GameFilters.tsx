import { SearchBar } from "@/components/common/SearchBar";
import FilterSelect from "@/components/games/FilterSelect";
import { STATUSES, type Status, type UserGame } from "@/types/Game";

type Props = {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: Status | "all";
  setStatusFilter: (val: Status | "all") => void;
  platformFilter: string;
  setPlatformFilter: (val: string) => void;
  games: UserGame[];
  isOwner?: boolean;
};

export default function GameFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  platformFilter,
  setPlatformFilter,
  games,
  isOwner = true,
}: Props) {
  const uniquePlatforms = Array.from(
    new Set(games.map((g) => g.platform.name)),
  ).sort();

  return (
    <div className="mb-6 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:gap-2">
      <div className="order-2 w-full sm:order-1 sm:w-64">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={`Search ${isOwner ? "your" : "their"} library...`}
          showClear={searchQuery.length > 0}
          onClear={() => setSearchQuery("")}
        />
      </div>

      <div className="order-1 flex w-full gap-2 sm:order-2 sm:w-auto">
        <div className="flex-1 sm:flex-none">
          <FilterSelect
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as Status | "all")}
            options={[
              { label: "All Games", value: "all" },
              ...STATUSES.map((s) => ({
                label: s.charAt(0).toUpperCase() + s.slice(1),
                value: s,
              })),
            ]}
            placeholder="All Games"
          />
        </div>
        <div className="flex-1 sm:flex-none">
          <FilterSelect
            value={platformFilter}
            onValueChange={(val) => setPlatformFilter(val ?? "all")}
            options={[
              { label: "All Platforms", value: "all" },
              ...uniquePlatforms.map((p) => ({ label: p, value: p })),
            ]}
            placeholder="All Platforms"
          />
        </div>
      </div>
    </div>
  );
}
