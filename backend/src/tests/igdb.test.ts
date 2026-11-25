import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../utils/platforms", () => ({
  getPlatformAbbreviation: vi.fn((name: string) => {
    const abbreviations: Record<string, string> = {
      "PC (Microsoft Windows)": "PC",
      "PlayStation 5": "PS5",
      "Nintendo Switch": "Switch",
    };

    return abbreviations[name] ?? name;
  }),
}));

const fetchMock = vi.fn();

const mockResponse = (data: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(data),
  }) as unknown as Response;

describe("igdb", () => {
  let searchGames: typeof import("../services/igdb").searchGames;
  let getGameDetails: typeof import("../services/igdb").getGameDetails;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    vi.stubEnv("TWITCH_CLIENT_ID", "test-client-id");
    vi.stubEnv("TWITCH_CLIENT_SECRET", "test-client-secret");
    vi.stubGlobal("fetch", fetchMock);

    fetchMock.mockReset();

    const igdb = await import("../services/igdb");

    searchGames = igdb.searchGames;
    getGameDetails = igdb.getGameDetails;
  });

  describe("searchGames", () => {
    it("retrieves an access token and searches IGDB", async () => {
      fetchMock
        .mockResolvedValueOnce(
          mockResponse({ access_token: "test-access-token" }),
        )
        .mockResolvedValueOnce(mockResponse([]));

      await searchGames("Hades");

      expect(fetchMock).toHaveBeenCalledTimes(2);

      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        "https://id.twitch.tv/oauth2/token",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }),
      );

      const tokenRequest = fetchMock.mock.calls[0][1];

      expect(tokenRequest.body).toEqual(
        new URLSearchParams({
          client_id: "test-client-id",
          client_secret: "test-client-secret",
          grant_type: "client_credentials",
        }),
      );

      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        "https://api.igdb.com/v4/games",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Client-ID": "test-client-id",
            Authorization: "Bearer test-access-token",
            Accept: "application/json",
          },
          body: 'search "Hades"; fields name, cover.url, first_release_date; limit 8;',
        }),
      );
    });

    it("returns mapped search results", async () => {
      fetchMock
        .mockResolvedValueOnce(
          mockResponse({ access_token: "test-access-token" }),
        )
        .mockResolvedValueOnce(
          mockResponse([
            {
              id: 123,
              name: "Hades",
              cover: {
                url: "//images.igdb.com/igdb/image/upload/t_thumb/cover.jpg",
              },
              first_release_date: 1600300800,
            },
            {
              id: 456,
              name: "Hades II",
            },
          ]),
        );

      const result = await searchGames("Hades");

      expect(result).toEqual([
        {
          rawgId: 123,
          title: "Hades",
          coverUrl:
            "https://images.igdb.com/igdb/image/upload/t_cover_big/cover.jpg",
          released: new Date(1600300800 * 1000).toISOString(),
        },
        {
          rawgId: 456,
          title: "Hades II",
          coverUrl: undefined,
          released: undefined,
        },
      ]);
    });

    it("returns an empty array when IGDB returns null", async () => {
      fetchMock
        .mockResolvedValueOnce(
          mockResponse({ access_token: "test-access-token" }),
        )
        .mockResolvedValueOnce(mockResponse(null));

      const result = await searchGames("Unknown");

      expect(result).toEqual([]);
    });

    it("reuses the cached access token", async () => {
      fetchMock
        .mockResolvedValueOnce(
          mockResponse({ access_token: "test-access-token" }),
        )
        .mockResolvedValueOnce(mockResponse([]))
        .mockResolvedValueOnce(mockResponse([]));

      await searchGames("Hades");
      await searchGames("Hades II");

      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(fetchMock.mock.calls[0][0]).toBe(
        "https://id.twitch.tv/oauth2/token",
      );
      expect(fetchMock.mock.calls[1][0]).toBe("https://api.igdb.com/v4/games");
      expect(fetchMock.mock.calls[2][0]).toBe("https://api.igdb.com/v4/games");
    });

    it("throws when token retrieval fails", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse({}, 401));

      await expect(searchGames("Hades")).rejects.toThrow(
        "Twitch token failed: 401",
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("throws when the IGDB search fails", async () => {
      fetchMock
        .mockResolvedValueOnce(
          mockResponse({ access_token: "test-access-token" }),
        )
        .mockResolvedValueOnce(mockResponse({}, 500));

      await expect(searchGames("Hades")).rejects.toThrow(
        "IGDB search failed: 500",
      );
    });
  });

  describe("getGameDetails", () => {
    it("requests details for the specified game", async () => {
      fetchMock
        .mockResolvedValueOnce(
          mockResponse({ access_token: "test-access-token" }),
        )
        .mockResolvedValueOnce(mockResponse([]));

      await getGameDetails(123);

      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        "https://api.igdb.com/v4/games",
        expect.objectContaining({
          method: "POST",
          body: "where id = 123; fields name, cover.url, first_release_date, genres.name, involved_companies.company.name, platforms.name; limit 1;",
        }),
      );
    });

    it("returns mapped game details", async () => {
      fetchMock
        .mockResolvedValueOnce(
          mockResponse({ access_token: "test-access-token" }),
        )
        .mockResolvedValueOnce(
          mockResponse([
            {
              id: 123,
              name: "Hades",
              cover: {
                url: "//images.igdb.com/igdb/image/upload/t_thumb/cover.jpg",
              },
              first_release_date: 1600300800,
              genres: [{ name: "Action" }, { name: "Roguelike" }],
              involved_companies: [
                { company: { name: "Supergiant Games" } },
                { company: null },
              ],
              platforms: [
                { name: "PC (Microsoft Windows)" },
                { name: "PlayStation 5" },
                { name: "Nintendo Switch" },
              ],
            },
          ]),
        );

      const result = await getGameDetails(123);

      expect(result).toEqual({
        rawgId: 123,
        title: "Hades",
        coverUrl:
          "https://images.igdb.com/igdb/image/upload/t_cover_big/cover.jpg",
        releaseDate: new Date(1600300800 * 1000).toISOString(),
        playtime: undefined,
        genres: ["Action", "Roguelike"],
        developers: ["Supergiant Games"],
        availablePlatforms: [
          {
            name: "PC",
            slug: "pc",
            releasedAt: undefined,
          },
          {
            name: "PS5",
            slug: "ps5",
            releasedAt: undefined,
          },
          {
            name: "Switch",
            slug: "switch",
            releasedAt: undefined,
          },
        ],
      });
    });

    it("returns empty arrays when optional collections are missing", async () => {
      fetchMock
        .mockResolvedValueOnce(
          mockResponse({ access_token: "test-access-token" }),
        )
        .mockResolvedValueOnce(
          mockResponse([
            {
              id: 123,
              name: "Hades",
            },
          ]),
        );

      const result = await getGameDetails(123);

      expect(result).toEqual({
        rawgId: 123,
        title: "Hades",
        coverUrl: undefined,
        releaseDate: undefined,
        playtime: undefined,
        genres: [],
        developers: [],
        availablePlatforms: [],
      });
    });

    it("returns null when the game does not exist", async () => {
      fetchMock
        .mockResolvedValueOnce(
          mockResponse({ access_token: "test-access-token" }),
        )
        .mockResolvedValueOnce(mockResponse([]));

      const result = await getGameDetails(999);

      expect(result).toBeNull();
    });

    it("throws when token retrieval fails", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse({}, 401));

      await expect(getGameDetails(123)).rejects.toThrow(
        "Twitch token failed: 401",
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("throws when the IGDB details request fails", async () => {
      fetchMock
        .mockResolvedValueOnce(
          mockResponse({ access_token: "test-access-token" }),
        )
        .mockResolvedValueOnce(mockResponse({}, 500));

      await expect(getGameDetails(123)).rejects.toThrow(
        "IGDB details failed: 500",
      );

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });
});
