import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api";
import { useAuthStore } from "@/stores/authStore";
import { type UserGame } from "@/types/Game";
import Avatar from "@/components/common/Avatar";
import Loading from "@/components/common/Loading";
import ErrorState from "@/components/common/ErrorState";
import ProfileTabs from "@/components/profile/ProfileTabs";
import ProfileStats from "@/components/profile/ProfileStats";
import CurrentlyPlaying from "@/components/profile/CurrentlyPlaying";
import { useProfileStats } from "@/hooks/useProfileStats";

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const currentUser = useAuthStore((s) => s.user);

  const {
    data: userProfile,
    isLoading: userLoading,
    error: userError,
  } = useQuery({
    queryKey: ["user", username],
    queryFn: () => apiFetch<{ user: any }>(`/api/users/${username}`),
    enabled: !!username,
  });

  const { data: games = [], isLoading: gamesLoading } = useQuery({
    queryKey: ["games", username],
    queryFn: () => apiFetch<UserGame[]>(`/api/games?user=${username}`),
    enabled: !!username,
  });

  const stats = useProfileStats(games);

  if (userLoading || gamesLoading)
    return <Loading text="Loading profile..." fullScreen />;

  if (userError)
    return (
      <ErrorState
        title="User not found"
        message="This profile does not exist."
      />
    );

  if (!userProfile || !userProfile.user) return null;

  const isOwner = currentUser?.username === username;
  const displayUser = isOwner ? currentUser : userProfile.user;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-8 border-b border-border pb-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
          <Avatar user={displayUser} size="lg" />
          <div className="flex flex-1 flex-col items-center sm:items-start">
            <h1 className="text-3xl font-bold text-ink">
              {displayUser.displayName}
            </h1>
            <p className="text-sm text-ink-muted">@{displayUser.username}</p>
            <div className="mt-4 w-full">
              <ProfileStats stats={stats} />
            </div>
          </div>
        </div>

        <CurrentlyPlaying games={stats.playingGames} />
      </div>

      <ProfileTabs games={games} isOwner={isOwner} username={username!} />
    </main>
  );
}
