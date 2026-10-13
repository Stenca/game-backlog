import { useEffect, useState } from "react";
import {
  PLATFORMS,
  STATUSES,
  type Game,
  type Platform,
  type Status,
} from "../types/Game";
import { useAuthStore } from "../stores/authStore";
import { apiFetch } from "../api";

export default function Games() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<string>(PLATFORMS[0]);

  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  async function load() {
    setError("");
    try {
      const data = await apiFetch<Game[]>("/api/games");
      setGames(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load games");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.SubmitEvent) {
    e.preventDefault();
    if (!title.trim() || !platform.trim()) return;
    setError("");
    try {
      await apiFetch("/api/games", {
        method: "POST",
        body: JSON.stringify({ title, platform }),
      });
      setTitle("");
      setPlatform(PLATFORMS[0]);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add game");
    }
  }

  async function handleStatusChange(id: string, status: Game["status"]) {
    setError("");
    try {
      const updated = await apiFetch<Game>(`/api/games/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setGames((prev) => prev.map((g) => (g._id === id ? updated : g)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update game");
    }
  }

  async function handleDelete(id: string) {
    setError("");
    try {
      await apiFetch(`/api/games/${id}`, {
        method: "DELETE",
      });
      setGames((prev) => prev.filter((g) => g._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete game");
    }
  }

  function isPlatform(value: string): value is Platform {
    return (PLATFORMS as readonly string[]).includes(value);
  }

  return (
    <div>
      <header>
        <span>{user?.username}</span>
        <button onClick={logout}>Log out</button>
      </header>
      <form onSubmit={handleAdd}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Game title"
        />
        <select
          value={platform}
          onChange={(e) => {
            if (isPlatform(e.target.value)) setPlatform(e.target.value);
          }}
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button type="submit">Add</button>
      </form>
      {error && <p>{error}</p>}
      {loading && <p>Loading...</p>}

      <ul>
        {games.map((game) => (
          <li key={game._id}>
            <strong>{game.title}</strong> - {game.platform}
            <select
              value={game.status}
              onChange={(e) =>
                handleStatusChange(game._id, e.target.value as Status)
              }
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button onClick={() => handleDelete(game._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
