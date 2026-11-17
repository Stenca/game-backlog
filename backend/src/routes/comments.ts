import { Router } from "express";
import { Comment } from "../models/Comment.js";
import { JournalEntry } from "../models/JournalEntry.js";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth.js";

const commentsRouter = Router();
commentsRouter.use(requireAuth);

commentsRouter.get("/entry/:entryId", async (req: AuthedRequest, res) => {
  try {
    const entryId = String(req.params.entryId); // <-- Fix here

    const comments = await Comment.find({ entryId })
      .populate("userId", "username displayName avatarUrl")
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

commentsRouter.post("/entry/:entryId", async (req: AuthedRequest, res) => {
  try {
    const entryId = String(req.params.entryId);
    const { text } = req.body;

    if (!text?.trim()) {
      res.status(400).json({ error: "Comment cannot be empty" });
      return;
    }

    const entry = await JournalEntry.findById(entryId);
    if (!entry) {
      res.status(404).json({ error: "Entry not found" });
      return;
    }

    const comment = await Comment.create({
      entryId,
      userId: req.userId,
      text: text.trim(),
    });

    const populated = await comment.populate(
      "userId",
      "username displayName avatarUrl",
    );

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: "Failed to post comment" });
  }
});

commentsRouter.delete("/:id", async (req: AuthedRequest, res) => {
  try {
    const commentId = String(req.params.id); // <-- Fix here

    const comment = await Comment.findOneAndDelete({
      _id: commentId,
      userId: req.userId,
    });

    if (!comment) {
      res.status(404).json({ error: "Comment not found" });
      return;
    }

    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

export default commentsRouter;
