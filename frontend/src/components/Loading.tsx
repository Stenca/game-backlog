import { Spinner } from "@/components/ui/spinner";

type Props = {
  text?: string;
  fullscreen?: boolean;
};

export default function Loading({ text = "", fullscreen = false }: Props) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center gap-3 ${fullscreen ? "min-h-[50vh]" : "py-12"}`}
    >
      <Spinner className="h-6 w-6 text-brand" />
      <p className="text-sm text-ink-muted">{text}</p>
    </div>
  );
}
