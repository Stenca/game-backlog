import "dotenv/config";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { searchGames, getGameDetails } from "../services/rawg.js";

describe("RAWG Service", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env.RAWG_API_KEY = "test-api-key";
  });

  describe("searchGames", () => {
    it("formats the URL correctly and maps the response", async () => {
      const mockResponse = {
        results: [
          {
            id: 123,
            name: "Hades",
            background_image: "https://example.com/cover.jpg",
            released: "2020-09-17",
          },
          {
            id: 456,
            name: "Hades II",
            background_image: null,
            released: null,
          },
        ],
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const results = await searchGames("hades");

      expect(fetch).toHaveBeenCalledWith(
        "https://api.rawg.io/api/games?search=hades&page_size=8&key=test-api-key",
      );
      expect(results).toEqual([
        {
          rawgId: 123,
          title: "Hades",
          coverUrl: "https://example.com/cover.jpg",
          released: "2020-09-17",
        },
        {
          rawgId: 456,
          title: "Hades II",
          coverUrl: null,
          released: null,
        },
      ]);
    });

    it("returns an empty array if results are missing", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      const results = await searchGames("hades");
      expect(results).toEqual([]);
    });

    it("throws an error if the API responds with a non-200 status", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 429,
      } as Response);

      await expect(searchGames("hades")).rejects.toThrow(
        "RAWG search failed: 429",
      );
    });
  });

  describe("getGameDetails", () => {
    it("formats the URL correctly and maps full details", async () => {
      const mockResponse = {
        id: 123,
        name: "Hades",
        background_image: "https://example.com/cover.jpg",
        released: "2020-09-17",
        playtime: 10,
        genres: [{ name: "Action" }, { name: "RPG" }],
        developers: [{ name: "Supergiant Games" }],
        platforms: [
          {
            platform: { name: "PC", slug: "pc" },
            released_at: "2020-09-17",
          },
          {
            platform: { name: "Nintendo Switch", slug: "nintendo-switch" },
            released_at: null,
          },
        ],
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const details = await getGameDetails(123);

      expect(fetch).toHaveBeenCalledWith(
        "https://api.rawg.io/api/games/123?key=test-api-key",
      );
      expect(details).toEqual({
        rawgId: 123,
        title: "Hades",
        coverUrl: "https://example.com/cover.jpg",
        releaseDate: new Date("2020-09-17"),
        playtime: 10,
        genres: ["Action", "RPG"],
        developers: ["Supergiant Games"],
        availablePlatforms: [
          { name: "PC", slug: "pc", releasedAt: new Date("2020-09-17") },
          {
            name: "Nintendo Switch",
            slug: "nintendo-switch",
            releasedAt: undefined,
          },
        ],
      });
    });

    it("returns null if the game is not found (404)", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      const details = await getGameDetails(999999);
      expect(details).toBeNull();
    });

    it("throws an error for other API failures", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      await expect(getGameDetails(123)).rejects.toThrow(
        "RAWG details failed: 500",
      );
    });
  });
});
