import { type UserGame } from "@/types/Game";

type Props = {
  games: UserGame[];
};

export default function CurrentlyPlaying({ games }: Props) {
  if (games.length === 0) return null;

  return (
    <div className="w-full">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
        Currently Playing
      </h3>
      <div className="flex flex-wrap gap-3">
        {games.map((g) => (
          <div
            key={g._id}
            className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2 pr-4 shadow-sm transition-colors hover:border-brand/50"
          >
            <img
              src={g.game.coverUrl}
              alt=""
              className="h-12 w-9 rounded object-cover"
            />
            <div>
              <p className="text-sm font-medium text-ink truncate max-w-[150px]">
                {g.game.title}
              </p>
              <p className="text-xs text-ink-muted">{g.platform.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
