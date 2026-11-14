import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../api";
import { useAuthStore, type User } from "@/stores/authStore";
import AvatarUpload from "@/components/common/AvatarUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const queryClient = useQueryClient();

  const [username, setUsername] = useState(user?.username ?? "");
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const updateProfileMutation = useMutation({
    mutationFn: (payload: Record<string, string>) =>
      apiFetch<{ user: User }>("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      updateUser(data.user);
      queryClient.setQueryData(["profile"], data.user);
      toast.add({
        type: "success",
        title: "Profile updated",
        description: "Your account details have been saved.",
      });
    },
    onError: (err) => {
      toast.add({
        type: "error",
        title: "Failed to update profile",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (payload: Record<string, string>) =>
      apiFetch("/api/users/me/password", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.add({
        type: "success",
        title: "Password updated",
        description: "Your new password is now active.",
      });
    },
    onError: (err) => {
      toast.add({
        type: "error",
        title: "Failed to update password",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    },
  });

  function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload: Record<string, string> = {};
    if (username !== user?.username) payload.username = username;
    if (displayName !== user?.displayName) payload.displayName = displayName;
    if (email !== user?.email) payload.email = email;

    if (Object.keys(payload).length === 0) {
      toast.add({
        type: "info",
        title: "Nothing to update",
        description: "You haven't changed any details.",
      });
      return;
    }

    updateProfileMutation.mutate(payload);
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.add({
        type: "error",
        title: "Passwords do not match",
        description: "Please re-enter your new password.",
      });
      return;
    }

    updatePasswordMutation.mutate({ currentPassword, newPassword });
  }

  if (!user) return null;

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="text-3xl font-bold tracking-tight text-ink">Profile</h1>
      <section className="mt-8 rounded border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-ink">Avatar</h2>
        <div className="mt-4">
          <AvatarUpload />
        </div>
      </section>
      <section className="mt-8 rounded border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-ink">Account</h2>

        <form
          onSubmit={handleProfileSubmit}
          className="mt-4 flex flex-col gap-3"
        >
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-ink-muted">
              Username
            </span>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-surface-2"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-ink-muted">
              Display name
            </span>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-surface-2"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-ink-muted">
              Email
            </span>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-surface-2"
            />
          </label>

          <div className="mt-2 flex justify-end">
            <Button
              type="submit"
              isLoading={updateProfileMutation.isPending}
              className="shrink-0"
            >
              Save changes
            </Button>
          </div>
        </form>
      </section>

      <section className="mt-6 rounded border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-ink">Change password</h2>

        <form
          onSubmit={handlePasswordSubmit}
          className="mt-4 flex flex-col gap-3"
        >
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-ink-muted">
              Current password
            </span>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="bg-surface-2"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-ink-muted">
              New password
            </span>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
              className="bg-surface-2"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-ink-muted">
              Confirm new password
            </span>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              className="bg-surface-2"
            />
          </label>

          <div className="mt-2 flex justify-end">
            <Button
              type="submit"
              isLoading={updatePasswordMutation.isPending}
              className="shrink-0"
            >
              Update password
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
