import { getPlatformAbbreviation } from "../utils/platforms";

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

let cachedToken: string | null = null;

async function getTwitchToken() {
  if (cachedToken) return cachedToken;

  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    throw new Error(`Twitch token failed: ${res.status}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  return cachedToken;
}

export async function searchGames(query: string) {
  const token = await getTwitchToken();

  const res = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": CLIENT_ID!,
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: `search "${query}"; fields name, cover.url, first_release_date; limit 8;`,
  });

  if (!res.ok) {
    throw new Error(`IGDB search failed: ${res.status}`);
  }

  const data = await res.json();

  return (data ?? []).map((g: any) => ({
    rawgId: g.id,
    title: g.name,
    coverUrl: g.cover?.url
      ? `https:${g.cover.url.replace("t_thumb", "t_cover_big")}`
      : undefined,
    released: g.first_release_date
      ? new Date(g.first_release_date * 1000).toISOString()
      : undefined,
  }));
}

export async function getGameDetails(rawgId: number) {
  const token = await getTwitchToken();

  const res = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": CLIENT_ID!,
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: `where id = ${rawgId}; fields name, cover.url, first_release_date, genres.name, involved_companies.company.name, platforms.name; limit 1;`,
  });

  if (!res.ok) throw new Error(`IGDB details failed: ${res.status}`);

  const data = await res.json();
  const game = data?.[0];

  if (!game) return null;

  return {
    rawgId: game.id,
    title: game.name,
    coverUrl: game.cover?.url
      ? `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
      : undefined,
    releaseDate: game.first_release_date
      ? new Date(game.first_release_date * 1000).toISOString()
      : undefined,
    playtime: undefined,
    genres: game.genres?.map((g: any) => g.name) ?? [],
    developers:
      game.involved_companies
        ?.filter((c: any) => c.company)
        .map((c: any) => c.company.name) ?? [],
    availablePlatforms:
      game.platforms?.map((p: any) => {
        const abbreviated = getPlatformAbbreviation(p.name);
        return {
          name: abbreviated,
          slug: abbreviated.toLowerCase().replace(/\s+/g, "-"),
          releasedAt: undefined,
        };
      }) ?? [],
  };
}
