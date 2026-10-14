import { z } from "zod";

const statusEnum = z.enum([
  "backlog",
  "playing",
  "completed",
  "dropped",
  "wishlist",
]);

const platformInputSchema = z.object({
  name: z.string().trim().min(1, "Platform name is required"),
  slug: z.string().trim().optional(),
  releasedAt: z.coerce.date().optional(),
});

export const createGameSchema = z.object({
  rawgId: z.number().int().positive(),
  platform: platformInputSchema,
  status: statusEnum.default("backlog"),
  rating: z.number().int().min(1).max(10).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateGameSchema = z
  .object({
    platform: platformInputSchema.optional(),
    status: statusEnum.optional(),
    rating: z.number().int().min(1).max(10).optional(),
    notes: z.string().max(2000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
