import "dotenv/config";
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import express from "express";

vi.mock("../middleware/requireAuth.js", () => ({
  requireAuth: (req: any, res: any, next: any) => {
    const userId = req.header("x-user-id");

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.userId = userId;
    next();
  },
}));

import feedRouter from "../routes/feed.js";
import { User } from "../models/User.js";
import { Game } from "../models/Game.js";
import { UserGame } from "../models/UserGame.js";
import { JournalEntry } from "../models/JournalEntry.js";
import { Comment } from "../models/Comment.js";

const app = express();
app.use(express.json());
app.use("/api/feed", feedRouter);

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
    Game.deleteMany({}),
    UserGame.deleteMany({}),
    JournalEntry.deleteMany({}),
    Comment.deleteMany({}),
  ]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function createUser(username = "testuser", email = "test@example.com") {
  return User.create({
    username,
    displayName: username,
    email,
  });
}

async function createGame(title = "Test Game") {
  return Game.create({
    title,
    titleLower: title.toLowerCase(),
  });
}

async function createUserGame(
  userId: mongoose.Types.ObjectId,
  gameId: mongoose.Types.ObjectId,
  platformName = "PC",
) {
  return UserGame.create({
    userId,
    gameId,
    platform: {
      name: platformName,
      slug: platformName.toLowerCase(),
    },
    status: "backlog",
  });
}

async function createJournalEntry(
  userId: mongoose.Types.ObjectId,
  gameId: mongoose.Types.ObjectId,
  body = "Test journal entry",
) {
  return JournalEntry.create({
    userId,
    gameId,
    body,
  });
}

async function createComment(
  userId: mongoose.Types.ObjectId,
  entryId: mongoose.Types.ObjectId,
  text = "Test comment",
) {
  return Comment.create({
    userId,
    entryId,
    text,
  });
}

function auth(userId: mongoose.Types.ObjectId) {
  return { "x-user-id": userId.toString() };
}

