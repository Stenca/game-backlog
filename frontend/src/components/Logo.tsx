import { Link } from "react-router-dom";
import bonfireImg from "../assets/bonfire.png";

type Props = {
  size?: "sm" | "lg";
  tagline?: string;
  className?: string;
};

export default function Logo({ size = "sm", tagline, className = "" }: Props) {
  const isLg = size === "lg";

  const content = (
    <div className={`flex items-center ${className}`}>
      <img
        src={bonfireImg}
        alt="Bonfire"
        className={`shrink-0 object-contain ${isLg ? "h-15 w-13" : "h-7 w-7"}`}
      />

      <div className={`flex items-baseline ${isLg ? "gap-4" : "gap-2"}`}>
        <span
          className={`font-pirata tracking-wide text-ink ${
            isLg ? "text-7xl -ml-2" : "text-lg -ml-1"
          }`}
        >
          <span className="text-brand">bon</span>fire
          <span className="text-brand">.</span>
        </span>

        {tagline && (
          <span
            className={`text-ink-muted ${
              isLg ? "text-lg hidden sm:block" : "text-sm hidden md:block"
            }`}
          >
            {tagline}
          </span>
        )}
      </div>
    </div>
  );

  if (isLg) {
    return content;
  }

  return (
    <Link
      to="/games"
      className="inline-flex shrink-0 transition-opacity hover:opacity-80"
    >
      {content}
    </Link>
  );
}
