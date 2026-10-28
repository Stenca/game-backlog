import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../api";
import { useAuthStore, type User } from "../stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatusMessage from "@/components/StatusMessage";

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  const [username, setUsername] = useState(user?.username ?? "");
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const updateProfileMutation = useMutation({
    mutationFn: (payload: Record<string, string>) =>
      apiFetch<{ user: User }>("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      login(token!, data.user);
      queryClient.setQueryData(["profile"], data.user);
      setProfileSuccess("Profile updated.");
      setProfileError("");
    },
    onError: (err) => {
      setProfileError(err instanceof Error ? err.message : "Update failed");
      setProfileSuccess("");
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (payload: Record<string, string>) =>
      apiFetch("/api/users/me/password", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      setPasswordSuccess("Password updated.");
      setPasswordError("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err) => {
      setPasswordError(err instanceof Error ? err.message : "Update failed");
      setPasswordSuccess("");
    },
  });

  function handleProfileSubmit(e: React.SubmitEvent) {
    e.preventDefault();

    const payload: Record<string, string> = {};
    if (username !== user?.username) payload.username = username;
    if (displayName !== user?.displayName) payload.displayName = displayName;
    if (email !== user?.email) payload.email = email;

    if (Object.keys(payload).length === 0) {
      setProfileSuccess("Nothing to update.");
      setProfileError("");
      return;
    }

    updateProfileMutation.mutate(payload);
  }

  function handlePasswordSubmit(e: React.SubmitEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      setPasswordSuccess("");
      return;
    }

    updatePasswordMutation.mutate({ currentPassword, newPassword });
  }

  if (!user) return null;

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="text-3xl font-bold tracking-tight text-ink">Profile</h1>

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
            {/* Removed bg-surface-2 so it uses the default Input styles */}
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <span className="text-[11px] text-ink-dim">
              Lowercase, 3–20 characters. Used for login. Must be unique.
            </span>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-ink-muted">
              Display name
            </span>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <span className="text-[11px] text-ink-dim">
              What other users see. 1–20 characters.
            </span>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-ink-muted">
              Email
            </span>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="min-h-9 min-w-0 flex-1">
              <StatusMessage message={profileError} variant="error" />
              <StatusMessage message={profileSuccess} variant="success" />
            </div>

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
            />
          </label>

          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="min-h-9 min-w-0 flex-1">
              <StatusMessage message={passwordError} variant="error" />
              <StatusMessage message={passwordSuccess} variant="success" />
            </div>

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
