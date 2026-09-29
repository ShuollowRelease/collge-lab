export const PRESET_GROUPS = [
  { id: "social", label: "社媒出图", items: ["ig", "igwall", "story"] },
  { id: "layout", label: "布局速选", items: ["pMosaic", "pEditorial", "pSplit", "pPolaroid", "pScrap", "pCircle", "pType", "pSns"] },
  { id: "theme", label: "主题与质感", items: ["tPaper", "tSepia", "tMidnight", "tWallpaper"] },
  { id: "video", label: "视频 / UI", items: ["pYtPanel", "player"] },
];

export const PRESETS = {
  ig: {
    id: "ig",
    name: "IG 发帖",
    patch: { layout: "polaroid", ratio: "4:5", theme: "paper", grain: "both", exportSize: "ig", gap: "standard", radius: "soft" },
  },
  igwall: {
    id: "igwall",
    name: "IG 动态墙",
    patch: { layout: "ig-post", ratio: "1:1", theme: "light", grain: "none", exportSize: "ig", gap: "narrow" },
  },
  story: {
    id: "story",
    name: "竖屏故事",
    patch: { layout: "yt-short", ratio: "9:16", theme: "dark", grain: "grain", exportSize: "ig", gap: "none" },
  },
  pMosaic: {
    id: "pMosaic",
    name: "马赛克",
    patch: { layout: "mosaic", theme: "dark", gap: "standard", radius: "soft", grain: "grain" },
  },
  pEditorial: {
    id: "pEditorial",
    name: "编辑风",
    patch: { layout: "editorial", theme: "paper", gap: "narrow", radius: "none", grain: "both", textStyle: "edition" },
  },
  pSplit: {
    id: "pSplit",
    name: "均分对切",
    patch: { layout: "split", theme: "midnight", gap: "narrow", radius: "none", grain: "none" },
  },
  pPolaroid: {
    id: "pPolaroid",
    name: "宝丽来",
    patch: { layout: "polaroid", theme: "paper", grain: "both", radius: "soft", gap: "wide" },
  },
  pScrap: {
    id: "pScrap",
    name: "剪贴簿",
    patch: { layout: "scrapbook", theme: "sepia", grain: "paper", gap: "standard", radius: "soft" },
  },
  pCircle: {
    id: "pCircle",
    name: "圆形",
    patch: { layout: "circle", theme: "midnight", grain: "grain", gap: "wide" },
  },
  pType: {
    id: "pType",
    name: "大字底图",
    patch: { layout: "type", theme: "dark", textStyle: "center", grain: "grain", glow: true },
  },
  pSns: {
    id: "pSns",
    name: "SNS 九宫",
    patch: { layout: "sns", theme: "light", gap: "narrow", radius: "medium", grain: "none", ratio: "1:1" },
  },
  tPaper: {
    id: "tPaper",
    name: "纸感",
    patch: { theme: "paper", grain: "both", bgMode: "solid", light: "softbox" },
  },
  tSepia: {
    id: "tSepia",
    name: "褪色",
    patch: { theme: "sepia", grain: "grain", light: "warm", lightStrength: 0.4 },
  },
  tMidnight: {
    id: "tMidnight",
    name: "午夜",
    patch: { theme: "midnight", grain: "grain", light: "cool", lightStrength: 0.35 },
  },
  tWallpaper: {
    id: "tWallpaper",
    name: "壁纸底",
    patch: { bgMode: "photo", ghost: 0.4, theme: "dark", light: "vignette" },
  },
  pYtPanel: {
    id: "pYtPanel",
    name: "视频面板",
    patch: { layout: "yt-panel", ratio: "16:9", theme: "dark", gap: "narrow", grain: "none" },
  },
  player: {
    id: "player",
    name: "播放器",
    patch: { layout: "player", ratio: "1:1", theme: "dark", grain: "grain", light: "vignette" },
  },
};
