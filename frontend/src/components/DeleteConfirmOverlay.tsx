import { Button } from "@/components/ui/button";

type Props = {
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
};

export default function DeleteConfirmOverlay({
  onConfirm,
  onCancel,
  isDeleting = false,
}: Props) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-background/80 p-3 text-center backdrop-blur-sm">
      <p className="text-xs font-medium text-ink">Delete ?</p>
      <div className="flex gap-2">
        <Button
          onClick={onConfirm}
          disabled={isDeleting}
          className="h-7 rounded bg-destructive px-2.5 py-0 text-xs font-medium text-ink hover:bg-red-600"
        >
          {isDeleting ? "..." : "Yes"}
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isDeleting}
          className="h-7 rounded border-border bg-surface px-2.5 py-0 text-xs font-medium text-ink hover:text-brand"
        >
          No
        </Button>
      </div>
    </div>
  );
}
