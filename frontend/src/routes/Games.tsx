import { useEffect, useState } from "react";
import type { Game } from "../types/Game";
import { useAuthStore } from "../stores/authStore";
import { apiFetch } from "../api";

export default function Games() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("");

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
      setPlatform("");
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
        <input
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          placeholder="Platform"
        />
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
                handleStatusChange(game._id, e.target.value as Game["status"])
              }
            >
              <option value="backlog">Backlog</option>
              <option value="playing">Playing</option>
              <option value="completed">Completed</option>
              <option value="dropped">Dropped</option>
              <option value="wishlist">Wishlist</option>
            </select>
            <button onClick={() => handleDelete(game._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
