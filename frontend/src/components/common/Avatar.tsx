import type { User } from "@/stores/authStore";

type Props = {
  user: Pick<User, "displayName" | "avatarUrl">;
  size?: "sm" | "md" | "lg";
};

export default function Avatar({ user, size = "md" }: Props) {
  const sizeClasses = {
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-24 w-24 text-3xl",
  }[size];

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.displayName}
        className={`${sizeClasses} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} flex items-center justify-center rounded-full bg-brand/20 font-bold text-brand`}
    >
      {user.displayName.charAt(0).toUpperCase()}
    </div>
  );
}
