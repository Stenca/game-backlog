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
import * as gameApi from "../services/gameApi.js";
import { User } from "../models/User.js";

vi.mock("../services/gameApi.js", () => ({
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
  await Promise.all([
    User.deleteMany({}),
    UserGame.deleteMany({}),
    Game.deleteMany({}),
  ]);

  vi.clearAllMocks();
});

async function registerUser(username: string, email: string): Promise<string> {
  const res = await request(app).post("/api/auth/register").send({
    username,
    displayName: username,
    email,
    password: "Password123",
  });

  expect(res.status).toBe(201);

  return res.body.token;
}

function mockGame(rawgId: number, title: string) {
  vi.mocked(gameApi.getGameDetails).mockResolvedValueOnce({
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

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function createGameFor(
  token: string,
  rawgId = 1,
  title = "Hades",
  platform = "PC",
): Promise<string> {
  mockGame(rawgId, title);

  const res = await request(app)
    .post("/api/games")
    .set(auth(token))
    .send({
      rawgId,
      platform: { name: platform },
      status: "backlog",
    });

  expect(res.status).toBe(201);

  return res.body._id;
}

describe("Authentication", () => {
  it("rejects requests without a token", async () => {
    const res = await request(app).get("/api/games");

    expect(res.status).toBe(401);
  });
});

describe("GET /api/games", () => {
  it("returns an empty array for a new user", async () => {
    const token = await registerUser("user1", "user1@test.com");

    const res = await request(app).get("/api/games").set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns only the requesting user's games", async () => {
    const tokenA = await registerUser("usera", "a@test.com");
    const tokenB = await registerUser("userb", "b@test.com");

    await createGameFor(tokenA, 1, "Hades");
    await createGameFor(tokenB, 2, "Celeste");

    const resA = await request(app).get("/api/games").set(auth(tokenA));

    const resB = await request(app).get("/api/games").set(auth(tokenB));

    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);

    expect(resA.body).toHaveLength(1);
    expect(resA.body[0].game.title).toBe("Hades");

    expect(resB.body).toHaveLength(1);
    expect(resB.body[0].game.title).toBe("Celeste");
  });

  it("returns another user's games when a username is requested", async () => {
    const tokenA = await registerUser("usera", "a@test.com");
    const tokenB = await registerUser("userb", "b@test.com");

    await createGameFor(tokenA, 1, "Hades");

    const res = await request(app)
      .get("/api/games?user=usera")
      .set(auth(tokenB));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].game.title).toBe("Hades");
  });

  it("returns 404 for an unknown username", async () => {
    const token = await registerUser("user1", "user1@test.com");

    const res = await request(app)
      .get("/api/games?user=unknown")
      .set(auth(token));

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("User not found");
  });

  it("returns games in newest-first order", async () => {
    const token = await registerUser("user1", "user1@test.com");

    await createGameFor(token, 1, "Hades");
    await createGameFor(token, 2, "Celeste");

    const res = await request(app).get("/api/games").set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].game.title).toBe("Celeste");
    expect(res.body[1].game.title).toBe("Hades");
  });
});

describe("GET /api/games/search", () => {
  it("returns an empty array for queries shorter than 2 characters", async () => {
    const token = await registerUser("user1", "user1@test.com");

    const res = await request(app)
      .get("/api/games/search?q=h")
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(gameApi.searchGames).not.toHaveBeenCalled();
  });

  it("returns search results", async () => {
    const token = await registerUser("user1", "user1@test.com");

    vi.mocked(gameApi.searchGames).mockResolvedValueOnce([
      {
        rawgId: 100,
        title: "Hades",
        coverUrl: "https://example.com/cover.jpg",
        released: "2020-09-17",
      },
    ]);

    const res = await request(app)
      .get("/api/games/search?q=hades")
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe("Hades");
    expect(gameApi.searchGames).toHaveBeenCalledWith("hades");
  });

  it("trims whitespace from the search query", async () => {
    const token = await registerUser("user1", "user1@test.com");

    vi.mocked(gameApi.searchGames).mockResolvedValueOnce([]);

    const res = await request(app)
      .get("/api/games/search?q=%20hades%20")
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(gameApi.searchGames).toHaveBeenCalledWith("hades");
  });

  it("returns 502 when the search service fails", async () => {
    const token = await registerUser("user1", "user1@test.com");

    vi.mocked(gameApi.searchGames).mockRejectedValueOnce(
      new Error("API unavailable"),
    );

    const res = await request(app)
      .get("/api/games/search?q=hades")
      .set(auth(token));

    expect(res.status).toBe(502);
    expect(res.body.error).toBe("Search unavailable");
  });
});

