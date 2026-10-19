import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

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
      <div className="mx-auto flex max-w-5xl items-center px-6 py-3">
        <nav className="ml-auto flex items-center gap-4">
          {user ? (
            <>
              <span className="text-base">
                Welcome back,{" "}
                <span className="font-medium text-accent">
                  {user.displayName}
                </span>
              </span>
              <button
                onClick={handleLogout}
                className="rounded border border-border px-3 py-1.5 text-sm text-ink-muted transition-colors hover:border-accent hover:text-accent"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm transition-colors hover:text-accent"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-black transition-colors hover:bg-accent-hover"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
