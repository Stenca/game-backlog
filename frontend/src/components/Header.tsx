import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { Button } from "@/components/ui/button";
import Logo from "./Logo";

export default function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link to="/games" className="shrink-0">
          <Logo size="sm" />
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {user && (
            <Link
              to="/profile"
              className="flex items-center whitespace-nowrap text-xs text-ink-muted sm:text-sm hover:text-ink transition-colors"
            >
              <span className="hidden sm:inline">Welcome back,&nbsp;</span>
              <span className="text-brand font-medium">{user.displayName}</span>
            </Link>
          )}

          <Button
            variant="default"
            size="sm"
            onClick={handleLogout}
            className="shrink-0"
          >
            Log out
          </Button>
        </div>
      </div>
    </header>
  );
}
