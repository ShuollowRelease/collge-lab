import { defaultFreeform } from "./freeform.js";

export const LAYOUTS = [
  { id: "custom", name: "自定义网格", hint: "拖拽编辑", thumb: [[2, 2, 46, 46], [52, 2, 46, 46], [2, 52, 46, 46], [52, 52, 46, 46]] },
  { id: "mosaic", name: "马赛克", hint: "大小瓷砖", thumb: [[0, 0, 55, 100], [58, 0, 42, 48], [58, 52, 42, 48]] },
  { id: "contact", name: "接触印相", hint: "等格印样", thumb: [[2, 2, 29, 29], [35, 2, 29, 29], [68, 2, 29, 29], [2, 35, 29, 29], [35, 35, 29, 29], [68, 35, 29, 29], [2, 68, 29, 29], [35, 68, 29, 29], [68, 68, 29, 29]] },
  { id: "editorial", name: "编辑风", hint: "一大 + 小格", thumb: [[0, 0, 52, 100], [55, 0, 45, 48], [55, 52, 45, 48]] },
  { id: "split", name: "均分对切", hint: "2–6 张", thumb: [[0, 0, 48, 100], [52, 0, 48, 100]] },
  { id: "diagonal", name: "斜切", hint: "对角分割", thumb: [[0, 0, 100, 100]] },
  { id: "strip4", name: "四格条", hint: "连拍条", thumb: [[0, 4, 100, 20], [0, 28, 100, 20], [0, 52, 100, 20], [0, 76, 100, 20]] },
  { id: "vline", name: "竖线", hint: "纵向长条", thumb: [[0, 0, 22, 100], [26, 0, 22, 100], [52, 0, 22, 100], [78, 0, 22, 100]] },
  { id: "hline", name: "横线", hint: "横向长条", thumb: [[0, 4, 100, 18], [0, 28, 100, 18], [0, 52, 100, 18], [0, 76, 100, 18]] },
  { id: "polaroid", name: "宝丽来", hint: "散落相纸", thumb: [[8, 10, 32, 40], [40, 5, 32, 40], [62, 30, 32, 40], [20, 48, 32, 40]] },
  { id: "scrapbook", name: "剪贴簿", hint: "叠放拼贴", thumb: [[5, 8, 48, 55], [35, 20, 50, 55], [18, 45, 48, 48]] },
  { id: "circle", name: "圆形", hint: "少数几张", thumb: [[8, 20, 28, 28], [38, 8, 28, 28], [62, 35, 28, 28]] },
  { id: "type", name: "大字底图", hint: "底图 + 标题", thumb: [[0, 0, 100, 100]] },
  { id: "sns", name: "SNS 网格", hint: "正方九宫", thumb: [[2, 2, 30, 30], [35, 2, 30, 30], [68, 2, 30, 30], [2, 35, 30, 30], [35, 35, 30, 30], [68, 35, 30, 30], [2, 68, 30, 30], [35, 68, 30, 30], [68, 68, 30, 30]] },
  { id: "ig-post", name: "IG 发帖", hint: "Ins 动态墙", thumb: [[10, 18, 36, 28], [54, 18, 36, 28], [10, 50, 36, 28], [54, 50, 36, 28]] },
  { id: "yt-short", name: "短视频", hint: "竖屏 UI", thumb: [[20, 0, 60, 100]] },
  { id: "yt-panel", name: "视频面板", hint: "横屏 + 底栏", thumb: [[0, 0, 100, 55], [0, 60, 100, 38]] },
  { id: "player", name: "播放器", hint: "Now Playing", thumb: [[0, 0, 100, 100]] },
  { id: "grid", name: "均分网格", hint: "自动列数", thumb: [[4, 4, 44, 44], [52, 4, 44, 44], [4, 52, 44, 44], [52, 52, 44, 44]] },
];

export const THEMES = {
  dark: { bg: "#121110", ink: "#f3efe4", accent: "#c9a227", card: "#1c1b18", sub: "#8a857a" },
  light: { bg: "#f7f4ec", ink: "#1c1b18", accent: "#b8860b", card: "#ffffff", sub: "#6b6558" },
  paper: { bg: "#f3efe4", ink: "#2a2620", accent: "#8b6914", card: "#ede6d4", sub: "#7a7264" },
  sepia: { bg: "#2c2419", ink: "#e8d9b8", accent: "#d4a853", card: "#3d3224", sub: "#a89470" },
  midnight: { bg: "#0b1020", ink: "#e8eef5", accent: "#6b9fd4", card: "#151b2e", sub: "#7a8699" },
};

