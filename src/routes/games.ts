import { Router } from "express";
import { Game } from "../models/Game";
import { requireAuth } from "../middleware/requireAuth";

const gamesRouter = Router();

gamesRouter.use(requireAuth);

gamesRouter.get("/", async (req, res) => {
  const games = await Game.find().sort({ createdAt: -1 });
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

gamesRouter.post("/", async (req, res) => {
  const { title, platform, status = "backlog" } = req.body;
  if (!title || !platform) {
    res.status(400).json({ error: "Title and platform are required" });
    return;
  }
  const game = await Game.create({ title, platform, status });
  res.status(201).json(game);
});

gamesRouter.patch("/:id", async (req, res) => {
  try {
    const game = await Game.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!game) {
      res.status(404).json({ error: "Game not found" });
      return;
    }
    res.json(game);
  } catch {
    res.status(400).json({ error: "Invalid Id" });
  }
});

gamesRouter.delete("/:id", async (req, res) => {
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
