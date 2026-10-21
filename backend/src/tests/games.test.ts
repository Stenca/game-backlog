import "dotenv/config";
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import express from "express";
import gamesRouter from "../routes/games.js";
import authRouter from "../routes/auth.js";
import { UserGame } from "../models/UserGame.js";
import { Game } from "../models/Game.js";
import * as rawgService from "../services/rawg.js";
import { User } from "../models/User.js";

vi.mock("../services/rawg.js", () => ({
  searchGames: vi.fn(),
  getGameDetails: vi.fn(),
}));

const app = express();
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/games", gamesRouter);

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await UserGame.deleteMany({});
  await Game.deleteMany({});
  vi.clearAllMocks();
});

async function registerUser(username: string, email: string): Promise<string> {
  const res = await request(app).post("/api/auth/register").send({
    username,
    displayName: username,
    email,
    password: "Password123",
  });
  return res.body.token;
}

function mockRawgGame(rawgId: number, title: string) {
  vi.mocked(rawgService.getGameDetails).mockResolvedValueOnce({
    rawgId,
    title,
    coverUrl: "https://example.com/cover.jpg",
    releaseDate: new Date("2020-09-17"),
    playtime: 10,
    genres: ["Action", "RPG"],
    developers: ["Supergiant Games"],
    availablePlatforms: [
      { name: "PC", slug: "pc" },
      { name: "Nintendo Switch", slug: "nintendo-switch" },
    ],
  });
}

describe("GET /api/games", () => {
  it("rejects requests without a token", async () => {
    const res = await request(app).get("/api/games");
    expect(res.status).toBe(401);
  });

  it("returns an empty array for a new user", async () => {
    const token = await registerUser("user1", "user1@test.com");
    const res = await request(app)
      .get("/api/games")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns only the requesting user's games", async () => {
    const tokenA = await registerUser("usera", "a@test.com");
    const tokenB = await registerUser("userb", "b@test.com");

    mockRawgGame(1, "Hades");
    await request(app)
      .post("/api/games")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ rawgId: 1, platform: { name: "PC" }, status: "playing" });

    mockRawgGame(2, "Celeste");
    await request(app)
      .post("/api/games")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ rawgId: 2, platform: { name: "PC" }, status: "playing" });

    const resA = await request(app)
      .get("/api/games")
      .set("Authorization", `Bearer ${tokenA}`);
    const resB = await request(app)
      .get("/api/games")
      .set("Authorization", `Bearer ${tokenB}`);

    expect(resA.body).toHaveLength(1);
    expect(resA.body[0].game.title).toBe("Hades");
    expect(resB.body).toHaveLength(1);
    expect(resB.body[0].game.title).toBe("Celeste");
  });
});

