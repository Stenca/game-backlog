import crypto from "node:crypto";

export function generateAuthCode() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashAuthCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}
