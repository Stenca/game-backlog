import { Skeleton } from "@/components/ui/skeleton";

export default function JournalSkeleton() {
  return (
    <ul className="mt-6 flex flex-col gap-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <li key={i} className="rounded border border-border bg-surface p-4">
          <Skeleton className="mb-3 h-3 w-32" />

          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          <div className="mt-3 flex gap-2">
            <Skeleton className="h-16 w-24 rounded" />
            <Skeleton className="h-16 w-24 rounded" />
          </div>
        </li>
      ))}
    </ul>
  );
}
