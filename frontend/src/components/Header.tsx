import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import bonfireImg from "../assets/bonfire.png";
import { Button } from "@/components/ui/button";

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
        <Link
          to="/games"
          className="flex shrink-0 items-center text-lg font-bold tracking-tight text-foreground transition-colors hover:text-primary"
        >
          <img
            src={bonfireImg}
            alt=""
            className="h-7 w-7 shrink-0 object-contain"
          />
          <span className="whitespace-nowrap">
            <span className="text-brand">Bon</span>fire.
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          {user ? (
            <>
              <span className="text-sm text-ink-muted">
                Welcome back,{" "}
                <Link
                  to="/profile"
                  className="font-medium text-brand transition-colors hover:text-brand/60 "
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
