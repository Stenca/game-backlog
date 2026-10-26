import { useState } from "react";
import { type UserGame } from "../types/Game";
import { useGameStore } from "../stores/gameStore";
import { Link } from "react-router-dom";
import GameCover from "./GameCover";
import StatusMenu from "./StatusMenu";
import PlatformBadge from "./PlatformBadge";
import DeleteConfirmOverlay from "@/components/DeleteConfirmOverlay";

type Props = {
  game: UserGame;
  onClick?: (game: UserGame) => void;
};

export default function GameCard({ game }: Props) {
  const updateStatus = useGameStore((s) => s.updateStatus);
  const remove = useGameStore((s) => s.remove);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirmDelete() {
    setIsDeleting(true);
    const ok = await remove(game._id);
    if (!ok) {
      setIsDeleting(false);
    }
  }

  return (
    <li className="group">
      <div className="transition-all duration-200 ease-out group-hover:-translate-y-1">
        <div className="relative aspect-3/4 w-full overflow-hidden rounded group-hover:shadow-lg group-hover:shadow-black/50">
          <Link to={`/games/${game._id}`} className="block h-full w-full">
            <GameCover game={game} />
          </Link>

          {confirmDelete ? (
            <DeleteConfirmOverlay
              onConfirm={handleConfirmDelete}
              onCancel={() => setConfirmDelete(false)}
              isDeleting={isDeleting}
            />
          ) : (
            <>
              <div className="absolute left-1 top-1 z-10">
                <PlatformBadge platform={game.platform} size="sm" />
              </div>
              <div className="absolute bottom-1 left-1 z-10">
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
                className="absolute right-1 top-1 cursor-pointer rounded bg-black/70 px-1.5 py-0.5 text-xs text-ink opacity-0 transition-opacity group-hover:opacity-100"
              >
                ×
              </button>
            </>
          )}
        </div>

        <Link to={`/games/${game._id}`} className="mt-1 block">
          <div className="truncate text-xs font-medium text-ink-muted">
            {game.game.title}
          </div>
        </Link>
      </div>
    </li>
  );
}
