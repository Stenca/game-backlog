import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth.js";
import { UserGame } from "../models/UserGame.js";
import { JournalEntry } from "../models/JournalEntry.js";
import { Comment } from "../models/Comment.js";

const feedRouter = Router();
feedRouter.use(requireAuth);

feedRouter.get("/", async (req: AuthedRequest, res) => {
  try {
    const recentGames = await UserGame.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("userId", "username displayName avatarUrl")
      .populate("gameId", "title coverUrl");

    const recentJournals = await JournalEntry.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("userId", "username displayName avatarUrl")
      .populate("gameId", "title coverUrl");

    const recentComments = await Comment.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("userId", "username displayName avatarUrl")
      .populate({
        path: "entryId",
        populate: [
          { path: "gameId", select: "title coverUrl" },
          { path: "userId", select: "username displayName avatarUrl" },
        ],
      });

    const feedItems: any[] = [];

    recentGames.forEach((ug: any) => {
      if (!ug.userId || !ug.gameId) return;

      feedItems.push({
        id: ug._id.toString(),
        userGameId: ug._id.toString(),
        type: "ADD_GAME",
        createdAt: ug.createdAt,
        user: ug.userId,
        game: ug.gameId,
        content: `added ${ug.gameId.title} to their library`,
      });
    });

    const journalPromises: Promise<void>[] = [];

    recentJournals.forEach((entry: any) => {
      if (!entry.userId || !entry.gameId) return;

      journalPromises.push(
        (async () => {
          const userGame = await UserGame.findOne({
            userId: entry.userId._id,
            gameId: entry.gameId._id,
          }).select("_id");

          feedItems.push({
            id: entry._id.toString(),
            userGameId: userGame?._id.toString() ?? null,
            type: "JOURNAL",
            createdAt: entry.createdAt,
            user: entry.userId,
            game: entry.gameId,
            content: `wrote a journal entry for ${entry.gameId.title}`,
            body: entry.body,
          });
        })(),
      );
    });

    await Promise.all(journalPromises);

    const commentPromises: Promise<void>[] = [];

    recentComments.forEach((comment: any) => {
      if (
        !comment.userId ||
        !comment.entryId?.gameId ||
        !comment.entryId?.userId
      ) {
        return;
      }

      commentPromises.push(
        (async () => {
          const userGame = await UserGame.findOne({
            userId: comment.entryId.userId._id,
            gameId: comment.entryId.gameId._id,
          }).select("_id");

          feedItems.push({
            id: comment._id.toString(),
            userGameId: userGame?._id.toString() ?? null,
            type: "COMMENT",
            createdAt: comment.createdAt,
            user: comment.userId,
            game: comment.entryId.gameId,
            content: `commented on a journal entry for ${comment.entryId.gameId.title}`,
            body: comment.text,
          });
        })(),
      );
    });

    await Promise.all(commentPromises);

    feedItems.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    res.json(feedItems.slice(0, 30));
  } catch (err) {
    console.error("[feed]", err);
    res.status(500).json({ error: "Failed to load feed" });
  }
});

export default feedRouter;
