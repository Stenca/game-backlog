import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore, type User } from "@/stores/authStore";
import Avatar from "./Avatar";
import { toast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import DeleteConfirmOverlay from "@/components/common/DeleteConfirmOverlay";

export default function AvatarUpload() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const updateUser = useAuthStore((s) => s.updateUser);
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  if (!user) return null;

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/me/avatar`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      if (!res.ok) throw new Error("Upload failed");
      return res.json() as Promise<{ user: User }>;
    },
    onSuccess: (data) => {
      updateUser(data.user);
      toast.add({ type: "success", title: "Avatar updated" });
    },
    onError: () => {
      toast.add({ type: "error", title: "Failed to upload avatar" });
    },
    onSettled: () => {
      if (fileRef.current) fileRef.current.value = "";
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/me/avatar`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error("Delete failed");
      return res.json() as Promise<{ user: User }>;
    },
    onSuccess: (data) => {
      updateUser(data.user);
      toast.add({ type: "success", title: "Avatar removed" });
      setConfirmRemove(false);
    },
    onError: () => {
      toast.add({ type: "error", title: "Failed to remove avatar" });
      setConfirmRemove(false);
    },
  });

  const isPending = uploadMutation.isPending || removeMutation.isPending;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.add({
        type: "error",
        title: "File is too large. Max size is 10MB.",
      });
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    uploadMutation.mutate(file);
  }

  return (
    <div className="flex w-full flex-col items-start gap-6 sm:flex-row sm:items-center">
      <div className="relative shrink-0 rounded-full">
        <Avatar user={user} size="lg" />

        {isPending && !confirmRemove && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
            <Spinner className="h-6 w-6 text-ink" />
          </div>
        )}

        {confirmRemove && (
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <DeleteConfirmOverlay
              onConfirm={() => removeMutation.mutate()}
              onCancel={() => setConfirmRemove(false)}
              isDeleting={removeMutation.isPending}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col items-start gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            onClick={() => fileRef.current?.click()}
            disabled={isPending}
          >
            Update Profile Picture
          </Button>

          {user.avatarUrl && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setConfirmRemove(true)}
              disabled={isPending}
              className="text-ink-muted hover:text-destructive"
              aria-label="Remove avatar"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
        </div>

        <p className="text-sm text-ink-muted">
          Must be JPEG, PNG, or GIF and cannot exceed 10MB.
        </p>
      </div>

      <input
        type="file"
        accept="image/jpeg, image/png, image/gif"
        ref={fileRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
