import { describe, it, expect, vi, beforeEach } from "vitest";
import * as rawg from "../services/rawg";
import * as igdb from "../services/igdb";
import * as gameApi from "../services/gameApi";

vi.mock("../services/rawg");
vi.mock("../services/igdb");

describe("gameApi fallback wrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return RAWG data if RAWG succeeds", async () => {
    (rawg.searchGames as any).mockResolvedValue([{ title: "RAWG Game" }]);

    const result = await gameApi.searchGames("test");

    expect(result[0].title).toBe("RAWG Game");
    expect(igdb.searchGames).not.toHaveBeenCalled();
  });

  it("should fall back to IGDB if RAWG throws an error", async () => {
    vi.mocked(rawg.searchGames).mockRejectedValue(new Error("RAWG down"));
    vi.mocked(igdb.searchGames).mockResolvedValue([{ title: "IGDB Game" }]);

    const result = await gameApi.searchGames("test");
    expect(result[0].title).toBe("IGDB Game");
    expect(rawg.searchGames).toHaveBeenCalled();
    expect(igdb.searchGames).toHaveBeenCalled();
  });

  it("should fall back to IGDB if RAWG times out", async () => {
    (rawg.searchGames as any).mockImplementation(() => new Promise(() => {}));
    (igdb.searchGames as any).mockResolvedValue([{ title: "IGDB Game" }]);

    const result = await gameApi.searchGames("test");

    expect(result[0].title).toBe("IGDB Game");
  }, 10000);
});
