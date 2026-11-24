import { Router } from "express";
import { loginSchema, registerSchema } from "../validators/auth.js";
import { validate } from "../middleware/validate.js";
import { User } from "../models/User.js";
import { hashPassword, signToken, verifyPassword } from "../utils/auth.js";
import { googleClient, verifyGoogleToken } from "../utils/googleAuth.js";
import { generateUsername } from "../utils/username.js";
import { authLimiter } from "../middleware/rateLimit.js";

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
          hasPassword: Boolean(user.passwordHash),
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
          hasPassword: Boolean(user.passwordHash),
        },
      });
    } catch {
      res.status(500).json({ error: "Login failed" });
    }
  },
);

authRouter.post("/google/exchange", authLimiter, async (req, res) => {
  try {
    const clientUrl = process.env.CLIENT_URL;

    if (
      !clientUrl ||
      req.get("Origin") !== new URL(clientUrl).origin ||
      req.get("X-Requested-With") !== "XmlHttpRequest"
    ) {
      res.status(403).json({ error: "Invalid authentication request" });
      return;
    }

    const { code } = req.body;

    if (typeof code !== "string" || !code) {
      res.status(400).json({ error: "Invalid authorization code" });
      return;
    }

    const { tokens } = await googleClient.getToken({ code });

    if (!tokens.id_token) {
      res.status(401).json({ error: "Missing Google ID token" });
      return;
    }

    const googleUser = await verifyGoogleToken(tokens.id_token);

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
        hasPassword: Boolean(user.passwordHash),
      },
    });
  } catch (err) {
    console.error("[auth/google/exchange]", err);
    res.status(500).json({ error: "Google authentication failed" });
  }
});

export default authRouter;
