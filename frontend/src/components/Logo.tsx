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
    <div
      className={`flex ${
        isLg
          ? "flex-col items-center gap-1 sm:flex-row sm:items-baseline sm:gap-4"
          : "items-center"
      } ${className}`}
    >
      <div className="flex items-center">
        <img
          src={bonfireImg}
          alt="Bonfire"
          className={`shrink-0 object-contain ${
            isLg ? "h-8 w-8 sm:h-12 sm:w-12" : "h-7 w-7"
          }`}
        />
        <span
          className={`font-pirata text-ink ${
            isLg ? "text-4xl sm:text-6xl -ml-1 sm:-ml-2" : "text-2xl -ml-0.5"
          }`}
        >
          <span className="text-brand tracking-wide">bon</span>
          <span className="tracking-wide">fire</span>
          <span className="text-brand tracking-normal">.</span>
        </span>
      </div>

      {tagline && (
        <span
          className={`text-ink-muted ${
            isLg ? "text-sm sm:text-lg" : "text-xs hidden md:block"
          }`}
        >
          {tagline}
        </span>
      )}
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
