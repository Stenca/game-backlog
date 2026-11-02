import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export default function ErrorState({
  title = "Something went wrong",
  message = "We couldn't connect to the server. Please check your internet connection or try again later.",
  onRetry,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 px-6 py-16 text-center">
      <AlertCircle className="mb-4 h-10 w-10 text-destructive" />
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-ink-muted">{message}</p>

      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          className="mt-6 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          Try Again
        </Button>
      )}
    </div>
  );
}
