import { Skeleton } from "@/components/ui/skeleton";

export default function GameDetailSkeleton() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <Skeleton className="mb-6 h-4 w-24" />

      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-[224px_1fr]">
        <div className="flex flex-col gap-4">
          <Skeleton className="aspect-3/4 w-full rounded" />
          <Skeleton className="h-32 w-full rounded" />
        </div>

        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/2" />

          <div className="mt-2 flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-32 w-full rounded" />
          </div>
        </div>
      </div>
    </main>
  );
}
