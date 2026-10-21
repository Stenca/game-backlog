import { Router } from "express";
import { AuthedRequest, requireAuth } from "../middleware/requireAuth";
import { User } from "../models/User";
import { updatePasswordSchema, updateProfileSchema } from "../validators/auth";
import { validate } from "../middleware/validate";
import { hashPassword, verifyPassword } from "../utils/auth";

const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get("/me", async (req: AuthedRequest, res) => {
  const user = await User.findById(req.userId).select("-passwordHash");
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    user: { id: user.id, username: user.username, email: user.email },
  });
});

usersRouter.patch(
  "/me",
  validate(updateProfileSchema),
  async (req: AuthedRequest, res) => {
    try {
      const { username, displayName, email } = req.body;
      const user = await User.findById(req.userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      if (username && username !== user.username) {
        const taken = await User.findOne({ username, _id: { $ne: user._id } });
        if (taken) {
          res.status(400).json({ error: "Username already taken" });
          return;
        }
        user.username = username;
      }
      if (email && email !== user.email) {
        const taken = await User.findOne({ email, _id: { $ne: user._id } });
        if (taken) {
          res.status(409).json({ error: "Email already taken" });
          return;
        }
        user.email = email;
      }

      if (displayName && displayName !== user.displayName) {
        user.displayName = displayName;
      }

      await user.save();
      res.json({
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
      console.error("[users/patch]", err);
      res.status(500).json({ error: "Update failed" });
    }
  },
);

usersRouter.patch(
  "/me/password",
  validate(updatePasswordSchema),
  async (req: AuthedRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const valid = await verifyPassword(currentPassword, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "Current password is incorrect" });
        return;
      }
      user.passwordHash = await hashPassword(newPassword);
      await user.save();
      res.json({ ok: true });
    } catch (err) {
      console.error("[users/password]", err);
      res.status(500).json({ error: "Password update failed" });
    }
  },
);

export default usersRouter;
