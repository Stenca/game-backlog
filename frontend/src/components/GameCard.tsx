import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useGameStore } from "../stores/gameStore";
import { type UserGame } from "../types/Game";
import GameCover from "./GameCover";
import PlatformBadge from "./PlatformBadge";
import StatusMenu from "./StatusMenu";
import DeleteConfirmOverlay from "./DeleteConfirmOverlay";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState } from "react";

type Props = {
  game: UserGame;
  index?: number;
};

export default function GameCard({ game, index = 0 }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const updateStatus = useGameStore((s) => s.updateStatus);
  const removeGame = useGameStore((s) => s.remove);

  async function handleConfirmDelete() {
    setIsDeleting(true);
    try {
      await removeGame(game._id);
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{
        duration: 0.4,
        ease: "easeOut",
        delay: Math.min(index * 0.03, 0.45),
      }}
      className="group relative"
    >
      <div>
        <div className="relative aspect-3/4 w-full overflow-hidden rounded group-hover:shadow-lg group-hover:shadow-black/50">
          <Link to={`/games/${game._id}`} className="block h-full w-full">
            <GameCover game={game} />
          </Link>

          <AnimatePresence mode="wait">
            {confirmDelete ? (
              <motion.div key="overlay" className="absolute inset-0 z-20">
                <DeleteConfirmOverlay
                  onConfirm={handleConfirmDelete}
                  onCancel={() => setConfirmDelete(false)}
                  isDeleting={isDeleting}
                />
              </motion.div>
            ) : (
              <motion.div
                key="card-content"
                className="pointer-events-none absolute inset-0 z-10"
              >
                {/* Added pointer-events-auto to the badges and buttons */}
                <div className="pointer-events-auto absolute left-1 top-1 z-10">
                  <PlatformBadge platform={game.platform} size="sm" />
                </div>
                <div className="pointer-events-auto absolute bottom-1 left-1 z-10">
                  <StatusMenu
                    status={game.status}
                    onChange={async (s) => {
                      await updateStatus(game._id, s);
                    }}
                    direction="up"
                    size="sm"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setConfirmDelete(true)}
                  className="pointer-events-auto absolute right-1 top-1 z-10 bg-bg/70 text-ink opacity-0 transition-all hover:bg-destructive hover:text-ink group-hover:opacity-100"
                  aria-label="Delete game"
                >
                  <X />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Link to={`/games/${game._id}`} className="mt-1 block">
          <div className="truncate text-xs font-medium text-ink-muted">
            {game.game.title}
          </div>
        </Link>
      </div>
    </motion.li>
  );
}
