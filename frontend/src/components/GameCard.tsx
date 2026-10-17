import { useEffect, useRef, useState } from "react";
import { STATUSES, type Status, type UserGame } from "../types/Game";
import { useGameStore } from "../stores/gameStore";

const statusColor: Record<Status, string> = {
  backlog: "bg-ink-dim",
  playing: "bg-accent",
  completed: "bg-green-700",
  dropped: "bg-red-700",
  wishlist: "bg-purple-700",
};

type Props = {
  game: UserGame;
  onClick?: (game: UserGame) => void;
};

export default function GameCard({ game, onClick }: Props) {
  const updateStatus = useGameStore((s) => s.updateStatus);
  const remove = useGameStore((s) => s.remove);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  function handleBadgeClick(e: React.MouseEvent) {
    e.stopPropagation();
    setMenuOpen((open) => !open);
  }

  async function handleSelectStatus(status: Status) {
    const ok = await updateStatus(game._id, status);
    if (ok) setMenuOpen(false);
  }

  async function handleConfirmDelete() {
    await remove(game._id);
  }

  return (
    <li className="group">
      <div
        onClick={() => onClick?.(game)}
        className="relative aspect-3/4 cursor-pointer overflow-hidden rounded bg-surface-2"
      >
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

        {confirmDelete ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 p-3 text-center"
          >
            <p className="text-xs font-medium text-ink">Delete ?</p>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmDelete}
                className="rounded bg-red-700 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-red-600"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded border border-border bg-surface px-2.5 py-1 text-xs font-medium text-ink-muted transition-colors hover:border-ink-muted hover:text-ink"
              >
                No
              </button>
            </div>
          </div>
        ) : (
          <>
            <div ref={menuRef}>
              <button
                onClick={handleBadgeClick}
                className={`absolute bottom-1 left-1 cursor-pointer rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-black transition-colors ${statusColor[game.status]}`}
              >
                {game.status}
              </button>

              {menuOpen && (
                <div className="absolute bottom-7 left-1 z-10 overflow-hidden rounded border border-border bg-surface shadow-lg">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectStatus(s);
                      }}
                      className={`block w-full px-3 py-1.5 text-left text-xs transition-colors hover:bg-surface-2 ${
                        s === game.status ? "text-accent" : "text-ink"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(true);
              }}
              className="absolute right-1 top-1 cursor-pointer rounded bg-black/70 px-1.5 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              ×
            </button>
          </>
        )}
      </div>

      <div className="mt-1.5 truncate text-xs font-medium text-ink">
        {game.game.title}
      </div>
      <div className="text-[11px] text-ink-muted">{game.platform.name}</div>
    </li>
  );
}
