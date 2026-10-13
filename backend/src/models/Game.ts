import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    titleLower: { type: String, required: true, unique: true, index: true },
    coverUrl: String,
    releaseDate: Date,
    playtime: Number,
    genres: [String],
    rawgId: { type: Number, unique: true, sparse: true },
    availablePlatforms: [{ name: String, slug: String, releasedAt: Date }],
  },
  { timestamps: true },
);

export const Game = mongoose.model("Game", gameSchema);
