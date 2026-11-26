import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { apiFetch } from "@/api";
import Loading from "@/components/common/Loading";
import ActivityItem from "./ActivityItem";
import { queryKeys } from "@/utils/queryKeys";

type Props = {
  username?: string;
};

export default function ActivityFeed({ username }: Props) {
  const location = useLocation();

  const isGlobal = !username;
  const endpoint = isGlobal ? "/api/feed" : `/api/users/${username}/activity`;

  const queryKey = isGlobal
    ? queryKeys.feed.all
    : queryKeys.activity.user(username!);

  const returnTo = location.pathname + location.search;

  const { data: activity = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => apiFetch<any[]>(endpoint),
  });

  if (isLoading) return <Loading text="Loading activity..." />;

  if (activity.length === 0) {
    return (
      <p className="py-8 text-center text-ink-muted">No recent activity.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2 lg:grid-cols-4">
      {activity.map((item, index) => (
        <ActivityItem
          key={item.id}
          item={item}
          showUser={isGlobal}
          username={username}
          returnTo={returnTo}
          index={index}
        />
      ))}
    </div>
  );
}