export const RATIOS = {
  "1:1": 1,
  "4:5": 4 / 5,
  "3:4": 3 / 4,
  "9:16": 9 / 16,
  "9:19.5": 9 / 19.5,
  "16:9": 16 / 9,
};

export const GAP = { none: 0, narrow: 8, standard: 16, wide: 32 };
export const RADIUS = { none: 0, soft: 8, medium: 16, large: 28 };

/**
 * IG 发帖卡片 chrome 比例（相对画布 W/H，0–1）。
 * 与 layoutIgPost 的媒体区对齐：头像行 → 照片 → 操作栏 → 点赞/文案。
 */
export const IG_CHROME = {
  card: { x: 0.05, y: 0.06, w: 0.9, h: 0.88 },
  cardRadiusRatio: 0.028,
  padRatio: 0.045,
  headerYRatio: 0.07,
  mediaBottomRatio: 0.74,
  avatarRatio: 0.055,
  iconRatio: 0.038,
  textMainRatio: 0.03,
  textSubRatio: 0.024,
};

/**
 * 音乐播放器 chrome 比例（Apple Music Now Playing 构图）。
 * 大封面 → 曲名/艺人 → 进度条 → 控制条；全部 0–1 相对画布。
 */
export const PLAYER_CHROME = {
  artRatio: 0.62,
  artTopRatio: 0.1,
  artRadiusRatio: 0.035,
  titleTopRatio: 0.72,
  artistTopRatio: 0.775,
  progressYRatio: 0.84,
  progressWRatio: 0.78,
  progressHRatio: 0.012,
  timeTopRatio: 0.88,
  transportYRatio: 0.93,
  iconRatio: 0.048,
  playRatio: 0.088,
  sideGapRatio: 0.16,
};

/** Apple Music 强调色（品牌红）；画布 chrome 与 Web 预设共用。 */
export const PLAYER_ACCENT = "#fa2d48";
export const PLAYER_ACCENT_SOFT = "rgba(250, 45, 72, 0.35)";

export const DEFAULT_IG_STATS = { likes: "128", comments: "12", reposts: "4", shares: "4" };
export const DEFAULT_YT_STATS = { likes: "1.2k", comments: "88", reposts: "" };
export const DEFAULT_PLAYER_META = {
  header: "",
  track: "Now Playing",
  artist: "photo-cut",
  timeLeft: "1:24",
  timeRight: "3:42",
};

/**
 * YouTube 长视频 chrome 比例（播放器本体 + 标题区）。
 * 16:9 主画面 → 底部渐变控制条 → 标题/频道行。
 */
export const YT_LONG_CHROME = {
  /** 控制条高度相对画布 H */
  controlsHRatio: 0.12,
  progressYRatio: 0.78,
  progressWRatio: 0.92,
  progressHRatio: 0.01,
  progressHoverHRatio: 0.018,
  btnRatio: 0.042,
  titleTopRatio: 0.88,
  channelTopRatio: 0.935,
  padRatio: 0.04,
  playCircleRatio: 0.12,
};

/** yt-short 竖屏互动栏比例，Canvas 与网页覆盖层共用，确保不同画幅下不越界。 */
export const YT_SHORT_CHROME = {
  railXRatio: 0.79,
  railWidthRatio: 0.17,
  railTopRatio: 0.43,
  railBottomRatio: 0.88,
  iconRatio: 0.055,
  itemStepRatio: 0.092,
  countOffsetRatio: 0.066,
};

/** YouTube 品牌红；进度条与播放钮共用。 */
export const YT_ACCENT = "#ff0000";
export const YT_ACCENT_SOFT = "rgba(255, 0, 0, 0.35)";

/* ------------------------------------------------------------------ *
 * 自定义网格 · 高级编辑
 * 所有几何一律用 0–1 归一化坐标：预览与导出共用同一份数据，
 * 导出时 resolveExportSize() 换尺寸重画也不会变形。
 * ------------------------------------------------------------------ */

