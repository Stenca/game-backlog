import type { Platform } from "../types/Game";

const PLATFORM_BG: Record<string, string> = {
  pc: "bg-blue-600",
  macos: "bg-slate-500",
  linux: "bg-orange-600",
  "playstation-5": "bg-blue-500",
  "playstation-4": "bg-blue-700",
  "playstation-3": "bg-blue-800",
  "playstation-2": "bg-blue-900",
  "playstation-1": "bg-indigo-800",
  "playstation-vita": "bg-cyan-600",
  "playstation-portable": "bg-cyan-800",
  "xbox-series-x": "bg-lime-500",
  "xbox-one": "bg-lime-600",
  "xbox-360": "bg-green-600",
  xbox: "bg-green-800",
  "nintendo-switch-2": "bg-rose-600",
  "nintendo-switch": "bg-red-500",
  "wii-u": "bg-sky-500",
  wii: "bg-slate-300",
  gamecube: "bg-purple-600",
  "nintendo-64": "bg-red-700",
  "super-nintendo": "bg-indigo-500",
  nes: "bg-gray-500",
  "nintendo-3ds": "bg-red-600",
  "nintendo-ds": "bg-red-800",
  "game-boy-advance": "bg-violet-600",
  "game-boy": "bg-gray-400",
  ios: "bg-teal-500",
  android: "bg-emerald-500",
};

const PLATFORM_KEYWORDS: { slug: string; keywords: string[] }[] = [
  { slug: "nintendo-switch-2", keywords: ["switch 2"] },
  { slug: "nintendo-switch", keywords: ["switch"] },
  { slug: "wii-u", keywords: ["wii u"] },
  { slug: "wii", keywords: ["wii"] },
  { slug: "gamecube", keywords: ["gamecube"] },
  { slug: "nintendo-64", keywords: ["64"] },
  { slug: "super-nintendo", keywords: ["super nintendo", "snes"] },
  { slug: "nintendo-3ds", keywords: ["3ds"] },
  { slug: "nintendo-ds", keywords: ["ds"] },
  { slug: "game-boy-advance", keywords: ["game boy advance", "gba"] },
  { slug: "game-boy", keywords: ["game boy"] },
  { slug: "nes", keywords: ["nintendo"] },
  { slug: "playstation-5", keywords: ["5"] },
  { slug: "playstation-4", keywords: ["4"] },
  { slug: "playstation-3", keywords: ["3"] },
  { slug: "playstation-2", keywords: ["2"] },
  { slug: "playstation-1", keywords: ["1"] },
  { slug: "playstation-vita", keywords: ["vita"] },
  { slug: "playstation-portable", keywords: ["portable", "psp"] },
  { slug: "playstation-1", keywords: ["playstation", "ps"] },
  { slug: "xbox-series-x", keywords: ["series"] },
  { slug: "xbox-one", keywords: ["one"] },
  { slug: "xbox-360", keywords: ["360"] },
  { slug: "xbox", keywords: ["xbox"] },
  { slug: "pc", keywords: ["pc", "windows"] },
  { slug: "macos", keywords: ["mac", "macos"] },
  { slug: "linux", keywords: ["linux"] },
  { slug: "ios", keywords: ["ios", "iphone"] },
  { slug: "android", keywords: ["android"] },
];

export function getPlatformColor(platform: Platform): string {
  if (platform.slug && PLATFORM_BG[platform.slug]) {
    return PLATFORM_BG[platform.slug];
  }

  const text = `${platform.name} ${platform.slug || ""}`.toLowerCase();

  const match = PLATFORM_KEYWORDS.find((item) =>
    item.keywords.some((keyword) => text.includes(keyword)),
  );

  return match ? PLATFORM_BG[match.slug] : "bg-ink-dim";
}
