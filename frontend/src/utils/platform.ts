import type { Platform } from "../types/Game";

const PLATFORM_BG: Record<string, string> = {
  pc: "bg-blue-600",
  macos: "bg-slate-500",
  linux: "bg-orange-600",
  playstation5: "bg-blue-500",
  playstation4: "bg-blue-700",
  playstation3: "bg-blue-800",
  playstation2: "bg-blue-900",
  playstation1: "bg-indigo-800",
  "ps-vita": "bg-cyan-600",
  psp: "bg-cyan-800",
  "xbox-series-x": "bg-lime-500",
  "xbox-one": "bg-lime-600",
  "xbox-360": "bg-green-600",
  xbox: "bg-green-800",
  "nintendo-switch": "bg-red-500",
  "nintendo-switch-2": "bg-rose-600",
  "wii-u": "bg-sky-500",
  wii: "bg-slate-300",
  gamecube: "bg-purple-600",
  "nintendo-64": "bg-red-700",
  snes: "bg-indigo-500",
  nes: "bg-gray-500",
  "nintendo-3ds": "bg-red-600",
  "nintendo-ds": "bg-red-800",
  "game-boy-advance": "bg-violet-600",
  "game-boy": "bg-gray-400",
  ios: "bg-teal-500",
  android: "bg-emerald-500",
};

export function getPlatformColor(platform: Platform): string {
  return platform.slug && PLATFORM_BG[platform.slug]
    ? PLATFORM_BG[platform.slug]
    : "bg-ink-dim";
}
