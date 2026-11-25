import { beforeEach, describe, expect, it, vi } from "vitest";
import * as rawg from "../services/rawg";
import * as igdb from "../services/igdb";
import * as gameApi from "../services/gameApi";

vi.mock("../services/rawg", () => ({
  searchGames: vi.fn(),
  getGameDetails: vi.fn(),
}));

vi.mock("../services/igdb", () => ({
  searchGames: vi.fn(),
  getGameDetails: vi.fn(),
}));

describe("gameApi fallback wrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("searchGames", () => {
    it("returns RAWG data if RAWG succeeds", async () => {
      vi.mocked(rawg.searchGames).mockResolvedValue([
        { title: "RAWG Game" },
      ] as Awaited<ReturnType<typeof rawg.searchGames>>);

      const result = await gameApi.searchGames("test");

      expect(result).toEqual([{ title: "RAWG Game" }]);
      expect(rawg.searchGames).toHaveBeenCalledWith("test");
      expect(igdb.searchGames).not.toHaveBeenCalled();
    });

    it("falls back to IGDB if RAWG throws an error", async () => {
      vi.mocked(rawg.searchGames).mockRejectedValue(new Error("RAWG down"));
      vi.mocked(igdb.searchGames).mockResolvedValue([
        { title: "IGDB Game" },
      ] as Awaited<ReturnType<typeof igdb.searchGames>>);

      const result = await gameApi.searchGames("test");

      expect(result).toEqual([{ title: "IGDB Game" }]);
      expect(rawg.searchGames).toHaveBeenCalledWith("test");
      expect(igdb.searchGames).toHaveBeenCalledWith("test");
    });

    it("falls back to IGDB if RAWG returns an empty array", async () => {
      vi.mocked(rawg.searchGames).mockResolvedValue([]);
      vi.mocked(igdb.searchGames).mockResolvedValue([
        { title: "IGDB Game" },
      ] as Awaited<ReturnType<typeof igdb.searchGames>>);

      const result = await gameApi.searchGames("test");

      expect(result).toEqual([{ title: "IGDB Game" }]);
      expect(igdb.searchGames).toHaveBeenCalledWith("test");
    });

    it("falls back to IGDB if RAWG times out", async () => {
      vi.mocked(rawg.searchGames).mockImplementation(
        () => new Promise(() => {}),
      );

      vi.mocked(igdb.searchGames).mockResolvedValue([
        { title: "IGDB Game" },
      ] as Awaited<ReturnType<typeof igdb.searchGames>>);

      const result = await gameApi.searchGames("test");

      expect(result).toEqual([{ title: "IGDB Game" }]);
      expect(rawg.searchGames).toHaveBeenCalledWith("test");
      expect(igdb.searchGames).toHaveBeenCalledWith("test");
    }, 5000);

    it("propagates the error if IGDB also fails", async () => {
      vi.mocked(rawg.searchGames).mockRejectedValue(new Error("RAWG down"));
      vi.mocked(igdb.searchGames).mockRejectedValue(new Error("IGDB down"));

      await expect(gameApi.searchGames("test")).rejects.toThrow("IGDB down");
    });
  });

  describe("getGameDetails", () => {
    it("returns RAWG details if RAWG succeeds", async () => {
      vi.mocked(rawg.getGameDetails).mockResolvedValue({
        title: "RAWG Game",
      } as Awaited<ReturnType<typeof rawg.getGameDetails>>);

      const result = await gameApi.getGameDetails(123);

      expect(result).toEqual({ title: "RAWG Game" });
      expect(rawg.getGameDetails).toHaveBeenCalledWith(123);
      expect(igdb.getGameDetails).not.toHaveBeenCalled();
    });

    it("falls back to IGDB if RAWG throws an error", async () => {
      vi.mocked(rawg.getGameDetails).mockRejectedValue(new Error("RAWG down"));
      vi.mocked(igdb.getGameDetails).mockResolvedValue({
        title: "IGDB Game",
      } as Awaited<ReturnType<typeof igdb.getGameDetails>>);

      const result = await gameApi.getGameDetails(123);

      expect(result).toEqual({ title: "IGDB Game" });
      expect(rawg.getGameDetails).toHaveBeenCalledWith(123);
      expect(igdb.getGameDetails).toHaveBeenCalledWith(123);
    });

    it("falls back to IGDB if RAWG returns null", async () => {
      vi.mocked(rawg.getGameDetails).mockResolvedValue(null);
      vi.mocked(igdb.getGameDetails).mockResolvedValue({
        title: "IGDB Game",
      } as Awaited<ReturnType<typeof igdb.getGameDetails>>);

      const result = await gameApi.getGameDetails(123);

      expect(result).toEqual({ title: "IGDB Game" });
      expect(igdb.getGameDetails).toHaveBeenCalledWith(123);
    });

    it("falls back to IGDB if RAWG times out", async () => {
      vi.mocked(rawg.getGameDetails).mockImplementation(
        () => new Promise(() => {}),
      );

      vi.mocked(igdb.getGameDetails).mockResolvedValue({
        title: "IGDB Game",
      } as Awaited<ReturnType<typeof igdb.getGameDetails>>);

      const result = await gameApi.getGameDetails(123);

      expect(result).toEqual({ title: "IGDB Game" });
      expect(rawg.getGameDetails).toHaveBeenCalledWith(123);
      expect(igdb.getGameDetails).toHaveBeenCalledWith(123);
    }, 5000);

    it("propagates the error if IGDB also fails", async () => {
      vi.mocked(rawg.getGameDetails).mockRejectedValue(new Error("RAWG down"));
      vi.mocked(igdb.getGameDetails).mockRejectedValue(new Error("IGDB down"));

      await expect(gameApi.getGameDetails(123)).rejects.toThrow("IGDB down");
    });
  });
});
