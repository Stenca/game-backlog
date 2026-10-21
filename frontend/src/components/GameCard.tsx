import { useState } from "react";
import { type UserGame } from "../types/Game";
import { useGameStore } from "../stores/gameStore";
import { Link } from "react-router-dom";
import GameCover from "./GameCover";
import StatusMenu from "./StatusMenu";
import PlatformBadge from "./PlatformBadge";

type Props = {
  game: UserGame;
  onClick?: (game: UserGame) => void;
};

export default function GameCard({ game }: Props) {
  const updateStatus = useGameStore((s) => s.updateStatus);
  const remove = useGameStore((s) => s.remove);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleConfirmDelete() {
    await remove(game._id);
  }

  return (
    <li className="group">
      <div className="relative aspect-3/4 overflow-hidden rounded bg-surface-2">
        <Link to={`/games/${game._id}`} className="block h-full w-full">
          <GameCover game={game} />
        </Link>

        {confirmDelete ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 p-3 text-center">
            <p className="text-xs font-medium text-ink">Delete ?</p>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmDelete}
                className="cursor-pointer rounded bg-red-700 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-red-600"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="cursor-pointer rounded border border-border bg-surface px-2.5 py-1 text-xs font-medium text-ink-muted transition-colors hover:border-ink-muted hover:text-ink"
              >
                No
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="pointer-events-none absolute left-1 top-1 z-10">
              <PlatformBadge platform={game.platform} size="sm" />
            </div>
            <div className="absolute bottom-1 left-1">
              <StatusMenu
                status={game.status}
                onChange={async (s) => {
                  await updateStatus(game._id, s);
                }}
                direction="up"
                size="sm"
              />
            </div>

            <button
              onClick={() => setConfirmDelete(true)}
              className="absolute right-1 top-1 cursor-pointer rounded bg-black/70 px-1.5 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              ×
            </button>
          </>
        )}
      </div>

      <div className="truncate text-xs font-medium text-ink">
        {game.game.title}
      </div>
    </li>
  );
}
