import mongoose from "mongoose";

const userGameSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
	gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true, index: true },
	platform: { name: String, slug: String },
	status: { type: String, enum: [...], default: 'backlog' },
	rating: { type: Number, min: 1, max: 10 },
	notes: String
}, { timestamps: true });

userGameSchema.index({ userId: 1, gameId: 1 }, { unique: true });

export const UserGame = mongoose.model('UserGame', userGameSchema);