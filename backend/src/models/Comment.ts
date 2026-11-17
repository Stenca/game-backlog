import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    entryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JOurnalEntry",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, required: true, trim: true, maxLength: 1000 },
  },
  { timestamps: true },
);

export const Comment = mongoose.model("Comment", commentSchema);
