import { Router } from "express";
import { loginSchema, registerSchema } from "../validators/auth.js";
import { validate } from "../middleware/validate.js";
import { User } from "../models/User.js";
import { hashPassword, signToken, verifyPassword } from "../utils/auth.js";
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

      const user = await User.findOne({ email });
      if (!user) {
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
          displayName: user.displayName,
          email: user.email,
        },
      });
    } catch {
      res.status(500).json({ error: "Login failed" });
    }
  },
);

export default authRouter;