describe("POST /api/games", () => {
  it("creates a game and its catalog entry on first add", async () => {
    const token = await registerUser("user1", "user1@test.com");
    mockRawgGame(100, "Hades");

    const res = await request(app)
      .post("/api/games")
      .set("Authorization", `Bearer ${token}`)
      .send({
        rawgId: 100,
        platform: { name: "Nintendo Switch", slug: "nintendo-switch" },
        status: "backlog",
      });

    expect(res.status).toBe(201);
    expect(res.body.game.title).toBe("Hades");
    expect(res.body.game.rawgId).toBe(100);
    expect(res.body.platform.name).toBe("Nintendo Switch");

    const catalog = await Game.findOne({ rawgId: 100 });
    expect(catalog).not.toBeNull();
    expect(catalog!.title).toBe("Hades");
  });

  it("reuses the catalog entry for a second user adding the same game", async () => {
    const tokenA = await registerUser("usera", "a@test.com");
    const tokenB = await registerUser("userb", "b@test.com");

    mockRawgGame(100, "Hades");
    await request(app)
      .post("/api/games")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ rawgId: 100, platform: { name: "PC" }, status: "backlog" });

    const resB = await request(app)
      .post("/api/games")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ rawgId: 100, platform: { name: "PC" }, status: "playing" });

    expect(resB.status).toBe(201);
    expect(vi.mocked(rawgService.getGameDetails)).toHaveBeenCalledTimes(1);

    const catalogCount = await Game.countDocuments({ rawgId: 100 });
    expect(catalogCount).toBe(1);
  });

  it("rejects a duplicate game on the same platform", async () => {
    const token = await registerUser("user1", "user1@test.com");
    mockRawgGame(100, "Hades");

    await request(app)
      .post("/api/games")
      .set("Authorization", `Bearer ${token}`)
      .send({ rawgId: 100, platform: { name: "PC" }, status: "backlog" });

    const res = await request(app)
      .post("/api/games")
      .set("Authorization", `Bearer ${token}`)
      .send({ rawgId: 100, platform: { name: "PC" }, status: "playing" });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("You already have this game");
  });

  it("allows the same game on different platforms", async () => {
    const token = await registerUser("user1", "user1@test.com");
    mockRawgGame(100, "Hades");

    await request(app)
      .post("/api/games")
      .set("Authorization", `Bearer ${token}`)
      .send({ rawgId: 100, platform: { name: "PC" }, status: "backlog" });

    const res = await request(app)
      .post("/api/games")
      .set("Authorization", `Bearer ${token}`)
      .send({
        rawgId: 100,
        platform: { name: "Nintendo Switch" },
        status: "playing",
      });

    expect(res.status).toBe(201);
  });

  it("returns 404 when RAWG doesn't know the game", async () => {
    const token = await registerUser("user1", "user1@test.com");
    vi.mocked(rawgService.getGameDetails).mockResolvedValueOnce(null);

    const res = await request(app)
      .post("/api/games")
      .set("Authorization", `Bearer ${token}`)
      .send({ rawgId: 999999, platform: { name: "PC" }, status: "backlog" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Game not found on RAWG");
  });

  it("rejects invalid input", async () => {
    const token = await registerUser("user1", "user1@test.com");

    const res = await request(app)
      .post("/api/games")
      .set("Authorization", `Bearer ${token}`)
      .send({ rawgId: -5, platform: { name: "PC" }, status: "nope" });

    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/games/:id", () => {
  async function createGameFor(token: string, rawgId = 1): Promise<string> {
    mockRawgGame(rawgId, "Hades");
    const res = await request(app)
      .post("/api/games")
      .set("Authorization", `Bearer ${token}`)
      .send({ rawgId, platform: { name: "PC" }, status: "backlog" });
    return res.body._id;
  }

  it("updates the status", async () => {
    const token = await registerUser("user1", "user1@test.com");
    const gameId = await createGameFor(token);

    const res = await request(app)
      .patch(`/api/games/${gameId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "completed" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("completed");
  });

  it("returns 404 for another user's game", async () => {
    const tokenA = await registerUser("usera", "a@test.com");
    const tokenB = await registerUser("userb", "b@test.com");
    const gameId = await createGameFor(tokenA);

    const res = await request(app)
      .patch(`/api/games/${gameId}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ status: "completed" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Game not found");
  });

  it("returns 400 for an invalid id format", async () => {
    const token = await registerUser("user1", "user1@test.com");

    const res = await request(app)
      .patch("/api/games/not-a-real-id")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "completed" });

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/games/:id", () => {
  async function createGameFor(token: string): Promise<string> {
    mockRawgGame(1, "Hades");
    const res = await request(app)
      .post("/api/games")
      .set("Authorization", `Bearer ${token}`)
      .send({ rawgId: 1, platform: { name: "PC" }, status: "backlog" });
    return res.body._id;
  }

  it("deletes the user's game", async () => {
    const token = await registerUser("user1", "user1@test.com");
    const gameId = await createGameFor(token);

    const res = await request(app)
      .delete(`/api/games/${gameId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);

    const stillThere = await UserGame.findById(gameId);
    expect(stillThere).toBeNull();
  });

  it("does not delete the shared catalog entry", async () => {
    const token = await registerUser("user1", "user1@test.com");
    const gameId = await createGameFor(token);

    await request(app)
      .delete(`/api/games/${gameId}`)
      .set("Authorization", `Bearer ${token}`);

    const catalog = await Game.findOne({ rawgId: 1 });
    expect(catalog).not.toBeNull();
  });

  it("returns 404 for another user's game", async () => {
    const tokenA = await registerUser("usera", "a@test.com");
    const tokenB = await registerUser("userb", "b@test.com");
    const gameId = await createGameFor(tokenA);

    const res = await request(app)
      .delete(`/api/games/${gameId}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(404);

    const stillThere = await UserGame.findById(gameId);
    expect(stillThere).not.toBeNull();
  });
});

describe("GET /api/games/search", () => {
  it("returns an empty array for queries shorter than 2 characters", async () => {
    const token = await registerUser("user1", "user1@test.com");

    const res = await request(app)
      .get("/api/games/search?q=h")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(vi.mocked(rawgService.searchGames)).not.toHaveBeenCalled();
  });

  it("returns search results from RAWG", async () => {
    const token = await registerUser("user1", "user1@test.com");
    vi.mocked(rawgService.searchGames).mockResolvedValueOnce([
      { rawgId: 100, title: "Hades", coverUrl: "x", released: "2020-09-17" },
    ]);

    const res = await request(app)
      .get("/api/games/search?q=hades")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe("Hades");
  });

  it("returns 502 when RAWG fails", async () => {
    const token = await registerUser("user1", "user1@test.com");
    vi.mocked(rawgService.searchGames).mockRejectedValueOnce(
      new Error("RAWG down"),
    );

    const res = await request(app)
      .get("/api/games/search?q=hades")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(502);
  });
});
