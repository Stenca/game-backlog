import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api";
import { useAuthStore } from "@/stores/authStore";
import { type Comment } from "@/types/Game";
import Avatar from "@/components/common/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRelative } from "@/utils/date";
import { Trash2 } from "lucide-react";

type Props = {
  entryId: string;
};

export default function JournalEntryComments({ entryId }: Props) {
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [text, setText] = useState("");

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", entryId],
    queryFn: () => apiFetch<Comment[]>(`/api/comments/entry/${entryId}`),
  });

  const addComment = useMutation({
    mutationFn: (newText: string) =>
      apiFetch<Comment>(`/api/comments/entry/${entryId}`, {
        method: "POST",
        body: JSON.stringify({ text: newText }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", entryId] });
      setText("");
    },
  });

  const deleteComment = useMutation({
    mutationFn: (commentId: string) =>
      apiFetch(`/api/comments/${commentId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", entryId] });
    },
  });

  return (
    <div className="mt-4 border-t border-border/50 pt-4">
      {isLoading ? (
        <p className="text-xs text-ink-muted">Loading comments...</p>
      ) : (
        <ul className="mb-4 flex flex-col gap-3">
          {comments.map((comment) => (
            <li key={comment._id} className="flex items-start gap-3">
              <Avatar user={comment.userId} size="sm" />
              <div className="flex-1 rounded-lg bg-surface-2 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">
                    {comment.userId.displayName}
                  </span>
                  <span className="text-[10px] text-ink-muted">
                    {formatRelative(comment.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink">{comment.text}</p>
              </div>
              {currentUser?.id === comment.userId._id && (
                <button
                  onClick={() => deleteComment.mutate(comment._id)}
                  className="mt-2 text-ink-muted hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) addComment.mutate(text);
        }}
        className="flex gap-2"
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          className="bg-surface-2 hover:border-brand"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!text.trim()}
          isLoading={addComment.isPending}
        >
          Post
        </Button>
      </form>
    </div>
  );
}
