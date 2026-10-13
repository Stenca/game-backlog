import { Router } from "express";
import { Game } from "../models/Game";
import { AuthedRequest, requireAuth } from "../middleware/requireAuth";
import { validate } from "../middleware/validate";
import { createGameSchema, updateGameSchema } from "../validators/games";
import { UserGame } from "../models/UserGame";
import { findGameData } from "../services/rawg";

const gamesRouter = Router();

gamesRouter.use(requireAuth);

gamesRouter.get("/", async (req: AuthedRequest, res) => {
  const games = await Game.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json(games);
});

gamesRouter.get("/:id", async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      res.status(404).json({ error: "Game not found" });
      return;
    }
    res.json(game);
  } catch {
    res.status(400).json({ error: "Invalid Id" });
  }
});

gamesRouter.post(
  "/",
  validate(createGameSchema),
  async (req: AuthedRequest, res) => {
    let game = await Game.findOne({ titleLower: req.body.title.toLowerCase() });
    if (!game) {
      const rawg = await findGameData(req.body.title);
      game = await Game.create({
        title: req.body.title,
        titleLower: req.body.title.toLowerCase(),
        coverUrl: rawg?.coverUrl,
        releaseDate: rawg?.releaseDate,
        playtime: rawg?.playtime,
        genres: rawg?.genres,
        rawgId: rawg?.rawgId,
        availablePlatforms: rawg?.availablePlatforms,
      });
    }

    try {
      const userGame = await UserGame.create({
        userId: req.userId,
        gameId: game._id,
        platform: req.body.platform,
        status: req.body.status,
      });
      res.status(201).json({ ...userGame.toObject(), game });
    } catch (err: any) {
      if (err?.code === 11000) {
        res.status(409).json({ error: "You already have this game" });
        return;
      }
      throw err;
    }
  },
);

gamesRouter.patch(
  "/:id",
  validate(updateGameSchema),
  async (req: AuthedRequest, res) => {
    try {
      const update: any = { ...req.body };
      if (update.title) {
        update.titleLower = update.title.toLowerCase();
      }

      const game = await Game.findByIdAndUpdate(
        { _id: req.params.id, userId: req.userId },
        update,
        {
          new: true,
          runValidators: true,
        },
      );
      if (!game) {
        res.status(404).json({ error: "Game not found" });
        return;
      }
      res.json(game);
    } catch (err: any) {
      if (err?.code === 11000) {
        res
          .status(409)
          .json({ error: "You already have this game on this platform" });
        return;
      }
      if (err?.name("CastError")) {
        res.status(400).json({ error: "Invalid Id" });
        return;
      }
      console.error("[games/patch]", err);
      res.status(500).json({ error: "Failed to update game" });
    }
  },
);

gamesRouter.delete("/:id", async (req: AuthedRequest, res) => {
  try {
    const game = await Game.findByIdAndDelete(req.params.id);
    if (!game) {
      res.status(404).json({ error: "Game not found" });
      return;
    }
    res.status(204).end();
  } catch {
    res.status(400).json({ error: "Invalid id" });
  }
});

export default gamesRouter;
