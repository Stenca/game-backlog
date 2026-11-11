import * as rawg from "./rawg";
import * as igdb from "./igdb";

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  apiName: string,
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${apiName} timed out after ${ms}ms`));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  }) as Promise<T>;
}

export async function searchGames(query: string) {
  try {
    const results = await withTimeout(rawg.searchGames(query), 1000, "RAWG");
    if (results && results.length > 0) return results;
  } catch (err) {
    console.warn("[API] RAWG failed or timed out. Falling back to IGDB.");
  }

  return await igdb.searchGames(query);
}

export async function getGameDetails(id: number) {
  try {
    const details = await withTimeout(rawg.getGameDetails(id), 1000, "RAWG");
    if (details) return details;
  } catch (err) {
    console.warn("[API] RAWG failed or timed out. Falling back to IGDB.");
  }

  return await igdb.getGameDetails(id);
}
