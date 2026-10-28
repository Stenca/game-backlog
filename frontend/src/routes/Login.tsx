import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { apiFetch } from "../api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Login() {
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
      const data = await apiFetch<{ token: string; user: any }>(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        },
      );
      login(data.token, data.user);
      navigate("/games");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-sm rounded border border-border bg-surface p-8">
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-ink">
        Log in
      </h1>
      <p className="mb-8 text-sm text-ink-muted">Welcome back to Bonfire.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          required
          className="bg-surface-2"
        />
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          required
          className="bg-surface-2"
        />

        {error && (
          <p className="rounded border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="mt-2 w-full" isLoading={isLoading}>
          Log in
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-ink-muted">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="text-brand transition-colors hover:text-brand-hover"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
