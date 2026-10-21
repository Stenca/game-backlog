import type { Platform } from "../types/Game";
import { getPlatformColor } from "../utils/platform";

type Props = {
  platform: Platform;
  size?: "sm" | "md";
};

export default function PlatformBadge({ platform, size = "sm" }: Props) {
  const sizeClasses =
    size === "sm"
      ? "px-1.5 py-0.5 text-[10px] border"
      : "px-3 py-1.5 text-sm border";

  return (
    <span
      className={`inline-flex cursor-default items-center rounded border-transparent text-black font-medium uppercase tracking-wide ${sizeClasses} ${getPlatformColor(platform)}`}
    >
      {platform.name}
    </span>
  );
}
