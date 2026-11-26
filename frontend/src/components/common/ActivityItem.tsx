import { Link, useNavigate } from "react-router-dom";
import { formatRelative } from "@/utils/date";
import Avatar from "@/components/common/Avatar";
import { motion } from "motion/react";

type Props = {
  item: any;
  index?: number;
  showUser?: boolean;
  username?: string;
  returnTo?: string;
};

export default function ActivityItem({
  item,
  index = 0,
  showUser = true,
  returnTo,
}: Props) {
  const navigate = useNavigate();

  const hasBody = !!item.body;

  function handleOpen() {
    if (!item.targetUrl) return;

    navigate(item.targetUrl, {
      state: {
        returnTo,
        scrollTo: {
          type: "journal-entry",
          id: item.targetId,
          commentId: item.id,
        },
      },
    });
  }

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
      {showUser && (
        <div className="flex items-start justify-between gap-4">
          {item.user && (
            <Link
              to={`/u/${item.user.username}?tab=activity`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 hover:opacity-80"
            >
              <Avatar user={item.user} size="sm" />
              <span className="text-sm font-medium text-ink">
                {item.user.displayName}
              </span>
            </Link>
          )}

          <span className="whitespace-nowrap text-xs text-ink-muted">
            {formatRelative(item.createdAt)}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={handleOpen}
        disabled={!item.targetUrl}
        className="flex w-full flex-1 flex-col gap-3 text-left disabled:cursor-default"
      >
        {item.content && (
          <p className="text-sm text-ink-muted">{item.content}</p>
        )}

        {item.body && (
          <div className="rounded-lg border-l-2 border-brand bg-surface-2 p-3 text-sm text-ink">
            <p className="line-clamp-3 wrap-break-word">"{item.body}"</p>
          </div>
        )}

        {item.game && (
          <div
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
          </div>
        )}
      </button>
    </motion.div>
  );
}
