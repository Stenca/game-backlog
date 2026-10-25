import mongoose from "mongoose";

const userGameSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: true,
      index: true,
    },
    platform: {
      name: { type: String, required: true },
      slug: String,
      releasedAt: Date,
    },
    status: {
      type: String,
      enum: ["backlog", "playing", "completed", "dropped", "wishlist"],
      default: "backlog",
    },
    rating: { type: Number, min: 0, max: 5 },
    review: { type: String, trim: true, maxlength: 5000 },
    notes: String,
  },
  { timestamps: true },
);

userGameSchema.index(
  { userId: 1, gameId: 1, "platform.name": 1 },
  { unique: true },
);

export const UserGame = mongoose.model("UserGame", userGameSchema);
