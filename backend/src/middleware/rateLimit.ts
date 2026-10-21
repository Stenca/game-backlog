import rateLimit from "express-rate-limit";

const isTest = process.env.NODE_ENV === "test";

export const authLimiter = isTest
  ? (_req: any, _res: any, next: any) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 10,
      message: { error: "Too many attempts, please try again later" },
    });

export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
});
