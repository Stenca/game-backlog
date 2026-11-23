import { OAuth2Client } from "google-auth-library";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

if (!GOOGLE_CLIENT_ID) {
  throw new Error("GOOGLE_CLIENT_ID is not set");
}

if (!GOOGLE_CLIENT_SECRET) {
  throw new Error("GOOGLE_CLIENT_SECRET is not set");
}

if (!GOOGLE_CALLBACK_URL) {
  throw new Error("GOOGLE_CALLBACK_URL is not set");
}

export const googleClient = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
);

export function getGoogleAuthUrl(state: string, nonce: string) {
  return googleClient.generateAuthUrl({
    access_type: "online",
    scope: ["openid", "email", "profile"],
    state,
    nonce,
  });
}

export async function verifyGoogleToken(idToken: string, nonce: string) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (
    !payload ||
    !payload.sub ||
    !payload.email ||
    payload.email_verified !== true ||
    payload.nonce !== nonce
  ) {
    throw new Error("Invalid Google ID token");
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    displayName: payload.name || payload.email.split("@")[0],
    avatarUrl: payload.picture,
  };
}
