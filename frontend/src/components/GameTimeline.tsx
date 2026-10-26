import type { UserGame } from "../types/Game";
import { formatEntryDate, formatRelative } from "../utils/date";

type Props = {
  game: UserGame;
};

export default function GameTimeline({ game }: Props) {
  return (
    <div className="flex flex-col gap-1 text-xs">
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-wider text-ink-dim">
          Added
        </span>
        <span className="font-medium text-ink-muted">
          {formatEntryDate(game.createdAt)}
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-wider text-ink-dim">
          Last Update
        </span>
        <div className="flex items-center">
          <span className="font-medium text-ink-muted">
            {formatRelative(game.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
