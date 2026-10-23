import { z } from "zod";

export const createJournalEntrySchema = z.object({
  gameId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid game id"),
  body: z.string().trim().max(5000).optional(),
});

export const updateJournalEntrySchema = z
  .object({
    body: z.string().trim().max(5000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
