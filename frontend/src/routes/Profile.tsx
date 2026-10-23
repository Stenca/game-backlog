import { useState } from "react";
import { useAuthStore, type User } from "../stores/authStore";
import { apiFetch } from "../api";

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const token = useAuthStore((s) => s.token);

  const [username, setUsername] = useState(user?.username ?? "");
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  async function handleProfileSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setProfileSaving(true);

    try {
      const payload: Record<string, string> = {};
      if (username !== user?.username) payload.username = username;
      if (displayName !== user?.displayName) payload.displayName = displayName;
      if (email !== user?.email) payload.email = email;

      if (Object.keys(payload).length === 0) {
        setProfileSuccess("Nothing to update.");
        return;
      }

      const data = await apiFetch<{ user: User }>("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      login(token!, data.user);
      setProfileSuccess("Profile updated.");
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      await apiFetch("/api/users/me/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPasswordSuccess("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPasswordSaving(false);
    }
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
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded border border-border bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-dim focus:border-brand focus:outline-none"
            />
            <span className="text-[11px] text-ink-dim">
              Lowercase, 3–20 characters. Used for login. Must be unique.
            </span>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-ink-muted">
              Display name
            </span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="rounded border border-border bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-dim focus:border-accent focus:outline-none"
            />
            <span className="text-[11px] text-ink-dim">
              What other users see. 1–20 characters.
            </span>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-ink-muted">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded border border-border bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-dim focus:border-brand focus:outline-none"
            />
          </label>

          {profileError && (
            <p className="rounded border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-400">
              {profileError}
            </p>
          )}
          {profileSuccess && (
            <p className="rounded border border-green-900 bg-green-950/40 px-3 py-2 text-sm text-green-400">
              {profileSuccess}
            </p>
          )}

          <button
            type="submit"
            disabled={profileSaving}
            className="mt-2 cursor-pointer self-end rounded bg-brand px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {profileSaving ? "Saving…" : "Save changes"}
          </button>
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
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="rounded border border-border bg-surface-2 px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-ink-muted">
              New password
            </span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
              className="rounded border border-border bg-surface-2 px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
            />
            <span className="text-[11px] text-ink-dim">
              At least 8 characters, with an uppercase letter, lowercase letter,
              and number.
            </span>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-ink-muted">
              Confirm new password
            </span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              className="rounded border border-border bg-surface-2 px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
            />
          </label>

          {passwordError && (
            <p className="rounded border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-400">
              {passwordError}
            </p>
          )}
          {passwordSuccess && (
            <p className="rounded border border-green-900 bg-green-950/40 px-3 py-2 text-sm text-green-400">
              {passwordSuccess}
            </p>
          )}

          <button
            type="submit"
            disabled={passwordSaving}
            className="mt-2 cursor-pointer self-end rounded bg-brand px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {passwordSaving ? "Updating…" : "Update password"}
          </button>
        </form>
      </section>
    </main>
  );
}
