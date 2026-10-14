import { useEffect, useState } from "react";
import {
  STATUSES,
  type GameDetails,
  type Platform,
  type SearchResult,
  type Status,
  type UserGame,
} from "../types/Game";
import { useAuthStore } from "../stores/authStore";
import { apiFetch } from "../api";
import GameSearch from "../components/GameSearch";

export default function Games() {
  const [games, setGames] = useState<UserGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [details, setDetails] = useState<GameDetails | null>(null);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [status, setStatus] = useState<Status>("backlog");

  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  async function load() {
    setError("");
    try {
      const data = await apiFetch<UserGame[]>("/api/games");
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

  async function handleSelect(result: SearchResult) {
    setSelected(result);
    setDetails(null);
    setPlatform(null);
    try {
      const d = await apiFetch<GameDetails>(
        `/api/games/details/${result.rawgId}`,
      );
      setDetails(d);
      setPlatform(d.availablePlatforms[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load details");
    }
  }

  function handleClearSelection() {
    setSelected(null);
    setDetails(null);
    setPlatform(null);
    setStatus("backlog");
  }

  async function handleAdd(e: React.SubmitEvent) {
    e.preventDefault();
    if (!selected || !platform) return;
    setError("");
    try {
      await apiFetch("/api/games", {
        method: "POST",
        body: JSON.stringify({
          rawgId: selected.rawgId,
          platform: {
            name: platform.name,
            slug: platform.slug,
            releasedAt: platform.releasedAt,
          },
          status,
        }),
      });
      handleClearSelection();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add game");
    }
  }

  async function handleStatusChange(id: string, newStatus: Status) {
    setError("");
    try {
      const updated = await apiFetch<UserGame>(`/api/games/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
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
        <GameSearch
          onSelect={handleSelect}
          selected={selected}
          onClear={handleClearSelection}
        />
        {details && (
          <div>
            <img src={details.coverUrl} alt="" width={80} />
            <strong> {details.title}</strong>
            {details.releaseDate && (
              <span>({details.releaseDate.slice(0, 4)})</span>
            )}
            {details.genres.length > 0 && <p>{details.genres.join(",")}</p>}
          </div>
        )}
        <select
          value={platform?.name ?? ""}
          onChange={(e) => {
            const p = details?.availablePlatforms.find(
              (x) => x.name === e.target.value,
            );
            setPlatform(p ?? null);
          }}
          disabled={!details}
        >
          <option value="">
            {details ? "Select platform" : "Pick a game first"}
          </option>
          {details?.availablePlatforms.map((p) => (
            <option key={p.slug ?? p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Status)}
          disabled={!details}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit">Add</button>
      </form>

      {error && <p>{error}</p>}
      {loading && <p>Loading...</p>}

      <ul>
        {games.map((g) => (
          <li key={g._id}>
            {g.game.coverUrl && <img src={g.game.coverUrl} alt="" width={40} />}
            <strong>{g.game.title}</strong> - {g.platform.name}
            <select
              value={g.status}
              onChange={(e) =>
                handleStatusChange(g._id, e.target.value as Status)
              }
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button onClick={() => handleDelete(g._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
