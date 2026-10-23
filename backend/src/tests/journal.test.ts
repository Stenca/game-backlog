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
import cloudinary from "../utils/cloudinary.js";

vi.mock("../services/rawg.js", () => ({
  searchGames: vi.fn(),
  getGameDetails: vi.fn(),
}));

vi.mock("../utils/cloudinary.js", () => ({
  default: {
    uploader: {
      upload: vi.fn(),
      destroy: vi.fn(),
    },
  },
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

async function createEntryWithImage(token: string, gameId: string) {
  vi.mocked(cloudinary.uploader.upload).mockResolvedValueOnce({
    secure_url: "https://cloudinary.com/test-image.jpg",
    public_id: "bonfire-journals/test-id",
  } as any);

  const res = await request(app)
    .post("/api/journal")
    .set("Authorization", `Bearer ${token}`)
    .field("gameId", gameId)
    .field("body", "Screenshot of the boss fight")
    .attach("image", Buffer.from("fake image data"), "test.jpg");

  return res.body;
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
});

describe("POST /api/journal", () => {
  it("creates a text-only entry", async () => {
    const token = await registerUser("user1", "u1@test.com");
    const { gameId } = await createUserGame(token);

    const res = await request(app)
      .post("/api/journal")
      .set("Authorization", `Bearer ${token}`)
      .send({ gameId, body: "Just beat the first boss!" });

    expect(res.status).toBe(201);
    expect(res.body.body).toBe("Just beat the first boss!");
    expect(res.body.imageUrl).toBeUndefined();
  });

  it("creates an image-only entry", async () => {
    const token = await registerUser("user1", "u1@test.com");
    const { gameId } = await createUserGame(token);

    vi.mocked(cloudinary.uploader.upload).mockResolvedValueOnce({
      secure_url: "https://cloudinary.com/test-image.jpg",
      public_id: "bonfire-journals/test-id",
    } as any);

    const res = await request(app)
      .post("/api/journal")
      .set("Authorization", `Bearer ${token}`)
      .field("gameId", gameId)
      .attach("image", Buffer.from("fake image data"), "test.jpg");

    expect(res.status).toBe(201);
    expect(res.body.imageUrl).toBe("https://cloudinary.com/test-image.jpg");
    expect(res.body.imagePublicId).toBe("bonfire-journals/test-id");
    expect(res.body.body).toBeUndefined();
  });

  it("rejects entries with neither text nor image", async () => {
    const token = await registerUser("user1", "u1@test.com");
    const { gameId } = await createUserGame(token);

    const res = await request(app)
      .post("/api/journal")
      .set("Authorization", `Bearer ${token}`)
      .send({ gameId });

    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/journal/:id", () => {
  it("updates the text of an entry", async () => {
    const token = await registerUser("user1", "u1@test.com");
    const { gameId } = await createUserGame(token);
    const entry = await createEntryWithImage(token, gameId);

    const res = await request(app)
      .patch(`/api/journal/${entry._id}`)
      .set("Authorization", `Bearer ${token}`)
      .field("body", "Updated text");

    expect(res.status).toBe(200);
    expect(res.body.body).toBe("Updated text");
    expect(res.body.imageUrl).toBe(entry.imageUrl);
  });

  it("removes the image when removeImage=true", async () => {
    const token = await registerUser("user1", "u1@test.com");
    const { gameId } = await createUserGame(token);
    const entry = await createEntryWithImage(token, gameId);

    const res = await request(app)
      .patch(`/api/journal/${entry._id}`)
      .set("Authorization", `Bearer ${token}`)
      .field("body", "Text stays")
      .field("removeImage", "true");

    expect(res.status).toBe(200);
    expect(res.body.body).toBe("Text stays");
    expect(res.body.imageUrl).toBeUndefined();
    expect(res.body.imagePublicId).toBeUndefined();

    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
      "bonfire-journals/test-id",
      { invalidate: true, resource_type: "image" },
    );
  });

  it("deletes the entry if both text and image are removed", async () => {
    const token = await registerUser("user1", "u1@test.com");
    const { gameId } = await createUserGame(token);
    const entry = await createEntryWithImage(token, gameId);

    const res = await request(app)
      .patch(`/api/journal/${entry._id}`)
      .set("Authorization", `Bearer ${token}`)
      .field("body", "")
      .field("removeImage", "true");

    expect(res.status).toBe(204);

    const stillThere = await JournalEntry.findById(entry._id);
    expect(stillThere).toBeNull();
  });

  it("replaces the image when a new file is uploaded", async () => {
    const token = await registerUser("user1", "u1@test.com");
    const { gameId } = await createUserGame(token);
    const entry = await createEntryWithImage(token, gameId);

    vi.mocked(cloudinary.uploader.upload).mockResolvedValueOnce({
      secure_url: "https://cloudinary.com/new-image.jpg",
      public_id: "bonfire-journals/new-id",
    } as any);

    const res = await request(app)
      .patch(`/api/journal/${entry._id}`)
      .set("Authorization", `Bearer ${token}`)
      .field("body", "Updated text")
      .attach("image", Buffer.from("new fake image data"), "new.jpg");

    expect(res.status).toBe(200);
    expect(res.body.imageUrl).toBe("https://cloudinary.com/new-image.jpg");
    expect(res.body.imagePublicId).toBe("bonfire-journals/new-id");

    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
      "bonfire-journals/test-id",
      { invalidate: true, resource_type: "image" },
    );
  });
});

describe("DELETE /api/journal/:id", () => {
  it("deletes the entry and the image from Cloudinary", async () => {
    const token = await registerUser("user1", "u1@test.com");
    const { gameId } = await createUserGame(token);
    const entry = await createEntryWithImage(token, gameId);

    const res = await request(app)
      .delete(`/api/journal/${entry._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);

    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
      "bonfire-journals/test-id",
      { invalidate: true, resource_type: "image" },
    );

    const stillThere = await JournalEntry.findById(entry._id);
    expect(stillThere).toBeNull();
  });

  it("rejects deleting another user's entry", async () => {
    const tokenA = await registerUser("usera", "a@test.com");
    const tokenB = await registerUser("userb", "b@test.com");
    const { gameId } = await createUserGame(tokenA);
    const entry = await createEntryWithImage(tokenA, gameId);

    const res = await request(app)
      .delete(`/api/journal/${entry._id}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(404);

    const stillThere = await JournalEntry.findById(entry._id);
    expect(stillThere).not.toBeNull();
  });
});