/** 单格最小边长（画布 CSS 像素）；拖拽时不允许把格子压得比它更小。 */
export const CELL_MIN_PX = 44;
/** 自定义网格行列数上限，防止格子小到无法操作。 */
export const GRID_LIMIT = 8;
/** 撤销栈深度（仅本次会话，不进 localStorage）。 */
export const UNDO_MAX = 40;
/** 分隔线 / 交叉点的命中半径，单位：画布 CSS 像素。 */
export const HANDLE_HIT_PX = 10;
/** 拖拽过程允许越界像素，用于区分「点击选择」与「拖动几何」。 */
export const DRAG_ACTIVE_PX = 3;
/** 叠加/删除行列时，新分隔线插在该间隙的比例位置。 */
export const DIVIDER_SPLIT_RATIO = 0.5;

/** 形状可用性由 shapes.js 定义，这里只放分组与默认值，避免两份字面量。 */
export const SHAPE_GROUPS = [
  { id: "basic", label: "基础形", items: ["rounded", "circle", "ellipse", "squircle"] },
  { id: "solid", label: "实心形", items: ["heart", "hexagon", "diamond", "pentagon", "star"] },
  { id: "cut", label: "切角形", items: ["arch", "blob", "triangle", "halfCircle", "quarterCircle", "speech"] },
];

const SHAPE_LABELS = {
  rounded: "圆角矩形",
  circle: "正圆",
  ellipse: "椭圆",
  squircle: "超椭圆",
  heart: "爱心",
  hexagon: "六边形",
  diamond: "菱形",
  pentagon: "五边形",
  star: "星形",
  arch: "拱形",
  blob: "云朵",
  triangle: "三角",
  halfCircle: "半圆",
  quarterCircle: "四分之一圆",
  speech: "对话气泡",
};

/** SHAPES 字典：id → 中文名。与 shapes.js 的几何表一一对应。 */
export const SHAPES = Object.fromEntries(
  Object.entries(SHAPE_LABELS).map(([id, name]) => [id, { id, name }])
);

/** 形状蒙版「自适应完整显示」：留白不裁切。 */
export const SHAPE_FITS = {
  cover: { id: "cover", label: "填充格子" },
  contain: { id: "contain", label: "完整显示" },
};

/** 默认形状：面板与绘制共用的单一来源，禁止在 UI 里写字面量。 */
export const DEFAULT_SHAPE_ID = "heart";

/** 默认外边框与格间距，单位与 GAP 一致（800px 基准下的像素，按画布缩放）。 */
export const GRID_PAD = { outer: 12, gap: 10 };
/** 上述像素值的基准边长：与 GAP / RADIUS 的 800 基准一致。 */
export const GRID_PAD_BASE = 800;

export function nodeKey(c, r) {
  return `${c},${r}`;
}

export function defaultCustomGrid() {
  return {
    on: false,
    mode: "grid",
    rows: 2,
    cols: 3,
    colsX: [0, 1 / 3, 2 / 3, 1],
    rowsY: [0, 0.5, 1],
    nodes: {},
    shapes: {},
    outerPad: GRID_PAD.outer,
    cellGap: GRID_PAD.gap,
    fits: {},
    freeform: defaultFreeform(),
  };
}

export const FONTS = {
  gothic: { display: '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif', weight: "700" },
  mincho: { display: 'Georgia, "Songti SC", "SimSun", serif', weight: "500" },
  rounded: { display: '"Segoe UI", "Microsoft YaHei", "PingFang SC", sans-serif', weight: "600" },
  display: { display: 'Georgia, "Songti SC", "SimSun", serif', weight: "900" },
  handwriting: { display: '"MaShanZheng", "LongCang", cursive', weight: "400" },
  script: { display: '"GreatVibes", "ZCOOLXiaoWei", cursive', weight: "400" },
};

export const SIG_FONTS = {
  script: { display: '"GreatVibes", cursive', weight: "400" },
  handwriting: { display: '"MaShanZheng", cursive', weight: "400" },
  longcang: { display: '"LongCang", cursive', weight: "400" },
  liujian: { display: '"LiuJianMaoCao", cursive', weight: "400" },
  gothic: { display: '"Segoe UI", "PingFang SC", sans-serif', weight: "600" },
};

export const SIG_POSITIONS = [
  { id: "tl", label: "左上" },
  { id: "tc", label: "顶部居中" },
  { id: "tr", label: "右上" },
  { id: "ml", label: "左中" },
  { id: "c", label: "居中" },
  { id: "mr", label: "右中" },
  { id: "bl", label: "左下" },
  { id: "bc", label: "底部居中" },
  { id: "br", label: "右下" },
  { id: "free", label: "自由位置" },
];

