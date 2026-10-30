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
  upload.array("images", 5),
  validate(createJournalEntrySchema),
  async (req: AuthedRequest, res) => {
    try {
      const files = req.files as Express.Multer.File[] | undefined;

      if (!req.body.body?.trim() && (!files || files.length === 0)) {
        res
          .status(400)
          .json({ error: "Entry cannot be empty. Add text or an image." });
        return;
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

      const imageUrls: string[] = [];
      const imagePublicIds: string[] = [];

      if (files && files.length > 0) {
        for (const file of files) {
          const b64 = Buffer.from(file.buffer).toString("base64");
          const dataURI = "data:" + file.mimetype + ";base64," + b64;

          const result = await cloudinary.uploader.upload(dataURI, {
            folder: "bonfire-journals",
          });

          imageUrls.push(result.secure_url);
          imagePublicIds.push(result.public_id);
        }
      }

      const entry = await JournalEntry.create({
        userId: req.userId,
        gameId: req.body.gameId,
        body: req.body.body?.trim() || undefined,
        imageUrls,
        imagePublicIds,
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
  upload.array("images", 4),
  validate(updateJournalEntrySchema),
  async (req: AuthedRequest, res) => {
    try {
      const entry = await JournalEntry.findOne({
        _id: req.params.id,
        userId: req.userId,
      });

      if (!entry) {
        res.status(404).json({ error: "Entry not found" });
        return;
      }

      const files = req.files as Express.Multer.File[] | undefined;

      // 1. Update body
      if (req.body.body !== undefined) {
        entry.body = req.body.body.trim() || undefined;
      }

      // 2. Read the NEW arrays from the frontend.
      // If the frontend sends an empty array, it will properly clear them.
      let keptUrls: string[] = [];
      let keptPublicIds: string[] = [];

      if (req.body.existingImages) {
        keptUrls = JSON.parse(req.body.existingImages);
      }
      if (req.body.existingPublicIds) {
        keptPublicIds = JSON.parse(req.body.existingPublicIds);
      }

      // 3. Destroy the removed IDs in Cloudinary
      if (req.body.removedPublicIds) {
        const removedIds = JSON.parse(req.body.removedPublicIds) as string[];

        for (const id of removedIds) {
          try {
            await cloudinary.uploader.destroy(id, {
              invalidate: true,
              resource_type: "image",
            });
          } catch (err) {
            console.error(`[cloudinary/destroy] Failed for ${id}:`, err);
          }
        }
      }

      // 4. Upload new files
      if (files && files.length > 0) {
        for (const file of files) {
          const b64 = Buffer.from(file.buffer).toString("base64");
          const dataURI = "data:" + file.mimetype + ";base64," + b64;

          const result = await cloudinary.uploader.upload(dataURI, {
            folder: "bonfire-journals",
          });

          keptUrls.push(result.secure_url);
          keptPublicIds.push(result.public_id);
        }
      }

      // 5. Save the completely updated arrays
      entry.imageUrls = keptUrls;
      entry.imagePublicIds = keptPublicIds;

      if (!entry.body && entry.imageUrls.length === 0) {
        await entry.deleteOne();
        res.status(204).end();
        return;
      }

      await entry.save();
      res.json(entry);
    } catch (err) {
      console.error("[journal/patch]", err);
      res.status(400).json({ error: "Invalid id or data" });
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

    if (entry.imagePublicIds && entry.imagePublicIds.length > 0) {
      for (const publicId of entry.imagePublicIds) {
        try {
          await cloudinary.uploader.destroy(publicId, {
            invalidate: true,
            resource_type: "image",
          });
        } catch (err) {
          console.error(`[cloudinary/destroy] FAILED for ${publicId}:`, err);
        }
      }
    }

    await entry.deleteOne();
    res.status(204).end();
  } catch {
    res.status(400).json({ error: "Invalid id" });
  }
});

export default journalRouter;
