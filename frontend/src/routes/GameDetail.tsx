import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  STATUSES,
  type JournalEntry,
  type Status,
  type UserGame,
} from "../types/Game";
import { useGameStore } from "../stores/gameStore";
import { apiFetch } from "../api";
import { STATUS_COLOR } from "../utils/status";

export default function GameDetail() {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<UserGame | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newEntry, setNewEntry] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const updateStatus = useGameStore((s) => s.updateStatus);

  async function loadAll() {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const [gameData, journalData] = await Promise.all([
        apiFetch<UserGame>(`/api/games/${id}`),
        apiFetch<JournalEntry[]>(`/api/journal/game/${id}`),
      ]);
      setGame(gameData);
      setEntries(journalData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load game");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [id]);

  async function handleStatusChange(newStatus: Status) {
    if (!game) return;
    const ok = await updateStatus(game._id, newStatus);
    if (ok) setGame({ ...game, status: newStatus });
  }

  async function handleAddEntry(e: React.SubmitEvent) {
    e.preventDefault();
    if (!game || !newEntry.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const created = await apiFetch<JournalEntry>("/api/journal", {
        method: "POST",
        body: JSON.stringify({
          gameId: game.game._id,
          body: newEntry.trim(),
        }),
      });
      setEntries([created, ...entries]);
      setNewEntry("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add entry");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteEntry(entryId: string) {
    setError("");
    try {
      await apiFetch(`/api/journal/${entryId}`, { method: "DELETE" });
      setEntries(entries.filter((e) => e._id !== entryId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entry");
    }
  }

  if (loading) {
    return (
      <main className="mx-auito max-w-5xl px-6 py-8">
        <p className="text-sm text-ink-muted">Loading...</p>
      </main>
    );
  }

  if (error && !game) {
    return (
      <main className="mx-auito max-w-5xl px-6 py-8">
        <p className="text-sm text-ink-muted">{error}</p>
        <Link to="/games" className="mt- inline-block text-sm text-accent">
          ← Back to games
        </Link>
      </main>
    );
  }

  if (!game) return null;

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <Link to="/games" className="mt- inline-block text-sm text-accent">
        ← Back to games
      </Link>

      <div className="mt-6 flex flex-col gap-6 md:flex-row">
        <div className="w-full shrink-0 md:w-56">
          {game.game.coverUrl ? (
            <img
              src={game.game.coverUrl}
              alt={game.game.title}
              className="w-full rounded bg-surface-2 object-cover"
            />
          ) : (
            <div className="flex aspect-3/4 items-center justify-center rounded bg-surface-2 text-xs text-ink-dim">
              No cover
            </div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            {game.game.title}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
            {game.game.releaseDate && (
              <span>{game.game.releaseDate.slice(0, 4)}</span>
            )}
            {game.game.genres && game.game.genres.length > 0 && (
              <>
                <span>.</span>
                <span>{game.game.genres.join(", ")}</span>
              </>
            )}
            {game.game.playtime && (
              <>
                <span>.</span>
                <span>~{game.game.playtime}h</span>
              </>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <select
              value={game.status}
              onChange={(e) => handleStatusChange(e.target.value as Status)}
              className={`cursor-pointer rounded border border-border px-3 py-1.5 text-sm text-black focus:outline-none ${STATUS_COLOR[game.status]}`}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <span className="text-sm text-ink-muted">{game.platform.name}</span>
          </div>
          {error && (
            <p className="mt-4 rounded border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
        </div>
      </div>
      <section></section>
    </main>
  );
}
