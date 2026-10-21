import "dotenv/config";

process.env.JWT_SECRET ??= "test-jwt-secret-for-vitest-only";
process.env.MONGODB_URI ??= "mongodb://localhost:27017/test";
