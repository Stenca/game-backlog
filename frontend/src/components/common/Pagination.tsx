import { Button } from "@/components/ui/button";

type Props = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: Props) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-center gap-1">
      {Array.from({ length: totalPages }).map((_, i) => {
        const pageNumber = i + 1;
        const isActive = currentPage === pageNumber;

        return (
          <Button
            key={pageNumber}
            variant={isActive ? "default" : "ghost"}
            size="sm"
            onClick={() => onPageChange(pageNumber)}
            className={`h-8 w-8 p-0 ${isActive ? "text-bg" : "text-ink-muted"}`}
          >
            {pageNumber}
          </Button>
        );
      })}
    </div>
  );
}