describe("GET /api/feed", () => {
  it("rejects requests without authentication", async () => {
    const res = await request(app).get("/api/feed");

    expect(res.status).toBe(401);
  });

  it("returns an empty array when there is no activity", async () => {
    const user = await createUser();

    const res = await request(app).get("/api/feed").set(auth(user._id));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns game activity with populated user and game", async () => {
    const user = await createUser();
    const game = await createGame("Elden Ring");

    await createUserGame(user._id, game._id);

    const res = await request(app).get("/api/feed").set(auth(user._id));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);

    expect(res.body[0]).toMatchObject({
      userGameId: expect.any(String),
      type: "ADD_GAME",
      content: "added Elden Ring to their library",
      user: {
        username: "testuser",
        displayName: "testuser",
      },
      game: {
        title: "Elden Ring",
      },
    });

    expect(res.body[0].id).toBe(res.body[0].userGameId);
    expect(res.body[0].createdAt).toBeDefined();
  });

  it("returns journal activity with its body and associated UserGame", async () => {
    const user = await createUser();
    const game = await createGame("Hades");

    await createUserGame(user._id, game._id);

    const entry = await createJournalEntry(
      user._id,
      game._id,
      "Finished my first run.",
    );

    const res = await request(app).get("/api/feed").set(auth(user._id));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);

    const journalItem = res.body.find((item: any) => item.type === "JOURNAL");

    expect(journalItem).toMatchObject({
      id: entry._id.toString(),
      type: "JOURNAL",
      userGameId: expect.any(String),
      content: "wrote a journal entry for Hades",
      body: "Finished my first run.",
      user: {
        username: "testuser",
      },
      game: {
        title: "Hades",
      },
    });
  });

  it("returns null as userGameId when a journal has no matching UserGame", async () => {
    const user = await createUser();
    const game = await createGame("Celeste");

    await createJournalEntry(
      user._id,
      game._id,
      "A journal without a library entry.",
    );

    const res = await request(app).get("/api/feed").set(auth(user._id));

    expect(res.status).toBe(200);

    const journalItem = res.body.find((item: any) => item.type === "JOURNAL");

    expect(journalItem.userGameId).toBeNull();
  });

  it("returns comment activity with its associated game and journal owner", async () => {
    const journalOwner = await createUser("journalowner", "owner@example.com");
    const commenter = await createUser("commenter", "commenter@example.com");
    const game = await createGame("Stardew Valley");

    await createUserGame(journalOwner._id, game._id);

    const entry = await createJournalEntry(
      journalOwner._id,
      game._id,
      "My farm is doing well.",
    );

    await createComment(commenter._id, entry._id, "Looking good!");

    const res = await request(app).get("/api/feed").set(auth(commenter._id));

    expect(res.status).toBe(200);

    const commentItem = res.body.find((item: any) => item.type === "COMMENT");

    expect(commentItem).toMatchObject({
      type: "COMMENT",
      userGameId: expect.any(String),
      content: "commented on a journal entry for Stardew Valley",
      body: "Looking good!",
      user: {
        username: "commenter",
      },
      game: {
        title: "Stardew Valley",
      },
    });
  });

  it("returns null as userGameId when a comment's journal owner has no matching UserGame", async () => {
    const journalOwner = await createUser("journalowner", "owner@example.com");
    const commenter = await createUser("commenter", "commenter@example.com");
    const game = await createGame("Hollow Knight");

    const entry = await createJournalEntry(journalOwner._id, game._id);

    await createComment(commenter._id, entry._id, "Nice entry!");

    const res = await request(app).get("/api/feed").set(auth(commenter._id));

    expect(res.status).toBe(200);

    const commentItem = res.body.find((item: any) => item.type === "COMMENT");

    expect(commentItem.userGameId).toBeNull();
  });

  it("combines activity from different users", async () => {
    const firstUser = await createUser("firstuser", "first@example.com");
    const secondUser = await createUser("seconduser", "second@example.com");

    const firstGame = await createGame("Game One");
    const secondGame = await createGame("Game Two");

    await createUserGame(firstUser._id, firstGame._id);
    await createUserGame(secondUser._id, secondGame._id);

    const res = await request(app).get("/api/feed").set(auth(firstUser._id));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);

    const usernames = res.body.map((item: any) => item.user.username);

    expect(usernames).toContain("firstuser");
    expect(usernames).toContain("seconduser");
  });

  it("sorts all activity types by creation date, newest first", async () => {
    const user = await createUser();
    const game = await createGame("Test Game");

    const userGame = await createUserGame(user._id, game._id);
    const entry = await createJournalEntry(user._id, game._id, "Journal body");
    const comment = await createComment(user._id, entry._id, "Comment body");

    const now = Date.now();

    await UserGame.updateOne(
      { _id: userGame._id },
      { $set: { createdAt: new Date(now - 3000) } },
    );

    await JournalEntry.updateOne(
      { _id: entry._id },
      { $set: { createdAt: new Date(now - 2000) } },
    );

    await Comment.updateOne(
      { _id: comment._id },
      { $set: { createdAt: new Date(now - 1000) } },
    );

    const res = await request(app).get("/api/feed").set(auth(user._id));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);

    const timestamps = res.body.map((item: any) =>
      new Date(item.createdAt).getTime(),
    );

    expect(timestamps[0]).toBeGreaterThanOrEqual(timestamps[1]);
    expect(timestamps[1]).toBeGreaterThanOrEqual(timestamps[2]);

    expect(res.body.map((item: any) => item.type)).toEqual(
      expect.arrayContaining(["ADD_GAME", "JOURNAL", "COMMENT"]),
    );
  });

  it("skips activity with missing populated references", async () => {
    const user = await createUser();
    const game = await createGame("Test Game");

    const missingUserId = new mongoose.Types.ObjectId();
    const missingGameId = new mongoose.Types.ObjectId();

    await UserGame.create({
      userId: missingUserId,
      gameId: game._id,
      platform: {
        name: "PC",
        slug: "pc",
      },
      status: "backlog",
    });

    await UserGame.create({
      userId: user._id,
      gameId: missingGameId,
      platform: {
        name: "PlayStation",
        slug: "playstation",
      },
      status: "backlog",
    });

    await JournalEntry.create({
      userId: user._id,
      gameId: missingGameId,
      body: "Missing game reference",
    });

    const res = await request(app).get("/api/feed").set(auth(user._id));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("does not return more than 30 feed items", async () => {
    const user = await createUser();
    const game = await createGame("Shared Game");

    await createJournalEntry(user._id, game._id, "Journal entry");

    for (let i = 0; i < 20; i++) {
      const uniqueGame = await createGame(`Game ${i}`);

      await createUserGame(user._id, uniqueGame._id, `Platform ${i}`);
    }

    for (let i = 0; i < 19; i++) {
      await createJournalEntry(user._id, game._id, `Journal entry ${i}`);
    }

    const res = await request(app).get("/api/feed").set(auth(user._id));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(30);
  });

  it("returns 500 when a database query fails", async () => {
    const user = await createUser();

    vi.spyOn(UserGame, "find").mockImplementationOnce((() => {
      throw new Error("Database failure");
    }) as any);

    const res = await request(app).get("/api/feed").set(auth(user._id));

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: "Failed to load feed",
    });
  });
});
