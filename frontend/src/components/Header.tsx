import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import bonfireImg from "../assets/bonfire.png";

export default function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link
          to="/games"
          className="flex shrink-0 items-center text-lg font-bold tracking-tight text-ink transition-colors hover:text-accent"
        >
          <img
            src={bonfireImg}
            alt=""
            className="h-7 w-7 shrink-0 object-contain"
          />
          <span className="whitespace-nowrap">
            <span className="text-accent">Bon</span>fire.
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          {user ? (
            <>
              <span className="text-sm text-ink-muted">
                Welcome back,{" "}
                <Link
                  to="/profile"
                  className="font-medium text-accent transition-colors hover:text-accent-hover hover:underline"
                >
                  {user.displayName || user.username}
                </Link>
              </span>

              <button
                onClick={handleLogout}
                className="rounded border border-border px-3 py-1.5 text-sm text-ink-muted transition-colors hover:border-accent hover:text-accent"
              >
                Log out
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-sm text-ink-muted transition-colors hover:text-accent"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded bg-accent px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-accent-hover"
              >
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
