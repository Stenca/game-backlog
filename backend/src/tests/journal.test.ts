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
import journalRouter from "../routes/journal.js";
import gamesRouter from "../routes/games.js";
import authRouter from "../routes/auth.js";
import { UserGame } from "../models/UserGame.js";
import { Game } from "../models/Game.js";
import { User } from "../models/User.js";
import { JournalEntry } from "../models/JournalEntry.js";
import * as rawgService from "../services/rawg.js";

vi.mock("../services/rawg.js", () => ({
  searchGames: vi.fn(),
  getGameDetails: vi.fn(),
}));

const app = express();
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/games", gamesRouter);
app.use("/api/journal", journalRouter);

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
  await JournalEntry.deleteMany({});
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
    coverUrl: "x",
    releaseDate: new Date(),
    playtime: 10,
    genres: ["Action"],
    developers: ["Dev"],
    availablePlatforms: [{ name: "PC", slug: "pc" }],
  });
}

async function createUserGame(token: string, rawgId = 1) {
  mockRawgGame(rawgId, "Hades");
  const res = await request(app)
    .post("/api/games")
    .set("Authorization", `Bearer ${token}`)
    .send({ rawgId, platform: { name: "PC" }, status: "playing" });
  return {
    userGameId: res.body._id,
    gameId: res.body.game._id,
  };
}

describe("GET /api/journal/game/:userGameId", () => {
  it("rejects requests without a token", async () => {
    const res = await request(app).get("/api/journal/game/123");
    expect(res.status).toBe(401);
  });

  it("returns an empty array for a game with no entries", async () => {
    const token = await registerUser("user1", "u1@test.com");
    const { userGameId } = await createUserGame(token);

    const res = await request(app)
      .get(`/api/journal/game/${userGameId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns entries for a game, newest first", async () => {
    const token = await registerUser("user1", "u1@test.com");
    const { userGameId, gameId } = await createUserGame(token);

    await request(app)
      .post("/api/journal")
      .set("Authorization", `Bearer ${token}`)
      .send({ gameId, body: "First entry" });

    await new Promise((resolve) => setTimeout(resolve, 10));

    await request(app)
      .post("/api/journal")
      .set("Authorization", `Bearer ${token}`)
      .send({ gameId, body: "Second entry" });

    const res = await request(app)
      .get(`/api/journal/game/${userGameId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].body).toBe("Second entry");
    expect(res.body[1].body).toBe("First entry");
  });

  it("returns 404 for another user's game", async () => {
    const tokenA = await registerUser("usera", "a@test.com");
    const tokenB = await registerUser("userb", "b@test.com");
    const { userGameId } = await createUserGame(tokenA);

    const res = await request(app)
      .get(`/api/journal/game/${userGameId}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
  });
});

describe("POST /api/journal", () => {
  it("creates a new journal entry", async () => {
    const token = await registerUser("user1", "u1@test.com");
    const { gameId } = await createUserGame(token);

    const res = await request(app)
      .post("/api/journal")
      .set("Authorization", `Bearer ${token}`)
      .send({ gameId, body: "Just beat the first boss!" });

    expect(res.status).toBe(201);
    expect(res.body.body).toBe("Just beat the first boss!");
    expect(res.body._id).toBeDefined();
  });

  it("rejects empty entry text", async () => {
    const token = await registerUser("user1", "u1@test.com");
    const { gameId } = await createUserGame(token);

    const res = await request(app)
      .post("/api/journal")
      .set("Authorization", `Bearer ${token}`)
      .send({ gameId, body: "   " });

    expect(res.status).toBe(400);
  });

  it("rejects entries for games the user doesn't own", async () => {
    const token = await registerUser("user1", "u1@test.com");

    const catalogGame = await Game.create({
      title: "Celeste",
      titleLower: "celeste",
      rawgId: 999,
      availablePlatforms: [],
    });

    const res = await request(app)
      .post("/api/journal")
      .set("Authorization", `Bearer ${token}`)
      .send({ gameId: catalogGame._id, body: "Should fail" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("You don't have this game in your list");
  });
});

describe("PATCH /api/journal/:id", () => {
  async function createEntry(token: string, gameId: string): Promise<string> {
    const res = await request(app)
      .post("/api/journal")
      .set("Authorization", `Bearer ${token}`)
      .send({ gameId, body: "Original body" });
    return res.body._id;
  }

  it("updates an entry", async () => {
    const token = await registerUser("user1", "u1@test.com");
    const { gameId } = await createUserGame(token);
    const entryId = await createEntry(token, gameId);

    const res = await request(app)
      .patch(`/api/journal/${entryId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ body: "Updated body" });

    expect(res.status).toBe(200);
    expect(res.body.body).toBe("Updated body");
  });

  it("rejects updating another user's entry", async () => {
    const tokenA = await registerUser("usera", "a@test.com");
    const tokenB = await registerUser("userb", "b@test.com");
    const { gameId } = await createUserGame(tokenA);
    const entryId = await createEntry(tokenA, gameId);

    const res = await request(app)
      .patch(`/api/journal/${entryId}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ body: "Hacked!" });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/journal/:id", () => {
  async function createEntry(token: string, gameId: string): Promise<string> {
    const res = await request(app)
      .post("/api/journal")
      .set("Authorization", `Bearer ${token}`)
      .send({ gameId, body: "To be deleted" });
    return res.body._id;
  }

  it("deletes an entry", async () => {
    const token = await registerUser("user1", "u1@test.com");
    const { gameId } = await createUserGame(token);
    const entryId = await createEntry(token, gameId);

    const res = await request(app)
      .delete(`/api/journal/${entryId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
    const stillThere = await JournalEntry.findById(entryId);
    expect(stillThere).toBeNull();
  });

  it("rejects deleting another user's entry", async () => {
    const tokenA = await registerUser("usera", "a@test.com");
    const tokenB = await registerUser("userb", "b@test.com");
    const { gameId } = await createUserGame(tokenA);
    const entryId = await createEntry(tokenA, gameId);

    const res = await request(app)
      .delete(`/api/journal/${entryId}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
    const stillThere = await JournalEntry.findById(entryId);
    expect(stillThere).not.toBeNull();
  });
});
