import { Router } from "express";
import { Game } from "../models/Game";
import { AuthedRequest, requireAuth } from "../middleware/requireAuth";
import { validate } from "../middleware/validate";
import { createGameSchema, updateGameSchema } from "../validators/games";
import { UserGame } from "../models/UserGame";
import { searchGames, getGameDetails } from "../services/gameApi";
import { searchLimiter } from "../middleware/rateLimit";

const gamesRouter = Router();

gamesRouter.use(requireAuth);

gamesRouter.get("/search", searchLimiter, async (req: AuthedRequest, res) => {
  const q = String(req.query.q ?? "").trim();
  if (q.length < 2) {
    res.json([]);
    return;
  }
  try {
    const results = await searchGames(q);
    res.json(results);
  } catch (err) {
    console.error("[games/search]", err);
    res.status(502).json({ error: "Search unavailable" });
  }
});

gamesRouter.get("/details/:rawgId", async (req: AuthedRequest, res) => {
  const id = Number(req.params.rawgId);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid rawgId" });
    return;
  }

  const details = await getGameDetails(id);
  if (!details) {
    res.status(404).json({ error: "Game not found on API" });
    return;
  }

  res.json(details);
});

gamesRouter.get("/", async (req: AuthedRequest, res) => {
  const userGames = await UserGame.find({ userId: req.userId })
    .populate("gameId")
    .sort({ createdAt: -1 });

  res.json(
    userGames.map((ug) => {
      const { gameId, ...rest } = ug.toObject();
      return { ...rest, game: gameId };
    }),
  );
});

gamesRouter.get("/:id", async (req: AuthedRequest, res) => {
  try {
    const userGame = await UserGame.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).populate("gameId");

    if (!userGame) {
      res.status(404).json({ error: "Game not found" });
      return;
    }

    res.json({ ...userGame.toObject(), game: userGame.gameId });
  } catch {
    res.status(400).json({ error: "Invalid id" });
  }
});

gamesRouter.post(
  "/",
  validate(createGameSchema),
  async (req: AuthedRequest, res) => {
    try {
      let game = await Game.findOne({ rawgId: req.body.rawgId });

      if (!game) {
        const apiGame = await getGameDetails(req.body.rawgId);
        if (!apiGame) {
          res.status(404).json({ error: "Game not found on API" });
          return;
        }

        const existingGameByTitle = await Game.findOne({
          titleLower: apiGame.title.toLowerCase(),
        });

        if (existingGameByTitle) {
          game = existingGameByTitle;
        } else {
          game = await Game.create({
            title: apiGame.title,
            titleLower: apiGame.title.toLowerCase(),
            rawgId: apiGame.rawgId,
            coverUrl: apiGame.coverUrl,
            releaseDate: apiGame.releaseDate,
            playtime: apiGame.playtime,
            genres: apiGame.genres,
            developers: apiGame.developers,
            availablePlatforms: apiGame.availablePlatforms,
          });
        }
      }

      const existingUserGame = await UserGame.findOne({
        userId: req.userId,
        gameId: game._id,
        "platform.name": req.body.platform.name,
      });

      if (existingUserGame) {
        res.status(409).json({ error: "You already have this game" });
        return;
      }

      const userGame = await UserGame.create({
        userId: req.userId,
        gameId: game._id,
        platform: req.body.platform,
        status: req.body.status,
      });

      res.status(201).json({
        ...userGame.toObject(),
        game: game.toObject(),
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        res.status(409).json({ error: "You already have this game" });
        return;
      }
      console.error("[games/create]", err);
      res.status(500).json({ error: "Failed to create game" });
    }
  },
);

gamesRouter.patch(
  "/:id",
  validate(updateGameSchema),
  async (req: AuthedRequest, res) => {
    try {
      const userGame = await UserGame.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        req.body,
        { returnDocument: "after", runValidators: true },
      ).populate("gameId");

      if (!userGame) {
        res.status(404).json({ error: "Game not found" });
        return;
      }

      res.json({ ...userGame.toObject(), game: userGame.gameId });
    } catch (err: any) {
      if (err?.code === 11000) {
        res.status(409).json({ error: "You already have this game" });
        return;
      }
      if (err?.name === "CastError") {
        res.status(400).json({ error: "Invalid id" });
        return;
      }
      console.error("[games/patch]", err);
      res.status(500).json({ error: "Failed to update game" });
    }
  },
);

gamesRouter.delete("/:id", async (req: AuthedRequest, res) => {
  try {
    const userGame = await UserGame.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!userGame) {
      res.status(404).json({ error: "Game not found" });
      return;
    }

    res.status(204).end();
  } catch {
    res.status(400).json({ error: "Invalid id" });
  }
});

export default gamesRouter;
