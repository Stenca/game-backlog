import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api";
import Loading from "@/components/common/Loading";
import ActivityItem from "./ActivityItem";

type Props = {
  username?: string;
};

export default function ActivityFeed({ username }: Props) {
  const isGlobal = !username;
  const endpoint = isGlobal ? "/api/feed" : `/api/users/${username}/activity`;
  const queryKey = isGlobal ? ["feed"] : ["activity", username];

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
    <div className="grid grid-cols-1 auto-rows-fr gap-4 py-4 md:grid-cols-2">
      {activity.map((item) => (
        <ActivityItem key={item.id} item={item} showUser={isGlobal} />
      ))}
    </div>
  );
}
