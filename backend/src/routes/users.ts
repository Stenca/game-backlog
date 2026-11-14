import { Router } from "express";
import { AuthedRequest, requireAuth } from "../middleware/requireAuth";
import { User } from "../models/User";
import { updatePasswordSchema, updateProfileSchema } from "../validators/auth";
import { validate } from "../middleware/validate";
import { hashPassword, verifyPassword } from "../utils/auth";
import multer from "multer";
import cloudinary from "../utils/cloudinary";

const usersRouter = Router();

usersRouter.use(requireAuth);

const upload = multer({ storage: multer.memoryStorage() });

usersRouter.get("/me", async (req: AuthedRequest, res) => {
  const user = await User.findById(req.userId).select("-passwordHash");
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    user: {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      displayName: user.displayName,
      email: user.email,
    },
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

usersRouter.patch(
  "/me/avatar",
  upload.single("avatar"),
  async (req: AuthedRequest, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No image provided" });
        return;
      }

      const user = await User.findById(req.userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      if (user.avatarUrl) {
        const publicId = user.avatarUrl.split("/").pop()?.split(".")[0];
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(`bonfire-avatars/${publicId}`);
          } catch (err) {
            console.error("[avatar/destroy] Failed to delete old avatar", err);
          }
        }
      }

      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: "bonfire-avatars",
        transformation: { width: 200, height: 200, crop: "fill" },
      });

      user.avatarUrl = result.secure_url;
      await user.save();

      res.json({
        user: {
          id: user.id,
          username: user.username,
          avatarUrl: user.avatarUrl,
          displayName: user.displayName,
          email: user.email,
        },
      });
    } catch (err) {
      console.error("[avatar/upload]", err);
      res.status(500).json({ error: "Failed to upload avatar" });
    }
  },
);

usersRouter.delete("/me/avatar", async (req: AuthedRequest, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.avatarUrl) {
      const publicId = user.avatarUrl.split("/").pop()?.split(".")[0];
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(`bonfire-avatars/${publicId}`);
        } catch (err) {
          console.error("[avatar/destroy] Failed to delete old avatar", err);
        }
      }
    }

    user.avatarUrl = undefined;
    await user.save();

    res.json({
      user: {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        displayName: user.displayName,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("[avatar/remove]", err);
    res.status(500).json({ error: "Failed to remove avatar" });
  }
});

export default usersRouter;
