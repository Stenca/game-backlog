import mongoose from "mongoose";

const authProviderSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ["google"],
      required: true,
    },
    providerId: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-z0-9_]+$/,
    },
    avatarUrl: { type: String, default: undefined },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: false,
      select: false,
    },
    authProviders: {
      type: [authProviderSchema],
      default: [],
    },
  },
  { timestamps: true },
);

userSchema.index(
  { "authProviders.provider": 1, "authProviders.providerId": 1 },
  { unique: true, sparse: true },
);

export const User = mongoose.model("User", userSchema);