export const SIG_ANCHORS = {
  tl: [0.12, 0.12],
  tc: [0.5, 0.12],
  tr: [0.88, 0.12],
  ml: [0.12, 0.52],
  c: [0.5, 0.56],
  mr: [0.88, 0.52],
  bl: [0.12, 0.9],
  bc: [0.5, 0.9],
  br: [0.88, 0.9],
};
export const SIG_DEFAULT_FREE_POINT = [0.88, 0.9];

export const SIG_EFFECTS = [
  { id: "soft", label: "柔和阴影" },
  { id: "ink", label: "强调色" },
  { id: "glow", label: "微光" },
  { id: "plain", label: "纯色" },
];

export const SIGNATURE_ASSET_LIMIT = 8 * 1024 * 1024;
export const SIGNATURE_IMAGE_TYPES = ["image/png", "image/svg+xml"];
export const SIGNATURE_FONT_TYPES = ["font/ttf", "font/otf", "font/woff", "font/woff2"];
export const SIGNATURE_FREE_MARGIN = 0.04;
export const SIGNATURE_IMAGE_HEIGHT_RATIO = 1.35;
export const PLAYER_MINOR_ICON_RATIO = 0.72;
export const SIGNATURE_KEY_STEP = 0.005;
export const SIGNATURE_KEY_FAST_STEP = 0.05;
export const DEFAULT_PLAYER_PROGRESS = 0.38;
export const DEFAULT_PLAYER_BUFFERED = 0.62;
export const DEFAULT_VIDEO_PROGRESS = 0.42;
/** 播放器进度轨道的视觉宽度（相对可用容器宽度的百分比），与播放状态完全独立。 */
export const PROGRESS_TRACK_WIDTH = {
  default: 78,
  min: 35,
  max: 95,
  step: 1,
};

export function normalizeProgressTrackWidth(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return PROGRESS_TRACK_WIDTH.default;
  return Math.min(PROGRESS_TRACK_WIDTH.max, Math.max(PROGRESS_TRACK_WIDTH.min, numeric));
}

export function defaultSignature() {
  return {
    enabled: true,
    text: "photo-cut",
    font: "script",
    effect: "soft",
    size: 0.08,
    rotate: -6,
    opacity: 0.72,
    pos: "br",
    x: SIG_DEFAULT_FREE_POINT[0],
    y: SIG_DEFAULT_FREE_POINT[1],
    color: "ink",
    imageData: "",
    imageAsset: null,
    customFont: null,
  };
}

/** 当前选中的形状蒙版，默认内容不进画布（仅面板初值）。 */
export function defaultShapePick() {
  return { shape: DEFAULT_SHAPE_ID, fit: "cover" };
}

export function defaultState() {
  return {
    photos: [],
    layout: "mosaic",
    ratio: "1:1",
    theme: "dark",
    cols: "auto",
    bgMode: "solid",
    ghost: 0.35,
    gap: "standard",
    radius: "soft",
    grain: "both",
    light: "none",
    lightStrength: 0.45,
    lightColor: "#fff5e0",
    volumeBar: false,
    title: "",
    subtitle: "",
    footer: "",
    subfooter: "",
    textStyle: "head-footer",
    font: "gothic",
    fontSub: "gothic",
    glow: false,
    ui: {
      subs: false,
      autoplay: false,
      live: false,
      playing: true,
      liked: false,
      bookmarked: false,
      ytCommented: false,
      ytShared: false,
      showCounts: false,
      iconTheme: "twitter",
      muted: false,
      playerProgress: DEFAULT_PLAYER_PROGRESS,
      playerBuffered: DEFAULT_PLAYER_BUFFERED,
      progressTrackWidth: PROGRESS_TRACK_WIDTH.default,
      shuffle: false,
      repeat: false,
      lyrics: false,
    },
    ytStats: { ...DEFAULT_YT_STATS },
    igStats: { ...DEFAULT_IG_STATS },
    igCaption: "",
    igBrand: "",
    playerMeta: { ...DEFAULT_PLAYER_META },
    playerColor: PLAYER_ACCENT,
    exportSize: "ig",
    exportFormat: "jpg",
    maxMB: 2,
    lastPreset: "",
    credit: false,
    activeId: null,
    editMode: "crop",
    signature: defaultSignature(),
    customGrid: defaultCustomGrid(),
    shapePick: defaultShapePick(),
  };
}
