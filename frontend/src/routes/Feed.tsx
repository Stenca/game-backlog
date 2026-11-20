import ActivityFeed from "@/components/common/ActivityFeed";

export default function Feed() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-ink">
        Community Feed
      </h1>
      <ActivityFeed />
    </main>
  );
}
