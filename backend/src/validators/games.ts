import z from "zod";

const statusEnum = z.enum([
  "backlog",
  "playing",
  "completed",
  "dropped",
  "wishlish",
]);

const platformEnum = z.enum([
  "PC",
  "PlayStation 5",
  "PlayStation 4",
  "Xbox Series X|S",
  "Xbox One",
  "Nintendo Switch",
  "Mobile",
  "Other",
]);

export const createGameSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title is too long"),
  platformEnum,
  status: statusEnum.default("backlog"),
  rating: z.number().int().min(1).max(10).optional(),
  notes: z.string().max(2000, "Notes are too long").optional(),
  coverUrl: z.url("Invalid URL cover").optional(),
});

export const updateGameSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    platform: platformEnum.optional(),
    status: statusEnum.optional(),
    rating: z.number().int().min(1).max(10).optional(),
    notes: z.string().max(2000).optional(),
    coverUrl: z.url("Invalid cover URL").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
