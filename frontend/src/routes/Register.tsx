import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { apiFetch } from "../api";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setError("");
    try {
      const data = await apiFetch<{ token: string; user: any }>(
        "/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify({ username, email, password }),
        },
      );
      login(data.token, data.user);
      navigate("/games");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-ink">
        Create an account
      </h1>
      <p className="mb-8 text-sm text-ink-muted">
        Start tracking your games on Bonfire.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          autoComplete="username"
          required
          minLength={3}
          maxLength={20}
          className="rounded border border-border bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-dim transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          required
          className="rounded border border-border bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-dim transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="new-password"
          required
          minLength={8}
          className="rounded border border-border bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-dim transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />

        <p className="text-xs text-ink-dim">
          At least 8 characters, with an uppercase letter, lowercase letter, and
          number.
        </p>

        {error && (
          <p className="rounded border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="mt-2 rounded bg-accent px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-accent-hover"
        >
          Create account
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-ink-muted">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-accent transition-colors hover:text-accent-hover"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
