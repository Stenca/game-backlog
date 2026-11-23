import { User } from "../models/User.js";

export async function generateUsername(email: string) {
  const base = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 14);

  const usernameBase = base.length >= 3 ? base : "user";

  let username = usernameBase;

  while (await User.exists({ username })) {
    username = `${usernameBase}_${Math.floor(Math.random() * 100000)}`;
  }

  return username;
}
