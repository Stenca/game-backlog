import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    platform: { type: String, required: true },
    status: {
      type: String,
      enum: ["backlog", "playing", "completed", "dropped", "wishlist"],
      default: "backlog",
    },
    rating: { type: Number, min: 1, max: 10 },
    notes: String,
    coverUrl: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },

  { timestamps: true },
);

export const Game = mongoose.model("Game", gameSchema);
