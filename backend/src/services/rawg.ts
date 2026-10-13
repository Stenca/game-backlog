export async function findGameData(title: string) {
  const res = await fetch(
    `https://api.rawg.io/api/games?search=${encodeURIComponent(title)}&key=${process.env.RAWG_API_KEY}`,
  );
  if (!res.ok) return null;

  const data = await res.json();
  const game = data.results?.[0];
  if (!game) return null;

  return {
    rawgId: game.id,
    coverUrl: game.background_image,
    releaseDate: game.released ? new Date(game.released) : undefined,
    playtime: game.playtime ?? undefined,
    genres: game.genres?.map((g: any) => g.name) ?? [],
    availablePlatforms:
      game.platforms?.map((p: any) => ({
        name: p.platform.name,
        slug: p.platform.slug,
        releasedAt: p.released_at ? new Date(p.released_at) : undefined,
      })) ?? [],
  };
}
