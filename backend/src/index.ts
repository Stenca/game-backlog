import "dotenv/config";
import cors from "cors";
import express from "express";
import gamesRouter from "./routes/games.js";
import { connectDb } from "./db.js";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import journalRouter from "./routes/journal.js";

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.get("/api/health", (_, res) => {
  res.json({ ok: true });
});

app.use("/api/games", gamesRouter);

app.use("/api/auth", authRouter);

app.use("/api/users", usersRouter);

app.use("/api/journal", journalRouter);

const PORT = process.env.PORT ?? 3001;
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.log("MONGODB_URI is not set");
  process.exit(1);
}

await connectDb(MONGODB_URI);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
