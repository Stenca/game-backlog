import { Skeleton } from "@/components/ui/skeleton";

export default function GameCardSkeleton() {
  return (
    <div className="flex flex-col gap-1">
      <Skeleton className="aspect-3/4 w-full rounded" />
      <Skeleton className="mt-1 h-3 w-3/4 rounded" />
    </div>
  );
}
