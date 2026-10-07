import { PLAYER_ACCENT } from "./constants.js";

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
    // 单图文：干净矩形媒体 + 细缝，贴近 IG 主流 feed，不做宝丽来白边
    patch: {
      layout: "ig-post",
      ratio: "4:5",
      theme: "light",
      grain: "none",
      exportSize: "ig",
      gap: "narrow",
      radius: "soft",
      bgMode: "solid",
      light: "none",
    },
  },
  igwall: {
    id: "igwall",
    name: "IG 动态墙",
    // 多图九宫 / 拼贴墙：浅底卡片、无颗粒，chrome 图标走 icons.js
    patch: {
      layout: "ig-post",
      ratio: "1:1",
      theme: "light",
      grain: "none",
      exportSize: "ig",
      gap: "narrow",
      radius: "soft",
      bgMode: "solid",
      light: "none",
    },
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
    // YouTube 长视频：16:9 观看页，深色、无颗粒，红进度控制条
    patch: {
      layout: "yt-panel",
      ratio: "16:9",
      theme: "dark",
      gap: "narrow",
      grain: "none",
      light: "none",
      bgMode: "solid",
    },
  },
  player: {
    id: "player",
    name: "播放器",
    // Apple Music Now Playing：深色底、轻颗粒、vignette、品牌红强调
    patch: {
      layout: "player",
      ratio: "1:1",
      theme: "dark",
      grain: "grain",
      light: "vignette",
      lightStrength: 0.4,
      gap: "none",
      radius: "none",
      playerColor: PLAYER_ACCENT,
    },
  },
};

export const PRESET_DETAILS = {
  ig: { description: "单图社交发帖，含头像、点赞、评论与转发信息。", ratio: "4:5", layoutLabel: "社交发帖" },
  igwall: { description: "方形动态墙卡片，适合多图拼贴与社交互动展示。", ratio: "1:1", layoutLabel: "动态墙" },
  story: { description: "竖屏短视频封面，保留侧边互动和沉浸式画面。", ratio: "9:16", layoutLabel: "短视频" },
  pMosaic: { description: "主图加辅图的非对称拼贴，适合突出一张照片。", ratio: "当前画幅", layoutLabel: "马赛克" },
  pEditorial: { description: "编辑风格的大图与小格组合，适合杂志感排版。", ratio: "当前画幅", layoutLabel: "编辑版式" },
  pSplit: { description: "均分对切画面，适合两张照片并列比较。", ratio: "当前画幅", layoutLabel: "均分对切" },
  pPolaroid: { description: "错落的拍立得纸片效果，适合轻松的照片墙。", ratio: "当前画幅", layoutLabel: "拍立得" },
  pScrap: { description: "带层叠和错位的剪贴簿风格。", ratio: "当前画幅", layoutLabel: "剪贴簿" },
  pCircle: { description: "圆形裁切组合，适合头像与少量照片。", ratio: "当前画幅", layoutLabel: "圆形裁切" },
  pType: { description: "照片作为背景，配合大标题和文字层。", ratio: "当前画幅", layoutLabel: "大字底图" },
  pSns: { description: "九宫格社交网格，适合统一展示一组照片。", ratio: "1:1", layoutLabel: "九宫格" },
  tPaper: { description: "纸张质感主题，调整背景、颗粒与柔光。", ratio: "保留当前", layoutLabel: "纸张主题" },
  tSepia: { description: "暖褐色主题，适合复古和胶片感照片。", ratio: "保留当前", layoutLabel: "复古主题" },
  tMidnight: { description: "深色蓝调主题，适合夜景与高对比画面。", ratio: "保留当前", layoutLabel: "午夜主题" },
  tWallpaper: { description: "使用照片作为背景，并叠加低透明度拼贴。", ratio: "保留当前", layoutLabel: "照片壁纸" },
  pYtPanel: { description: "横屏视频面板，含进度、播放、音量和工具图标。", ratio: "16:9", layoutLabel: "视频面板" },
  player: { description: "Apple Music 风格的 Now Playing 播放器卡片。", ratio: "1:1", layoutLabel: "音乐播放器" },
};

/**
 * ��������Ĭ��ֵ��Ԥ��ֻ����ȷ�в���������������� App.jsx ��ɢ�� layout �жϡ�
 */
export const DEFAULT_LAYOUT_CAPABILITIES = {
  signature: true,
  text: true,
  freeform: false,
  player: false,
  videoControls: false,
  interactionStats: false,
  texture: true,
  gap: true,
  light: true,
  progressTrack: false,
  sharedCrop: false,
};

export const LAYOUT_CAPABILITIES = {
  custom: { freeform: true, sharedCrop: true },
  "ig-post": { text: false },
  "yt-panel": { text: false, player: true, videoControls: true, interactionStats: true, progressTrack: true },
  "yt-short": { text: false, player: true, videoControls: true, interactionStats: true, progressTrack: true, gap: false },
  player: { text: false, player: true, progressTrack: true, gap: false },
  type: { gap: false },
};

/** Resolve layout and matching preset capabilities without clearing state. */
export function resolveLayoutCapabilities(state = {}) {
  const layout = state.layout || "mosaic";
  const preset = state.lastPreset ? PRESETS[state.lastPreset] : null;
  const presetMatchesLayout = preset?.patch?.layout === layout;
  const presetCapabilities = presetMatchesLayout ? PRESET_DETAILS[state.lastPreset]?.capabilities : null;
  return {
    ...DEFAULT_LAYOUT_CAPABILITIES,
    ...(LAYOUT_CAPABILITIES[layout] || {}),
    ...(presetCapabilities || {}),
  };
}

function hasNonEmptyValue(value) {
  return String(value ?? "").trim().length > 0;
}

/** Resolve panel visibility from layout capabilities and current media data. */
export function resolvePanelAvailability(currentState = {}, photoCount = 0) {
  const capabilities = resolveLayoutCapabilities(currentState);
  const hasPhotos = photoCount > 0;
  const hasMedia = capabilities.player && hasPhotos;
  const hasDuration = hasMedia && hasNonEmptyValue(currentState.playerMeta?.timeRight);
  const hasStats = hasMedia && capabilities.interactionStats && Object.values(currentState.ytStats || {}).some(hasNonEmptyValue);
  return {
    capabilities,
    hasMedia,
    hasDuration,
    hasStats,
    hasIgInteraction: currentState.layout === "ig-post" && hasPhotos,
    showPlayerPanel: hasMedia && capabilities.player,
    showProgressTrack: hasMedia && capabilities.progressTrack,
    showTextPanel: capabilities.text,
    showSignaturePanel: capabilities.signature,
  };
}
Object.assign(PRESET_DETAILS, {
  story: {
    ...PRESET_DETAILS.story,
    capabilities: { text: false, player: true, videoControls: true, interactionStats: true, progressTrack: true, gap: false },
  },
  pYtPanel: {
    ...PRESET_DETAILS.pYtPanel,
    capabilities: { text: false, player: true, videoControls: true, interactionStats: true, progressTrack: true },
  },
  player: {
    ...PRESET_DETAILS.player,
    capabilities: { text: false, player: true, progressTrack: true, gap: false },
  },
});
