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

import { User } from "../models/User.js";
import { Comment } from "../models/Comment.js";
import { JournalEntry } from "../models/JournalEntry.js";
import { Game } from "../models/Game.js";

vi.mock("../middleware/requireAuth.js", () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.userId = req.headers["x-user-id"];

    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    next();
  },
}));

import commentsRouter from "../routes/comments.js";

const app = express();
app.use(express.json());
app.use("/api/comments", commentsRouter);

let mongoServer: MongoMemoryServer;

const userId = new mongoose.Types.ObjectId();
const otherUserId = new mongoose.Types.ObjectId();

let entryId: mongoose.Types.ObjectId;
let gameId: mongoose.Types.ObjectId;

const auth = (id = userId.toString()) => ({
  "x-user-id": id,
});

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
    Comment.deleteMany({}),
    JournalEntry.deleteMany({}),
    Game.deleteMany({}),
  ]);

  await User.create([
    {
      _id: userId,
      username: "testuser",
      displayName: "Test User",
      email: "test@example.com",
    },
    {
      _id: otherUserId,
      username: "otheruser",
      displayName: "Other User",
      email: "other@example.com",
    },
  ]);

  const game = await Game.create({
    title: "Test Game",
    titleLower: "test game",
  });

  gameId = game._id;

  const entry = await JournalEntry.create({
    userId,
    gameId,
    body: "Test journal content",
  });

  entryId = entry._id;
});

describe("Authentication", () => {
  it("rejects requests without authentication", async () => {
    const res = await request(app).get(`/api/comments/entry/${entryId}`);

    expect(res.status).toBe(401);
  });
});

describe("GET /api/comments/entry/:entryId", () => {
  it("returns comments for an entry", async () => {
    await Comment.create({
      entryId,
      userId,
      text: "First comment",
    });

    const res = await request(app)
      .get(`/api/comments/entry/${entryId}`)
      .set(auth());

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].text).toBe("First comment");
  });

  it("returns comments with populated user information", async () => {
    await Comment.create({
      entryId,
      userId,
      text: "Hello",
    });

    const res = await request(app)
      .get(`/api/comments/entry/${entryId}`)
      .set(auth());

    expect(res.status).toBe(200);
    expect(res.body[0].userId.username).toBe("testuser");
    expect(res.body[0].userId.displayName).toBe("Test User");
    expect(res.body[0].userId.email).toBeUndefined();
  });

  it("returns comments in newest-first order", async () => {
    await Comment.create({
      entryId,
      userId,
      text: "Older comment",
      createdAt: new Date("2026-01-01"),
    });

    await Comment.create({
      entryId,
      userId,
      text: "Newer comment",
      createdAt: new Date("2026-01-02"),
    });

    const res = await request(app)
      .get(`/api/comments/entry/${entryId}`)
      .set(auth());

    expect(res.status).toBe(200);
    expect(res.body[0].text).toBe("Newer comment");
    expect(res.body[1].text).toBe("Older comment");
  });

  it("returns an empty array when an entry has no comments", async () => {
    const res = await request(app)
      .get(`/api/comments/entry/${entryId}`)
      .set(auth());

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("does not return comments belonging to another entry", async () => {
    const anotherEntry = await JournalEntry.create({
      userId,
      gameId,
      body: "Another journal entry",
    });

    await Comment.create({
      entryId: anotherEntry._id,
      userId,
      text: "Different entry",
    });

    const res = await request(app)
      .get(`/api/comments/entry/${entryId}`)
      .set(auth());

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});

describe("POST /api/comments/entry/:entryId", () => {
  it("creates a comment", async () => {
    const res = await request(app)
      .post(`/api/comments/entry/${entryId}`)
      .set(auth())
      .send({ text: "A new comment" });

    expect(res.status).toBe(201);
    expect(res.body.text).toBe("A new comment");
    expect(res.body.userId.username).toBe("testuser");
  });

  it("trims whitespace from comments", async () => {
    const res = await request(app)
      .post(`/api/comments/entry/${entryId}`)
      .set(auth())
      .send({ text: "  Hello world  " });

    expect(res.status).toBe(201);
    expect(res.body.text).toBe("Hello world");
  });

  it("rejects an empty comment", async () => {
    const res = await request(app)
      .post(`/api/comments/entry/${entryId}`)
      .set(auth())
      .send({ text: "" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Comment cannot be empty");
  });

  it("rejects a whitespace-only comment", async () => {
    const res = await request(app)
      .post(`/api/comments/entry/${entryId}`)
      .set(auth())
      .send({ text: "   " });

    expect(res.status).toBe(400);
  });

  it("rejects a missing comment text", async () => {
    const res = await request(app)
      .post(`/api/comments/entry/${entryId}`)
      .set(auth())
      .send({});

    expect(res.status).toBe(400);
  });

  it("rejects comments for a nonexistent entry", async () => {
    const nonexistentId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/comments/entry/${nonexistentId}`)
      .set(auth())
      .send({ text: "Hello" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Entry not found");
  });

  it("associates the comment with the authenticated user", async () => {
    const res = await request(app)
      .post(`/api/comments/entry/${entryId}`)
      .set(auth())
      .send({ text: "My comment" });

    expect(res.status).toBe(201);

    const comment = await Comment.findById(res.body._id);

    expect(comment).not.toBeNull();
    expect(comment!.userId.toString()).toBe(userId.toString());
  });

  it("does not create a comment without authentication", async () => {
    const res = await request(app)
      .post(`/api/comments/entry/${entryId}`)
      .send({ text: "Hello" });

    expect(res.status).toBe(401);
    expect(await Comment.countDocuments()).toBe(0);
  });
});

describe("DELETE /api/comments/:id", () => {
  it("deletes a comment owned by the authenticated user", async () => {
    const comment = await Comment.create({
      entryId,
      userId,
      text: "Delete me",
    });

    const res = await request(app)
      .delete(`/api/comments/${comment._id}`)
      .set(auth());

    expect(res.status).toBe(204);

    const deleted = await Comment.findById(comment._id);
    expect(deleted).toBeNull();
  });

  it("does not allow deleting another user's comment", async () => {
    const comment = await Comment.create({
      entryId,
      userId: otherUserId,
      text: "Not yours",
    });

    const res = await request(app)
      .delete(`/api/comments/${comment._id}`)
      .set(auth());

    expect(res.status).toBe(404);

    const stillExists = await Comment.findById(comment._id);
    expect(stillExists).not.toBeNull();
  });

  it("returns 404 when the comment does not exist", async () => {
    const nonexistentId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete(`/api/comments/${nonexistentId}`)
      .set(auth());

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Comment not found");
  });

  it("rejects deletion without authentication", async () => {
    const comment = await Comment.create({
      entryId,
      userId,
      text: "Protected comment",
    });

    const res = await request(app).delete(`/api/comments/${comment._id}`);

    expect(res.status).toBe(401);
    expect(await Comment.findById(comment._id)).not.toBeNull();
  });
});
