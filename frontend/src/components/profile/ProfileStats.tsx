import PlatformBadge from "@/components/games/PlatformBadge";
import { type UserProfileStats } from "@/hooks/useProfileStats";

type Props = {
  stats: UserProfileStats;
};

export default function ProfileStats({ stats }: Props) {
  const statItems = [
    { label: "tracked", value: stats.totalGames },
    { label: "completed", value: stats.completedCount },
    { label: "backlog", value: stats.backlogCount },
    { label: "dropped", value: stats.droppedCount },
    { label: "wishlist", value: stats.wishlistCount },
  ];

  return (
    <div className="flex flex-col items-center sm:items-start gap-4">
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-ink-muted sm:justify-start">
        {statItems.map((stat, index, array) => (
          <div key={stat.label} className="flex items-center gap-3">
            <span>
              <strong className="font-medium text-ink">{stat.value}</strong>{" "}
              {stat.label}
            </span>
            {index < array.length - 1 && (
              <span className="h-1 w-1 rounded-full bg-border" />
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 text-sm sm:justify-start">
        {stats.favoritePlatform && (
          <div className="flex items-center gap-2">
            <span className="text-ink-muted">Top Platform:</span>
            <PlatformBadge
              platform={{ name: stats.favoritePlatform }}
              size="sm"
            />
          </div>
        )}
        {stats.favoriteGenre && (
          <div className="flex items-center gap-2">
            <span className="text-ink-muted">Top Genre:</span>
            <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-ink">
              {stats.favoriteGenre}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
