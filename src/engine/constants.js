export const LAYOUTS = [
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
  };
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
    ui: { subs: false, autoplay: false, live: false, playing: true, liked: false, showCounts: false, iconTheme: "twitter" },
    ytStats: { likes: "", comments: "", reposts: "" },
    igStats: { likes: "", comments: "", reposts: "", shares: "" },
    igCaption: "",
    igBrand: "",
    playerMeta: { header: "", track: "", artist: "", timeLeft: "", timeRight: "" },
    playerColor: "#7c3aed",
    exportSize: "ig",
    exportFormat: "jpg",
    maxMB: 2,
    lastPreset: "",
    credit: false,
    activeId: null,
    editMode: "crop",
    signature: defaultSignature(),
  };
}
