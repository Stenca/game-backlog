import type { UserGame } from "../types/Game";
import { STATUS_COLOR } from "../utils/status";

type Props = {
  game: UserGame;
  showStatus?: boolean;
};

export default function GameCover({ game, showStatus = true }: Props) {
  return (
    <div className="relative aspect-3/4 overflow-hidden rounded bg-surface-2">
      {game.game.coverUrl ? (
        <img
          src={game.game.coverUrl}
          alt={game.game.title}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-ink-dim">
          No cover
        </div>
      )}

      {showStatus && (
        <span
          className={`absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-black ${STATUS_COLOR[game.status]}`}
        >
          {game.status}
        </span>
      )}
    </div>
  );
}
