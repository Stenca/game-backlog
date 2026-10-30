import { z } from "zod";

export const createJournalEntrySchema = z.object({
  gameId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid game id"),
  body: z.string().trim().max(5000).optional(),
});

export const updateJournalEntrySchema = z.object({
  body: z.string().optional(),
  existingImages: z.string().optional(),
  existingPublicIds: z.string().optional(),
  removedPublicIds: z.string().optional(),
});
