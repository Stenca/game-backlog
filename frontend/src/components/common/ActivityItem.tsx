import { Link } from "react-router-dom";
import { formatRelative } from "@/utils/date";
import Avatar from "@/components/common/Avatar";
import { motion } from "motion/react";

type Props = {
  item: any;
  index?: number;
  showUser?: boolean;
  username?: string;
};

export default function ActivityItem({
  item,
  index = 0,
  showUser = true,
}: Props) {
  const gameLink = item.targetUrl || "#";

  const hasBody = !!item.body;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{
        duration: 0.4,
        ease: "easeOut",
        delay: Math.min(index * 0.03, 0.45),
      }}
      className="flex h-full flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm hover:border-brand"
    >
      <div className="flex items-start justify-between gap-4">
        {showUser && item.user && (
          <Link
            to={`/u/${item.user.username}`}
            className="flex items-center gap-2 hover:opacity-80"
          >
            <Avatar user={item.user} size="sm" />
            <span className="text-sm font-medium text-ink">
              {item.user.displayName}
            </span>
          </Link>
        )}

        {showUser && (
          <span className="text-xs text-ink-muted whitespace-nowrap">
            {formatRelative(item.createdAt)}
          </span>
        )}
      </div>

      {item.content && <p className="text-sm text-ink-muted">{item.content}</p>}

      {item.body && (
        <div className="rounded-lg bg-surface-2 p-3 text-sm text-ink border-l-2 border-brand">
          <p className="line-clamp-3 wrap-break-word">"{item.body}"</p>
        </div>
      )}

      {item.game && (
        <Link
          to={gameLink}
          className={`flex w-fit items-center gap-3 rounded-lg border border-border bg-surface-2 p-2 pr-4 transition-colors hover:border-brand/50 ${
            hasBody ? "mt-auto" : ""
          }`}
        >
          {item.game.coverUrl ? (
            <img
              src={item.game.coverUrl}
              alt=""
              className="h-10 w-8 rounded object-cover"
            />
          ) : (
            <div className="h-10 w-8 rounded bg-border" />
          )}
          <span className="text-xs font-medium text-ink">
            {item.game.title}
          </span>
        </Link>
      )}
    </motion.div>
  );
}
