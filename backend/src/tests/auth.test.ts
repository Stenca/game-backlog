import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import express from "express";
import authRouter from "../routes/auth.js";
import { User } from "../models/User.js";

const app = express();
app.use(express.json());
app.use("/api/auth", authRouter);

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
});

describe("POST /api/auth/register", () => {
  const validUser = {
    username: "testuser",
    displayName: "Test User",
    email: "test@example.com",
    password: "Password123",
  };

  it("registers a new user and returns a token", async () => {
    const res = await request(app).post("/api/auth/register").send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe(validUser.username);
    expect(res.body.user.displayName).toBe(validUser.displayName);
    expect(res.body.user.email).toBe(validUser.email);
  });

  it("never returns the password hash", async () => {
    const res = await request(app).post("/api/auth/register").send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.user.password).toBeUndefined();
  });

  it("stores the password as a bcrypt hash, not plain text", async () => {
    await request(app).post("/api/auth/register").send(validUser);

    const user = await User.findOne({ email: validUser.email });
    expect(user).not.toBeNull();
    expect(user!.passwordHash).not.toBe(validUser.password);
    expect(user!.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it("rejects a duplicate email", async () => {
    await request(app).post("/api/auth/register").send(validUser);

    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validUser, username: "otheruser" });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/email/i);
  });

  it("rejects a duplicate username", async () => {
    await request(app).post("/api/auth/register").send(validUser);

    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validUser, email: "other@example.com" });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/username/i);
  });

  it("rejects an invalid email format", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validUser, email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });

  it("rejects a weak password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validUser, password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });

  it("rejects a password without an uppercase letter", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validUser, password: "password123" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });

  it("rejects a username that is too short", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validUser, username: "ab" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });

  it("rejects a username with invalid characters", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validUser, username: "bad name!" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });

  it("normalizes the username to lowercase", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validUser, username: "TestUser", displayName: "TestUser" });

    expect(res.status).toBe(201);
    expect(res.body.user.username).toBe("testuser");
    expect(res.body.user.displayName).toBe("TestUser");
  });
});

describe("POST /api/auth/login", () => {
  const user = {
    username: "testuser",
    displayName: "Test User",
    email: "test@example.com",
    password: "Password123",
  };

  beforeEach(async () => {
    await request(app).post("/api/auth/register").send(user);
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: user.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.user.displayName).toBe(user.displayName);
  });

  it("rejects an unknown email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: user.password });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  it("rejects a wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "WrongPass123" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  it("returns the same error for unknown email and wrong password", async () => {
    const unknown = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "anything" });
    const wrong = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "anything" });

    expect(unknown.body.error).toBe(wrong.body.error);
  });

  it("accepts email in any case", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "TEST@EXAMPLE.COM", password: user.password });

    expect(res.status).toBe(200);
  });
});
