import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import Logo from "./Logo";
import Avatar from "@/components/common/Avatar";

export default function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  if (!user) return null;

  const navLinks = [
    { label: "Feed", path: "/feed" },
    { label: "My Games", path: "/games" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link to="/games" className="shrink-0">
          <Logo size="sm" />
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors  ${
                  isActive ? "text-brand" : "text-ink-muted hover:text-brand"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to={`/u/${user.username}?tab=activity`}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="text-brand font-medium">{user.displayName}</span>
            <Avatar user={user} size="sm" />
          </Link>

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
