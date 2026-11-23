import { Router } from "express";
import { loginSchema, registerSchema } from "../validators/auth.js";
import { validate } from "../middleware/validate.js";
import { User } from "../models/User.js";
import { hashPassword, signToken, verifyPassword } from "../utils/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";
import crypto from "node:crypto";
import {
  getGoogleAuthUrl,
  googleClient,
  verifyGoogleToken,
} from "../utils/googleAuth.js";
import { generateUsername } from "../utils/username.js";

const authRouter = Router();

authRouter.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  async (req, res) => {
    try {
      const { username, displayName, email, password } = req.body;

      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        res.status(409).json({ error: "Email already in use" });
        return;
      }

      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        res.status(409).json({ error: "Username already taken" });
        return;
      }

      const passwordHash = await hashPassword(password);
      const user = await User.create({
        username,
        displayName,
        email,
        passwordHash,
      });
      const token = signToken(user.id);

      res.status(201).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          avatarUrl: user.avatarUrl,
          displayName: user.displayName,
          email: user.email,
        },
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        const field = Object.keys(err.keyPattern ?? {})[0];
        res.status(409).json({
          error:
            field === "username"
              ? "Username already taken"
              : "Email already in use",
        });
        return;
      }
      console.error("[auth/register]", err);
      res.status(500).json({ error: "Registration failed" });
    }
  },
);

authRouter.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select("+passwordHash");

      if (!user?.passwordHash) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const valid = await verifyPassword(password, user.passwordHash);

      if (!valid) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const token = signToken(user.id);
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          avatarUrl: user.avatarUrl,
          displayName: user.displayName,
          email: user.email,
        },
      });
    } catch {
      res.status(500).json({ error: "Login failed" });
    }
  },
);

authRouter.get("/google", (req, res) => {
  const state = crypto.randomBytes(32).toString("hex");
  const nonce = crypto.randomBytes(32).toString("hex");

  req.session.googleAuth = { state, nonce };

  const authUrl = getGoogleAuthUrl(state, nonce);

  res.redirect(authUrl);
});

authRouter.get("/google/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    const googleAuth = req.session.googleAuth;

    // Validate state
    if (
      typeof state !== "string" ||
      !googleAuth ||
      state !== googleAuth.state
    ) {
      res.status(400).json({ error: "Invalid OAuth state" });
      return;
    }

    // Consume the state and nonce
    delete req.session.googleAuth;

    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    if (typeof code !== "string") {
      res.status(400).json({ error: "Missing authorization code" });
      return;
    }

    const { tokens } = await googleClient.getToken(code);

    if (!tokens.id_token) {
      res.status(401).json({ error: "Missing Google ID token" });
      return;
    }

    const googleUser = await verifyGoogleToken(
      tokens.id_token,
      googleAuth.nonce,
    );

    let user = await User.findOne({
      authProviders: {
        $elemMatch: {
          provider: "google",
          providerId: googleUser.googleId,
        },
      },
    });

    if (!user) {
      const existingEmail = await User.findOne({
        email: googleUser.email,
      });

      if (existingEmail) {
        res.status(409).json({
          error:
            "An account with this email already exists. Sign in with your existing account first.",
        });
        return;
      }

      const username = await generateUsername(googleUser.email);

      user = await User.create({
        username,
        displayName: googleUser.displayName,
        email: googleUser.email,
        avatarUrl: googleUser.avatarUrl,
        authProviders: [
          {
            provider: "google",
            providerId: googleUser.googleId,
          },
        ],
      });
    }

    const token = signToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        displayName: user.displayName,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("[auth/google/callback]", err);
    res.status(500).json({ error: "Google authentication failed" });
  }
});

export default authRouter;