describe("GET /api/games/details/:rawgId", () => {
  it("returns game details", async () => {
    const token = await registerUser("user1", "user1@test.com");

    mockGame(100, "Hades");

    const res = await request(app)
      .get("/api/games/details/100")
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Hades");
    expect(gameApi.getGameDetails).toHaveBeenCalledWith(100);
  });

  it("rejects an invalid rawgId", async () => {
    const token = await registerUser("user1", "user1@test.com");

    const res = await request(app)
      .get("/api/games/details/invalid")
      .set(auth(token));

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid rawgId");
  });

  it("returns 404 when the game does not exist", async () => {
    const token = await registerUser("user1", "user1@test.com");

    vi.mocked(gameApi.getGameDetails).mockResolvedValueOnce(null);

    const res = await request(app)
      .get("/api/games/details/999999")
      .set(auth(token));

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Game not found on API");
  });
});

describe("POST /api/games", () => {
  it("creates a game and its catalog entry on first add", async () => {
    const token = await registerUser("user1", "user1@test.com");

    mockGame(100, "Hades");

    const res = await request(app)
      .post("/api/games")
      .set(auth(token))
      .send({
        rawgId: 100,
        platform: {
          name: "Nintendo Switch",
          slug: "nintendo-switch",
        },
        status: "backlog",
      });

    expect(res.status).toBe(201);
    expect(res.body.game.title).toBe("Hades");
    expect(res.body.game.rawgId).toBe(100);
    expect(res.body.platform.name).toBe("Nintendo Switch");

    const catalog = await Game.findOne({ rawgId: 100 });

    expect(catalog).not.toBeNull();
    expect(catalog!.title).toBe("Hades");
    expect(catalog!.titleLower).toBe("hades");
  });

  it("reuses the catalog entry for a second user adding the same game", async () => {
    const tokenA = await registerUser("usera", "a@test.com");
    const tokenB = await registerUser("userb", "b@test.com");

    mockGame(100, "Hades");

    await request(app)
      .post("/api/games")
      .set(auth(tokenA))
      .send({
        rawgId: 100,
        platform: { name: "PC" },
        status: "backlog",
      });

    const resB = await request(app)
      .post("/api/games")
      .set(auth(tokenB))
      .send({
        rawgId: 100,
        platform: { name: "PC" },
        status: "playing",
      });

    expect(resB.status).toBe(201);
    expect(gameApi.getGameDetails).toHaveBeenCalledTimes(1);

    const catalogCount = await Game.countDocuments({ rawgId: 100 });

    expect(catalogCount).toBe(1);
  });

  it("rejects a duplicate game on the same platform", async () => {
    const token = await registerUser("user1", "user1@test.com");

    await createGameFor(token, 100, "Hades");

    const res = await request(app)
      .post("/api/games")
      .set(auth(token))
      .send({
        rawgId: 100,
        platform: { name: "PC" },
        status: "playing",
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("You already have this game");
  });

  it("allows the same game on different platforms", async () => {
    const token = await registerUser("user1", "user1@test.com");

    await createGameFor(token, 100, "Hades", "PC");

    const res = await request(app)
      .post("/api/games")
      .set(auth(token))
      .send({
        rawgId: 100,
        platform: { name: "Nintendo Switch" },
        status: "playing",
      });

    expect(res.status).toBe(201);
  });

  it("reuses an existing catalog entry with the same title", async () => {
    const token = await registerUser("user1", "user1@test.com");

    await createGameFor(token, 100, "Hades");

    mockGame(200, "Hades");

    const res = await request(app)
      .post("/api/games")
      .set(auth(token))
      .send({
        rawgId: 200,
        platform: { name: "Nintendo Switch" },
        status: "backlog",
      });

    expect(res.status).toBe(201);
    expect(res.body.game.title).toBe("Hades");

    const catalogCount = await Game.countDocuments({
      titleLower: "hades",
    });

    expect(catalogCount).toBe(1);
  });

  it("returns 404 when the API does not know the game", async () => {
    const token = await registerUser("user1", "user1@test.com");

    vi.mocked(gameApi.getGameDetails).mockResolvedValueOnce(null);

    const res = await request(app)
      .post("/api/games")
      .set(auth(token))
      .send({
        rawgId: 999999,
        platform: { name: "PC" },
        status: "backlog",
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Game not found on API");
  });

  it("rejects invalid input", async () => {
    const token = await registerUser("user1", "user1@test.com");

    const res = await request(app)
      .post("/api/games")
      .set(auth(token))
      .send({
        rawgId: -5,
        platform: { name: "PC" },
        status: "nope",
      });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/games/:id", () => {
  it("returns a user's game with populated game and user information", async () => {
    const token = await registerUser("user1", "user1@test.com");

    const gameId = await createGameFor(token);

    const res = await request(app).get(`/api/games/${gameId}`).set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.game.title).toBe("Hades");
    expect(res.body.userId.username).toBe("user1");
  });

  it("returns 404 when the game does not exist", async () => {
    const token = await registerUser("user1", "user1@test.com");

    const id = new mongoose.Types.ObjectId();

    const res = await request(app).get(`/api/games/${id}`).set(auth(token));

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Game not found");
  });

  it("returns 400 for an invalid id", async () => {
    const token = await registerUser("user1", "user1@test.com");

    const res = await request(app)
      .get("/api/games/not-a-real-id")
      .set(auth(token));

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid id");
  });
});

describe("PATCH /api/games/:id", () => {
  it("updates the status", async () => {
    const token = await registerUser("user1", "user1@test.com");

    const gameId = await createGameFor(token);

    const res = await request(app)
      .patch(`/api/games/${gameId}`)
      .set(auth(token))
      .send({ status: "completed" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("completed");
    expect(res.body.game.title).toBe("Hades");
  });

  it("updates the rating", async () => {
    const token = await registerUser("user1", "user1@test.com");

    const gameId = await createGameFor(token);

    const res = await request(app)
      .patch(`/api/games/${gameId}`)
      .set(auth(token))
      .send({ rating: 5 });

    expect(res.status).toBe(200);
    expect(res.body.rating).toBe(5);
  });

  it("rejects an invalid rating", async () => {
    const token = await registerUser("user1", "user1@test.com");

    const gameId = await createGameFor(token);

    const res = await request(app)
      .patch(`/api/games/${gameId}`)
      .set(auth(token))
      .send({ rating: 10 });

    expect(res.status).toBe(400);
  });

  it("returns 404 for another user's game", async () => {
    const tokenA = await registerUser("usera", "a@test.com");
    const tokenB = await registerUser("userb", "b@test.com");

    const gameId = await createGameFor(tokenA);

    const res = await request(app)
      .patch(`/api/games/${gameId}`)
      .set(auth(tokenB))
      .send({ status: "completed" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Game not found");
  });

  it("returns 404 when the game does not exist", async () => {
    const token = await registerUser("user1", "user1@test.com");

    const id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .patch(`/api/games/${id}`)
      .set(auth(token))
      .send({ status: "completed" });

    expect(res.status).toBe(404);
  });

  it("returns 400 for an invalid id format", async () => {
    const token = await registerUser("user1", "user1@test.com");

    const res = await request(app)
      .patch("/api/games/not-a-real-id")
      .set(auth(token))
      .send({ status: "completed" });

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/games/:id", () => {
  it("deletes the user's game", async () => {
    const token = await registerUser("user1", "user1@test.com");

    const gameId = await createGameFor(token);

    const res = await request(app)
      .delete(`/api/games/${gameId}`)
      .set(auth(token));

    expect(res.status).toBe(204);

    const stillThere = await UserGame.findById(gameId);

    expect(stillThere).toBeNull();
  });

  it("does not delete the shared catalog entry", async () => {
    const token = await registerUser("user1", "user1@test.com");

    await createGameFor(token);

    const res = await request(app)
      .delete("/api/games/" + (await UserGame.findOne({})!)._id)
      .set(auth(token));

    expect(res.status).toBe(204);

    const catalog = await Game.findOne({ rawgId: 1 });

    expect(catalog).not.toBeNull();
  });

  it("returns 404 for another user's game", async () => {
    const tokenA = await registerUser("usera", "a@test.com");
    const tokenB = await registerUser("userb", "b@test.com");

    const gameId = await createGameFor(tokenA);

    const res = await request(app)
      .delete(`/api/games/${gameId}`)
      .set(auth(tokenB));

    expect(res.status).toBe(404);

    const stillThere = await UserGame.findById(gameId);

    expect(stillThere).not.toBeNull();
  });

  it("returns 404 when the game does not exist", async () => {
    const token = await registerUser("user1", "user1@test.com");

    const id = new mongoose.Types.ObjectId();

    const res = await request(app).delete(`/api/games/${id}`).set(auth(token));

    expect(res.status).toBe(404);
  });

  it("returns 400 for an invalid id", async () => {
    const token = await registerUser("user1", "user1@test.com");

    const res = await request(app)
      .delete("/api/games/not-a-real-id")
      .set(auth(token));

    expect(res.status).toBe(400);
  });
});
