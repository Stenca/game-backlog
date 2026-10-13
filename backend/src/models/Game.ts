import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    titleLower: { type: String, required: true },
    platform: {
      type: String,
      required: true,
      enum: [
        "PC",
        "PlayStation 5",
        "PlayStation 4",
        "Xbox Series X|S",
        "Xbox One",
        "Nintendo Switch",
        "Mobile",
        "Other",
      ],
    },
    status: {
      type: String,
      enum: ["backlog", "playing", "completed", "dropped", "wishlist"],
      default: "backlog",
    },
    rating: { type: Number, min: 1, max: 10 },
    notes: String,
    coverUrl: String,
  },
  { timestamps: true },
);

gameSchema.index({ userId: 1, titleLower: 1, platform: 1 }, { unique: true });

export const Game = mongoose.model("Game", gameSchema);
