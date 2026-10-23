import mongoose from "mongoose";

const journalEntrySchema = new mongoose.Schema(
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
    body: { type: String, trim: true, maxlength: 5000 },
    imageUrl: { type: String },
    imagePublicId: { type: String },
  },
  { timestamps: true },
);

journalEntrySchema.index({ userId: 1, gameId: 1, createdAt: -1 });

export const JournalEntry = mongoose.model("JournalEntry", journalEntrySchema);
