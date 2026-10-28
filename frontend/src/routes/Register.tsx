import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore, type User } from "../stores/authStore";
import { apiFetch } from "../api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const data = await apiFetch<{ token: string; user: User }>(
        "/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify({
            username: username.toLowerCase(),
            displayName: username,
            email,
            password,
          }),
        },
      );
      login(data.token, data.user);
      navigate("/games");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-sm rounded border border-border bg-surface p-8">
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-ink">
        Create an account
      </h1>
      <p className="mb-8 text-sm text-ink-muted">
        Start tracking your games on Bonfire.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          autoComplete="username"
          required
          minLength={3}
          maxLength={20}
        />
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          required
        />
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="new-password"
          required
          minLength={8}
        />

        <p className="text-xs text-ink-dim">
          At least 8 characters, with an uppercase letter, lowercase letter, and
          number.
        </p>

        {error && (
          <p className="rounded border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="mt-2 w-full" isLoading={isLoading}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-ink-muted">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-brand transition-colors hover:text-brand-hover"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
