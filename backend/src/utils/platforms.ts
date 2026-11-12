export function getPlatformAbbreviation(name: string): string {
  const lower = name.toLowerCase();

  if (lower.includes("switch 2")) return "Switch2";
  if (lower.includes("switch")) return "Switch";
  if (lower.includes("wii u")) return "Wii U";
  if (lower.includes("wii")) return "Wii";
  if (lower.includes("gamecube")) return "GC";
  if (lower.includes("64")) return "N64";
  if (lower.includes("snes") || lower.includes("super nintendo")) return "SNES";
  if (lower.includes("nes")) return "NES";
  if (lower.includes("3ds")) return "3DS";
  if (lower.includes("ds")) return "DS";
  if (lower.includes("game boy advance")) return "GBA";
  if (lower.includes("game boy")) return "GB";

  if (lower.includes("playstation 5") || lower.includes("ps5")) return "PS5";
  if (lower.includes("playstation 4") || lower.includes("ps4")) return "PS4";
  if (lower.includes("playstation 3") || lower.includes("ps3")) return "PS3";
  if (lower.includes("playstation 2") || lower.includes("ps2")) return "PS2";
  if (lower.includes("playstation 1") || lower.includes("ps1")) return "PS1";
  if (lower.includes("vita")) return "PS Vita";
  if (lower.includes("portable")) return "PSP";
  if (lower.includes("playstation")) return "PS";

  if (lower.includes("series")) return "XSX";
  if (lower.includes("one")) return "XB1";
  if (lower.includes("360")) return "X360";
  if (lower.includes("xbox")) return "Xbox";

  if (lower.includes("pc") || lower.includes("windows")) return "PC";
  if (lower.includes("mac")) return "Mac";
  if (lower.includes("linux")) return "Linux";
  if (lower.includes("ios")) return "iOS";
  if (lower.includes("android")) return "Android";

  return name.replace(/\s*\(.*?\)\s*/g, "").trim();
}
