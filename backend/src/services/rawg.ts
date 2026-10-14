export async function searchGames(query: string) {
  const res = await fetch(
    `https://api.rawg.io/api/games?search=${encodeURIComponent(query)}&page_size=8&key=${process.env.RAWG_API_KEY}`,
  );
  if (!res.ok) return [];
  const data = await res.json();

  return (data.results ?? []).map((g: any) => ({
    rawgId: g.id,
    title: g.name,
    coverUrl: g.background_image,
    released: g.released,
  }));
}

export async function getGameDetails(rawgId: number) {
  const res = await fetch(
    `https://api.rawg.io/api/games/${rawgId}?key=${process.env.RAWG_API_KEY}`,
  );
  if (!res.ok) return null;
  const game = await res.json();

  return {
    rawgId: game.id,
    title: game.name,
    coverUrl: game.background_image,
    releaseDate: game.released ? new Date(game.released) : undefined,
    playtime: game.playtime,
    genres: game.genres?.map((g: any) => g.name) ?? [],
    availablePlatforms:
      game.platforms?.map((p: any) => ({
        name: p.platform.name,
        slug: p.platform.slug,
        releasedAt: p.released_at ? new Date(p.released_at) : undefined,
      })) ?? [],
  };
}
