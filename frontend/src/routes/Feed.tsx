import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiFetch } from "@/api";
import Avatar from "@/components/common/Avatar";
import Loading from "@/components/common/Loading";
import ErrorState from "@/components/common/ErrorState";
import { formatRelative } from "@/utils/date";

export default function Feed() {
  const {
    data: feed = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["feed"],
    queryFn: () => apiFetch<any[]>("/api/feed"),
  });

  if (isLoading) return <Loading text="Loading community feed..." fullScreen />;
  if (error)
    return <ErrorState title="Failed to load feed" message={error.message} />;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-ink">
        Community Feed
      </h1>

      <div className="flex flex-col gap-4">
        {feed.length === 0 && (
          <p className="text-center text-ink-muted">
            No activity yet. Be the first!
          </p>
        )}

        {feed.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <Link
                to={`/u/${item.user.username}`}
                className="flex items-center gap-3 hover:opacity-80"
              >
                <Avatar user={item.user} size="sm" />
                <span className="text-sm font-medium text-ink">
                  {item.user.displayName}
                </span>
              </Link>
              <span className="text-xs text-ink-muted">
                {formatRelative(item.createdAt)}
              </span>
            </div>

            <p className="text-sm text-ink-muted">{item.content}</p>

            {item.body && (
              <div className="rounded-lg bg-surface-2 p-3 text-sm text-ink border-l-2 border-brand">
                "{item.body}"
              </div>
            )}

            {item.game && (
              <Link
                to={`/u/${item.user.username}?tab=games`}
                className="mt-2 flex items-center gap-3 rounded-lg border border-border bg-surface-2 p-2 transition-colors hover:border-brand/50"
              >
                {item.game.coverUrl ? (
                  <img
                    src={item.game.coverUrl}
                    alt=""
                    className="h-12 w-9 rounded object-cover"
                  />
                ) : (
                  <div className="h-12 w-9 rounded bg-border" />
                )}
                <span className="text-sm font-medium text-ink">
                  {item.game.title}
                </span>
              </Link>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
