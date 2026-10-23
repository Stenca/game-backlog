import { Router } from "express";
import { JournalEntry } from "../models/JournalEntry.js";
import { UserGame } from "../models/UserGame.js";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import {
  createJournalEntrySchema,
  updateJournalEntrySchema,
} from "../validators/journal.js";
import multer from "multer";
import cloudinary from "../utils/cloudinary.js";

const journalRouter = Router();

const upload = multer({ storage: multer.memoryStorage() });

journalRouter.use(requireAuth);

journalRouter.get("/game/:userGameId", async (req: AuthedRequest, res) => {
  try {
    const userGame = await UserGame.findOne({
      _id: req.params.userGameId,
      userId: req.userId,
    });
    if (!userGame) {
      res.status(404).json({ error: "Game not found" });
      return;
    }

    const entries = await JournalEntry.find({
      userId: req.userId,
      gameId: userGame.gameId,
    }).sort({ createdAt: -1 });

    res.json(entries);
  } catch {
    res.status(400).json({ error: "Invalid id" });
  }
});

journalRouter.post(
  "/",
  upload.single("image"),
  validate(createJournalEntrySchema),
  async (req: AuthedRequest, res) => {
    try {
      if (!req.body.body?.trim() && !req.file) {
        res
          .status(400)
          .json({ error: "Entry cannot be empty. Add text or an image." });
      }

      const userGame = await UserGame.findOne({
        userId: req.userId,
        gameId: req.body.gameId,
      });

      if (!userGame) {
        res
          .status(404)
          .json({ error: "You don't have this game in your list" });
        return;
      }

      let imageUrl = null;
      let imagePublicId = null;

      if (req.file) {
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: "bonfire-journals",
        });
        imageUrl = result.secure_url;
        imagePublicId = result.public_id;
      }

      const entry = await JournalEntry.create({
        userId: req.userId,
        gameId: req.body.gameId,
        body: req.body.body?.trim() || undefined,
        imageUrl: imageUrl || undefined,
        imagePublicId: imagePublicId || undefined,
      });

      res.status(201).json(entry);
    } catch (err) {
      console.error("[journal/create]", err);
      res.status(500).json({ error: "Failed to create entry" });
    }
  },
);

journalRouter.patch(
  "/:id",
  validate(updateJournalEntrySchema),
  async (req: AuthedRequest, res) => {
    try {
      const entry = await JournalEntry.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        req.body,
        { new: true, runValidators: true },
      );
      if (!entry) {
        res.status(404).json({ error: "Entry not found" });
        return;
      }
      res.json(entry);
    } catch {
      res.status(400).json({ error: "Invalid id" });
    }
  },
);

journalRouter.delete("/:id", async (req: AuthedRequest, res) => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!entry) {
      res.status(404).json({ error: "Entry not found" });
      return;
    }

    if (entry.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(entry.imagePublicId, {
          invalidate: true,
          resource_type: "image",
        });
      } catch (err) {
        console.error("[cloudinary/destroy] FAILED:", err);
      }
    }

    await entry.deleteOne();
    res.status(204).end();
  } catch {
    res.status(400).json({ error: "Invalid id" });
  }
});

export default journalRouter;
