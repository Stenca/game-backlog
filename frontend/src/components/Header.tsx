import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";

export default function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-brand bg-surface/50 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Logo size="sm" />

        <nav className="flex items-center gap-6">
          {user ? (
            <>
              <span className="text-sm text-ink-muted">
                Welcome back,{" "}
                <Link
                  to="/profile"
                  className="font-medium text-brand transition-colors hover:text-brand-hover "
                >
                  {user.displayName || user.username}
                </Link>
              </span>

              <Button
                onClick={handleLogout}
                className="bg-brand text-black hover:bg-brand-hover"
              >
                Log out
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-sm text-ink-muted transition-colors hover:text-brand"
              >
                Log in
              </Link>
              <Button className="bg-brand text-black hover:bg-brand-hover">
                <Link to="/register">Sign up</Link>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
