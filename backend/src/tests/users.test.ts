import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import express from "express";
import usersRouter from "../routes/users.js";
import authRouter from "../routes/auth.js";
import { User } from "../models/User.js";

const app = express();
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);

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

async function registerUser(
  username: string,
  email: string,
  password = "Password123",
): Promise<{ token: string; userId: string }> {
  const res = await request(app).post("/api/auth/register").send({
    username,
    displayName: username,
    email,
    password,
  });

  expect(res.status).toBe(201);

  return {
    token: res.body.token,
    userId: res.body.user.id,
  };
}

async function createGoogleUser(
  username = "googleuser",
  email = "google@test.com",
) {
  return User.create({
    username,
    displayName: username,
    email,
    authProviders: [
      {
        provider: "google",
        providerId: "google-id-123",
      },
    ],
  });
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

describe("GET /api/users/me", () => {
  it("rejects requests without a token", async () => {
    const res = await request(app).get("/api/users/me");

    expect(res.status).toBe(401);
  });

  it("returns the authenticated user's profile", async () => {
    const { token, userId } = await registerUser("user1", "u1@test.com");

    const res = await request(app).get("/api/users/me").set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(userId);
    expect(res.body.user.username).toBe("user1");
    expect(res.body.user.email).toBe("u1@test.com");
    expect(res.body.user.displayName).toBe("user1");
  });

  it("never returns the password hash", async () => {
    const { token } = await registerUser("user1", "u1@test.com");

    const res = await request(app).get("/api/users/me").set(auth(token));

    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("returns hasPassword as true for a password account", async () => {
    const { token } = await registerUser("user1", "u1@test.com");

    const res = await request(app).get("/api/users/me").set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.user.hasPassword).toBe(true);
  });

  it("returns hasPassword as false for a Google-only account", async () => {
    await createGoogleUser();

    const user = await User.findOne({ username: "googleuser" });

    expect(user).not.toBeNull();

    const { sign } = await import("jsonwebtoken");
    const token = sign(
      { userId: user!._id.toString() },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" },
    );

    const res = await request(app).get("/api/users/me").set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.user.hasPassword).toBe(false);
    expect(res.body.user.passwordHash).toBeUndefined();
  });
});

describe("PATCH /api/users/me", () => {
  it("updates the display name", async () => {
    const { token } = await registerUser("user1", "u1@test.com");

    const res = await request(app)
      .patch("/api/users/me")
      .set(auth(token))
      .send({ displayName: "New Display Name" });

    expect(res.status).toBe(200);
    expect(res.body.user.displayName).toBe("New Display Name");
  });

  it("updates the username", async () => {
    const { token } = await registerUser("user1", "u1@test.com");

    const res = await request(app)
      .patch("/api/users/me")
      .set(auth(token))
      .send({ username: "newusername" });

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe("newusername");
  });

  it("updates the email", async () => {
    const { token } = await registerUser("user1", "u1@test.com");

    const res = await request(app)
      .patch("/api/users/me")
      .set(auth(token))
      .send({ email: "newemail@test.com" });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("newemail@test.com");
  });

  it("rejects requests without authentication", async () => {
    const res = await request(app)
      .patch("/api/users/me")
      .send({ displayName: "New Name" });

    expect(res.status).toBe(401);
  });

  it("rejects a username already taken by another user", async () => {
    await registerUser("taken", "taken@test.com");
    const { token } = await registerUser("user1", "u1@test.com");

    const res = await request(app)
      .patch("/api/users/me")
      .set(auth(token))
      .send({ username: "taken" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Username already taken");
  });

  it("rejects an email already taken by another user", async () => {
    await registerUser("other", "taken@test.com");
    const { token } = await registerUser("user1", "u1@test.com");

    const res = await request(app)
      .patch("/api/users/me")
      .set(auth(token))
      .send({ email: "taken@test.com" });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Email already taken");
  });

  it("allows updating to your own current username", async () => {
    const { token } = await registerUser("user1", "u1@test.com");

    const res = await request(app)
      .patch("/api/users/me")
      .set(auth(token))
      .send({ username: "user1" });

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe("user1");
  });

  it("allows updating to your own current email", async () => {
    const { token } = await registerUser("user1", "u1@test.com");

    const res = await request(app)
      .patch("/api/users/me")
      .set(auth(token))
      .send({ email: "u1@test.com" });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("u1@test.com");
  });

  it("rejects an empty body", async () => {
    const { token } = await registerUser("user1", "u1@test.com");

    const res = await request(app)
      .patch("/api/users/me")
      .set(auth(token))
      .send({});

    expect(res.status).toBe(400);
  });

  it("rejects invalid usernames", async () => {
    const { token } = await registerUser("user1", "u1@test.com");

    const res = await request(app)
      .patch("/api/users/me")
      .set(auth(token))
      .send({ username: "Bad Name!" });

    expect(res.status).toBe(400);
  });

  it("rejects usernames shorter than three characters", async () => {
    const { token } = await registerUser("user1", "u1@test.com");

    const res = await request(app)
      .patch("/api/users/me")
      .set(auth(token))
      .send({ username: "ab" });

    expect(res.status).toBe(400);
  });

  it("rejects usernames longer than twenty characters", async () => {
    const { token } = await registerUser("user1", "u1@test.com");

    const res = await request(app)
      .patch("/api/users/me")
      .set(auth(token))
      .send({ username: "a".repeat(21) });

    expect(res.status).toBe(400);
  });

  it("rejects invalid email addresses", async () => {
    const { token } = await registerUser("user1", "u1@test.com");

    const res = await request(app)
      .patch("/api/users/me")
      .set(auth(token))
      .send({ email: "not-an-email" });

    expect(res.status).toBe(400);
  });

  it("rejects display names longer than twenty characters", async () => {
    const { token } = await registerUser("user1", "u1@test.com");

    const res = await request(app)
      .patch("/api/users/me")
      .set(auth(token))
      .send({ displayName: "a".repeat(21) });

    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/users/me/password", () => {
  it("changes the password with a valid current password", async () => {
    const { token } = await registerUser("user1", "u1@test.com", "Password123");

    const res = await request(app)
      .patch("/api/users/me/password")
      .set(auth(token))
      .send({
        currentPassword: "Password123",
        newPassword: "NewPassword456",
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const login = await request(app).post("/api/auth/login").send({
      email: "u1@test.com",
      password: "NewPassword456",
    });

    expect(login.status).toBe(200);
    expect(login.body.token).toBeDefined();
  });

  it("rejects requests without authentication", async () => {
    const res = await request(app).patch("/api/users/me/password").send({
      currentPassword: "Password123",
      newPassword: "NewPassword456",
    });

    expect(res.status).toBe(401);
  });

  it("rejects an incorrect current password", async () => {
    const { token } = await registerUser("user1", "u1@test.com", "Password123");

    const res = await request(app)
      .patch("/api/users/me/password")
      .set(auth(token))
      .send({
        currentPassword: "WrongPassword1",
        newPassword: "NewPassword456",
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Current password is incorrect");
  });

  it("rejects reusing the same password", async () => {
    const { token } = await registerUser("user1", "u1@test.com", "Password123");

    const res = await request(app)
      .patch("/api/users/me/password")
      .set(auth(token))
      .send({
        currentPassword: "Password123",
        newPassword: "Password123",
      });

    expect(res.status).toBe(400);
  });

  it("rejects a weak new password", async () => {
    const { token } = await registerUser("user1", "u1@test.com", "Password123");

    const res = await request(app)
      .patch("/api/users/me/password")
      .set(auth(token))
      .send({
        currentPassword: "Password123",
        newPassword: "short",
      });

    expect(res.status).toBe(400);
  });

  it("rejects a missing current password", async () => {
    const { token } = await registerUser("user1", "u1@test.com");

    const res = await request(app)
      .patch("/api/users/me/password")
      .set(auth(token))
      .send({ newPassword: "NewPassword456" });

    expect(res.status).toBe(400);
  });

  it("rejects a missing new password", async () => {
    const { token } = await registerUser("user1", "u1@test.com");

    const res = await request(app)
      .patch("/api/users/me/password")
      .set(auth(token))
      .send({ currentPassword: "Password123" });

    expect(res.status).toBe(400);
  });

  it("rejects an empty body", async () => {
    const { token } = await registerUser("user1", "u1@test.com");

    const res = await request(app)
      .patch("/api/users/me/password")
      .set(auth(token))
      .send({});

    expect(res.status).toBe(400);
  });

  it("rejects changing the password for a Google-only account", async () => {
    await createGoogleUser();

    const user = await User.findOne({ username: "googleuser" });

    const { sign } = await import("jsonwebtoken");
    const token = sign(
      { userId: user!._id.toString() },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" },
    );

    const res = await request(app)
      .patch("/api/users/me/password")
      .set(auth(token))
      .send({
        currentPassword: "Password123",
        newPassword: "NewPassword456",
      });

    expect(res.status).toBe(400);
  });

  it("rejects the old password after a change", async () => {
    const { token } = await registerUser("user1", "u1@test.com", "Password123");

    await request(app).patch("/api/users/me/password").set(auth(token)).send({
      currentPassword: "Password123",
      newPassword: "NewPassword456",
    });

    const login = await request(app).post("/api/auth/login").send({
      email: "u1@test.com",
      password: "Password123",
    });

    expect(login.status).toBe(401);
  });
});
