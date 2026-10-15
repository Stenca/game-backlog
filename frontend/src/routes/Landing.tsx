import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { Navigate } from "react-router-dom";

export default function Landing() {
  const user = useAuthStore((s) => s.user);
  if (user) return <Navigate to="/games" replace />;

  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="text-6xl font-bold tracking-tight text-ink">
        <span className="text-accent">Bon</span>fire.
      </h1>
      <p className="mt-4 text-lg text-ink-muted">
        Track your games. Take notes as you progress.
      </p>

      <div className="mt-10 flex justify-center gap-3">
        <Link
          to="/register"
          className="rounded bg-accent px-5 py-2 text-sm font-medium text-black transition-colors hover:bg-accent-hover"
        >
          Get started
        </Link>
        <Link
          to="/login"
          className="rounded border border-border px-5 py-2 text-sm text-ink-muted transition-colors hover:border-ink-muted hover:text-ink"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
