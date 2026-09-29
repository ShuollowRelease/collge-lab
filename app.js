/* 光房拼贴 — client-side collage engine */
(() => {
  "use strict";

  const LAYOUTS = [
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

  const THEMES = {
    dark: { bg: "#121110", ink: "#f3efe4", accent: "#c9a227", card: "#1c1b18", sub: "#8a857a" },
    light: { bg: "#f7f4ec", ink: "#1c1b18", accent: "#b8860b", card: "#ffffff", sub: "#6b6558" },
    paper: { bg: "#f3efe4", ink: "#2a2620", accent: "#8b6914", card: "#ede6d4", sub: "#7a7264" },
    sepia: { bg: "#2c2419", ink: "#e8d9b8", accent: "#d4a853", card: "#3d3224", sub: "#a89470" },
    midnight: { bg: "#0b1020", ink: "#e8eef5", accent: "#6b9fd4", card: "#151b2e", sub: "#7a8699" },
  };

  const RATIOS = {
    "1:1": 1,
    "4:5": 4 / 5,
    "3:4": 3 / 4,
    "9:16": 9 / 16,
    "9:19.5": 9 / 19.5,
    "16:9": 16 / 9,
  };

  const GAP = { none: 0, narrow: 8, standard: 16, wide: 32 };
  const RADIUS = { none: 0, soft: 8, medium: 16, large: 28 };

  const FONTS = {
    gothic: { display: '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif', weight: "700" },
    mincho: { display: 'Georgia, "Songti SC", "SimSun", serif', weight: "500" },
    rounded: { display: '"Segoe UI", "Microsoft YaHei", "PingFang SC", sans-serif', weight: "600" },
    display: { display: 'Georgia, "Songti SC", "SimSun", serif', weight: "900" },
    hand: { display: '"Segoe Print", "Comic Sans MS", "Segoe UI", sans-serif', weight: "500" },
    script: { display: '"Segoe Script", "Brush Script MT", cursive', weight: "400" },
  };

  const SETTINGS_KEY = "glow-collage-settings-v2";
  const TEXT_MEMORY_KEY = "glow-collage-text-v2";
  const SAMPLE_SRC = "text.jpg";
  let samplePhoto = null;

  const state = {
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
    colorPickMode: false,
    customIcons: {},
    exportSize: "ig",
    exportFormat: "jpg",
    maxMB: 2,
    lastPreset: "",
    lastExport: null,
    photoZoomAll: 1,
    viewZoom: 1,
    spacePan: false,
    credit: false,
    activeId: null,
    editMode: "crop",
  };

  let previewW = 800;
  let previewH = 800;
  let lastSlots = [];
  let toastTimer = null;
  let dragPan = null;
  let dragSortId = null;

  const els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function showToast(msg, isError = false) {
    els.toast.hidden = false;
    els.toast.textContent = msg;
    els.toast.classList.toggle("is-error", isError);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.toast.hidden = true;
    }, 2600);
  }

  function theme() {
    return THEMES[state.theme] || THEMES.dark;
  }

  function hexToRgba(hex, alpha) {
    const h = (hex || "#ffffff").replace("#", "");
    const r = parseInt(h.substring(0, 2), 16) || 255;
    const g = parseInt(h.substring(2, 4), 16) || 255;
    const b = parseInt(h.substring(4, 6), 16) || 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function hslToHex(h, s, l) {
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h / 30) % 12;
      const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * c).toString(16).padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  function gapPx(w, h) {
    if (state.bgMode === "edge" && state.layout !== "player") return 0;
    const base = Math.min(w, h);
    return Math.round(GAP[state.gap] * (base / 800));
  }

  function radiusPx(w, h) {
    if (state.bgMode === "edge") return 0;
    const base = Math.min(w, h);
    return Math.round(RADIUS[state.radius] * (base / 800));
  }

  function activePhoto() {
    return state.photos.find((p) => p.id === state.activeId) || state.photos[0] || null;
  }

  function ensureCrop(photo) {
    if (!photo.crop) photo.crop = { zoom: 1, ox: 0, oy: 0 };
    return photo.crop;
  }

  /* ——— polish: presets / undo / perf ——— */
  function ui(over) {
    return Object.assign(
      {
        subs: false,
        autoplay: false,
        live: false,
        playing: true,
        liked: false,
        showCounts: false,
        iconTheme: "twitter",
      },
      over || {}
    );
  }

  function preset(name, layout, extra) {
    const base = {
      name,
      settings: Object.assign(
        {
          layout,
          ratio: "1:1",
          theme: "dark",
          cols: "auto",
          bgMode: "solid",
          gap: "standard",
          radius: "soft",
          grain: "both",
          light: "none",
          lightStrength: 0.45,
          ghost: 0.35,
          exportSize: "ig",
          exportFormat: "jpg",
          maxMB: 2,
          textStyle: "head-footer",
          font: "gothic",
          fontSub: "gothic",
          glow: false,
          volumeBar: false,
          credit: false,
          title: "",
          subtitle: "",
          footer: "",
          subfooter: "",
          ui: ui(),
        },
        extra || {}
      ),
    };
    return base;
  }

  /** 参考 totekawa 场景：社媒 / 布局 / 主题质感 / 视频 UI */
  const PRESET_GROUPS = [
    {
      id: "social",
      label: "社媒出图",
      items: ["ig", "igwall", "x", "xwide", "story"],
    },
    {
      id: "layout",
      label: "布局速选",
      items: ["pMosaic", "pContact", "pEditorial", "pSplit", "pDiagonal", "pStrip4", "pVline", "pHline", "pPolaroid", "pScrap", "pCircle", "pType", "pSns"],
    },
    {
      id: "theme",
      label: "主题与质感",
      items: ["tPaper", "tSepia", "tMidnight", "tWallpaper", "tJacket", "tGlass"],
    },
    {
      id: "video",
      label: "视频 / UI",
      items: ["fan", "pYtPanel", "player", "pYtLive"],
    },
    {
      id: "arch",
      label: "归档",
      items: ["archive", "archiveFilm"],
    },
  ];

  const PRESETS = {
    /* —— 社媒 —— */
    ig: preset("IG 发帖", "polaroid", {
      ratio: "4:5",
      theme: "paper",
      grain: "both",
      exportSize: "ig",
      maxMB: 2,
    }),
    igwall: preset("IG 动态墙", "ig-post", {
      ratio: "4:5",
      theme: "light",
      gap: "none",
      radius: "none",
      grain: "none",
      exportSize: "ig",
      ui: ui({ liked: true }),
      igBrand: "",
      igCaption: "",
      igStats: { likes: "", comments: "", reposts: "", shares: "" },
    }),
    x: preset("X 方图", "grid", {
      ratio: "1:1",
      theme: "dark",
      gap: "narrow",
      radius: "medium",
      grain: "grain",
      light: "vignette",
      lightStrength: 0.35,
      exportSize: "x",
      maxMB: 5,
      font: "display",
    }),
    xwide: preset("X 横版", "editorial", {
      ratio: "16:9",
      theme: "midnight",
      gap: "narrow",
      radius: "soft",
      grain: "grain",
      light: "diag-l",
      lightStrength: 0.4,
      exportSize: "x",
      maxMB: 5,
    }),
    story: preset("竖屏故事", "mosaic", {
      ratio: "9:16",
      theme: "dark",
      gap: "none",
      radius: "none",
      grain: "grain",
      light: "vignette",
      exportSize: "ig",
    }),

    /* —— 布局速选 —— */
    pMosaic: preset("马赛克", "mosaic", { ratio: "1:1", theme: "dark", exportSize: "ig" }),
    pContact: preset("接触印相", "contact", {
      ratio: "1:1",
      theme: "dark",
      gap: "narrow",
      radius: "none",
      bgMode: "edge",
      grain: "none",
      exportSize: "ig",
      textStyle: "edition",
    }),
    pEditorial: preset("编辑风", "editorial", {
      ratio: "4:5",
      theme: "paper",
      grain: "paper",
      exportSize: "ig",
      font: "mincho",
    }),
    pSplit: preset("均分对切", "split", { ratio: "1:1", theme: "dark", gap: "standard", exportSize: "ig" }),
    pDiagonal: preset("斜切", "diagonal", { ratio: "1:1", theme: "midnight", gap: "none", exportSize: "ig" }),
    pStrip4: preset("四格条", "strip4", { ratio: "4:5", theme: "dark", gap: "narrow", grain: "grain", exportSize: "ig" }),
    pVline: preset("竖线", "vline", { ratio: "3:4", theme: "dark", gap: "narrow", exportSize: "ig" }),
    pHline: preset("横线", "hline", { ratio: "16:9", theme: "dark", gap: "narrow", exportSize: "ig" }),
    pPolaroid: preset("宝丽来", "polaroid", { ratio: "4:5", theme: "paper", grain: "both", exportSize: "ig" }),
    pScrap: preset("剪贴簿", "scrapbook", { ratio: "1:1", theme: "sepia", grain: "paper", exportSize: "ig" }),
    pCircle: preset("圆形", "circle", { ratio: "1:1", theme: "midnight", gap: "wide", radius: "large", exportSize: "ig" }),
    pType: preset("大字底图", "type", {
      ratio: "1:1",
      theme: "dark",
      grain: "grain",
      exportSize: "ig",
      textStyle: "center-type",
      font: "display",
      glow: true,
      title: "COLLAGE",
    }),
    pSns: preset("SNS 九宫", "sns", {
      ratio: "1:1",
      theme: "light",
      gap: "narrow",
      radius: "soft",
      grain: "none",
      exportSize: "ig",
    }),

    /* —— 主题质感 —— */
    tPaper: preset("纸张胶片", "grid", {
      ratio: "4:5",
      theme: "paper",
      gap: "standard",
      radius: "soft",
      grain: "both",
      light: "none",
      exportSize: "ig",
    }),
    tSepia: preset("深褐怀旧", "mosaic", {
      ratio: "1:1",
      theme: "sepia",
      gap: "standard",
      radius: "medium",
      grain: "paper",
      light: "diag-l",
      lightStrength: 0.5,
      exportSize: "ig",
    }),
    tMidnight: preset("午夜蓝调", "editorial", {
      ratio: "3:4",
      theme: "midnight",
      gap: "wide",
      radius: "soft",
      grain: "grain",
      light: "vignette",
      lightStrength: 0.55,
      exportSize: "ig",
    }),
    tWallpaper: preset("手机壁纸", "mosaic", {
      ratio: "9:19.5",
      theme: "midnight",
      bgMode: "ghost",
      ghost: 0.4,
      gap: "none",
      radius: "none",
      grain: "grain",
      exportSize: "original",
    }),
    tJacket: preset("专辑封面风", "type", {
      ratio: "1:1",
      theme: "midnight",
      bgMode: "jacket",
      gap: "none",
      radius: "soft",
      grain: "grain",
      exportSize: "ig",
      textStyle: "center-type",
    }),
    tGlass: preset("玻璃面板", "grid", {
      ratio: "9:16",
      theme: "midnight",
      bgMode: "glass",
      gap: "standard",
      radius: "medium",
      grain: "none",
      light: "spot",
      lightStrength: 0.4,
      exportSize: "ig",
    }),

    /* —— 视频 / UI —— */
    fan: preset("短视频二创", "yt-short", {
      ratio: "9:16",
      theme: "midnight",
      gap: "none",
      radius: "none",
      grain: "grain",
      light: "vignette",
      lightStrength: 0.5,
      exportSize: "ig",
      ui: ui({ subs: true, autoplay: true, playing: true, liked: true }),
      ytStats: { likes: "", comments: "", reposts: "" },
    }),
    pYtPanel: preset("视频面板", "yt-panel", {
      ratio: "16:9",
      theme: "midnight",
      gap: "narrow",
      grain: "grain",
      exportSize: "ig",
      ui: ui({ subs: true, playing: true, liked: false }),
    }),
    player: preset("播放器封面", "player", {
      ratio: "9:16",
      theme: "midnight",
      gap: "none",
      radius: "none",
      grain: "grain",
      exportSize: "ig",
      playerColor: "#7c3aed",
      playerMeta: { header: "", track: "", artist: "", timeLeft: "", timeRight: "" },
      ui: ui({ playing: true, liked: true }),
    }),
    pYtLive: preset("直播中", "yt-short", {
      ratio: "9:16",
      theme: "dark",
      gap: "none",
      grain: "grain",
      light: "vignette",
      exportSize: "ig",
      ui: ui({ live: true, playing: true, subs: true, liked: false, showCounts: true }),
      ytStats: { likes: "", comments: "直播", reposts: "" },
    }),

    /* —— 归档 —— */
    archive: preset("印样归档", "contact", {
      ratio: "1:1",
      theme: "dark",
      bgMode: "edge",
      gap: "narrow",
      radius: "none",
      grain: "none",
      exportSize: "original",
      exportFormat: "png",
      maxMB: 0,
      textStyle: "edition",
    }),
    archiveFilm: preset("胶片归档", "strip4", {
      ratio: "3:4",
      theme: "sepia",
      gap: "narrow",
      radius: "none",
      grain: "both",
      light: "diag-r",
      lightStrength: 0.35,
      exportSize: "original",
      exportFormat: "png",
      maxMB: 0,
      textStyle: "edition",
    }),
  };

  function renderPresetPanels() {
    const roots = [
      { el: $("preset-groups"), compact: false },
    ];
    roots.forEach(({ el: root, compact }) => {
      if (!root) return;
      root.innerHTML = "";
      root.classList.add("preset-groups");
      if (compact) root.classList.add("is-compact");

      PRESET_GROUPS.forEach((group, gi) => {
        const wrap = document.createElement("div");
        wrap.className = "preset-group";
        wrap.dataset.group = group.id;

        const head = document.createElement("button");
        head.type = "button";
        head.className = "preset-group-head";
        head.setAttribute("aria-controls", `${group.id}-preset-options`);
        head.innerHTML = `<span class="preset-group-title">${group.label}</span><span class="preset-group-count">${group.items.filter((id) => PRESETS[id]).length}</span><span class="preset-group-caret" aria-hidden="true">▸</span>`;

        const row = document.createElement("div");
        row.className = "preset-chip-row";
        row.id = `${group.id}-preset-options`;
        // 默认全部收起，侧栏更紧凑；应用预设时再展开对应组
        row.hidden = true;
        head.setAttribute("aria-expanded", "false");

        group.items.forEach((id) => {
          const p = PRESETS[id];
          if (!p) return;
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "preset-chip";
          btn.dataset.preset = id;
          btn.textContent = p.name;
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            applyPreset(id);
          });
          row.appendChild(btn);
        });

        head.addEventListener("click", () => {
          const open = row.hidden;
          // 手风琴：只展开一组（侧栏更紧凑）
          if (open && !compact) {
            root.querySelectorAll(".preset-group").forEach((g) => {
              const r = g.querySelector(".preset-chip-row");
              const h = g.querySelector(".preset-group-head");
              if (r) r.hidden = true;
              if (h) h.setAttribute("aria-expanded", "false");
            });
          }
          row.hidden = !open;
          head.setAttribute("aria-expanded", open ? "true" : "false");
        });

        wrap.append(head, row);
        root.appendChild(wrap);
      });
    });
  }

  function syncPresetChips(activeId) {
    document.querySelectorAll(".preset-chip").forEach((chip) => {
      chip.classList.toggle("is-active", chip.dataset.preset === activeId);
    });
    // 自动展开当前预设所在分组
    if (activeId && PRESETS[activeId]) {
      const gid = PRESET_GROUPS.find((g) => g.items.includes(activeId))?.id;
      document.querySelectorAll("#preset-groups .preset-group").forEach((g) => {
        const on = g.dataset.group === gid;
        const row = g.querySelector(".preset-chip-row");
        const head = g.querySelector(".preset-group-head");
        if (!on) {
          if (row) row.hidden = true;
          if (head) head.setAttribute("aria-expanded", "false");
          return;
        }
        if (row) row.hidden = false;
        if (head) head.setAttribute("aria-expanded", "true");
      });
    }
  }

  const undoStack = [];
  const redoStack = [];
  const UNDO_MAX = 40;
  let renderQueued = false;
  let lightDrag = false;
  let cropSnapAt = 0;
  state.trash = state.trash || [];

  function clonePhotosForUndo() {
    return state.photos.map((p) => ({
      id: p.id,
      name: p.name,
      url: p.url,
      img: p.img,
      crop: { zoom: p.crop?.zoom ?? 1, ox: p.crop?.ox ?? 0, oy: p.crop?.oy ?? 0 },
    }));
  }

  function snapshot(label) {
    undoStack.push({
      label,
      photos: clonePhotosForUndo(),
      activeId: state.activeId,
      settings: collectSettings(),
    });
    if (undoStack.length > UNDO_MAX) undoStack.shift();
    redoStack.length = 0;
    if (els.btnUndo) els.btnUndo.disabled = false;
    if (els.btnRedo) els.btnRedo.disabled = true;
  }

  function snapshotThrottled(label) {
    const now = performance.now();
    if (now - cropSnapAt < 400) return;
    cropSnapAt = now;
    snapshot(label);
  }

  function captureHistory(label) {
    return { label, photos: clonePhotosForUndo(), activeId: state.activeId, settings: collectSettings() };
  }

  function restoreHistory(snap) {
    state.photos = snap.photos.map((p) => ({ ...p, crop: { ...p.crop } }));
    state.activeId = snap.activeId;
    applySettings(snap.settings);
    syncControlsFromState();
    renderLayoutOptions();
    computePreviewSize();
    renderFilmstrip();
    render();
    updateTextAvailability();
  }

  function undoOnce() {
    const snap = undoStack.pop();
    if (!snap) {
      showToast("没有可撤销的操作");
      return;
    }
    redoStack.push(captureHistory(snap.label));
    restoreHistory(snap);
    if (els.btnUndo) els.btnUndo.disabled = undoStack.length === 0;
    if (els.btnRedo) els.btnRedo.disabled = false;
    showToast(`已撤销：${snap.label}`);
  }

  function redoOnce() {
    const snap = redoStack.pop();
    if (!snap) {
      showToast("没有可重做的操作");
      return;
    }
    undoStack.push(captureHistory(snap.label));
    restoreHistory(snap);
    if (els.btnUndo) els.btnUndo.disabled = false;
    if (els.btnRedo) els.btnRedo.disabled = redoStack.length === 0;
    showToast(`已重做：${snap.label}`);
  }

  function renderSoon() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      render();
    });
  }

  function setActivePhoto(id) {
    state.activeId = id;
    document.querySelectorAll(".film-frame").forEach((el) => {
      el.classList.toggle("is-active", el.dataset.id === id);
    });
    syncCropUi();
    renderSoon();
  }

  function applyPreset(id) {
    const preset = PRESETS[id];
    if (!preset) return;
    snapshot(`预设·${preset.name}`);
    applySettings(preset.settings);
    state.lastPreset = id;
    syncControlsFromState();
    renderLayoutOptions();
    computePreviewSize();
    softRender();
    updateTextAvailability();
    syncPresetChips(id);
    showToast(`已应用预设：${preset.name} · ${themeName(state.theme)} · ${state.ratio} · ${layoutName(state.layout)}`);
  }

  /* ——— drawing primitives ——— */
  function roundedPath(c, x, y, w, h, r) {
    const rr = Math.max(0, Math.min(r, w / 2, h / 2));
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }

  function drawCover(c, img, x, y, w, h, r, crop) {
    if (w <= 0 || h <= 0 || !img) return;
    const localZoom = Number(crop?.zoom ?? 1) || 1;
    const globalZoom = Number(state.photoZoomAll ?? 1) || 1;
    const zoom = Math.max(0.4, localZoom * globalZoom);
    const ox = crop?.ox ?? 0;
    const oy = crop?.oy ?? 0;

    c.save();
    if (r > 0) roundedPath(c, x, y, w, h, r);
    else {
      c.beginPath();
      c.rect(x, y, w, h);
    }
    c.clip();

    const iw = img.width || img.naturalWidth || 0;
    const ih = img.height || img.naturalHeight || 0;
    if (!iw || !ih) {
      c.restore();
      return;
    }
    const ir = iw / ih;
    const tr = w / h;
    let dw, dh;
    if (ir > tr) {
      dh = h;
      dw = h * ir;
    } else {
      dw = w;
      dh = w / ir;
    }
    dw *= zoom;
    dh *= zoom;
    const maxX = Math.max(0, (dw - w) / 2);
    const maxY = Math.max(0, (dh - h) / 2);
    const sx = x + (w - dw) / 2 + ox * maxX;
    const sy = y + (h - dh) / 2 + oy * maxY;
    c.drawImage(img, sx, sy, dw, dh);
    c.restore();
  }

  function drawCoverCircle(c, img, cx, cy, radius, crop) {
    const x = cx - radius;
    const y = cy - radius;
    const d = radius * 2;
    c.save();
    c.beginPath();
    c.arc(cx, cy, radius, 0, Math.PI * 2);
    c.clip();
    drawCover(c, img, x, y, d, d, 0, crop);
    c.restore();
  }

  /* ——— layout engines ——— */
  function colCountFor(n) {
    if (state.cols !== "auto") {
      const c = parseInt(state.cols, 10);
      if (c >= 4 && c <= 7) return Math.min(c, Math.max(1, n));
    }
    return n <= 4 ? 2 : n <= 9 ? 3 : n <= 16 ? 4 : 5;
  }

  function layoutGridEqual(photos, W, H, g, cols) {
    const n = photos.length || 1;
    const c = cols || colCountFor(n);
    const rows = Math.max(1, Math.ceil(n / c));
    const cw = (W - g * (c - 1)) / c;
    const ch = (H - g * (rows - 1)) / rows;
    return photos.map((_, i) => ({
      x: (i % c) * (cw + g),
      y: Math.floor(i / c) * (ch + g),
      w: cw,
      h: ch,
    }));
  }

  function layoutMosaic(photos, W, H, g) {
    const n = photos.length;
    if (n === 0) return [];
    if (n === 1) return [{ x: 0, y: 0, w: W, h: H }];
    if (n === 2) {
      return [
        { x: 0, y: 0, w: W * 0.58 - g / 2, h: H },
        { x: W * 0.58 + g / 2, y: 0, w: W * 0.42 - g / 2, h: H },
      ];
    }
    if (n === 3) {
      const left = W * 0.52 - g / 2;
      const right = W - left - g;
      const rh = (H - g) / 2;
      return [
        { x: 0, y: 0, w: left, h: H },
        { x: left + g, y: 0, w: right, h: rh },
        { x: left + g, y: rh + g, w: right, h: rh },
      ];
    }
    const cols = n <= 6 ? 2 : 3;
    const weights = photos.map((_, i) => (i === 0 ? 2.2 : i % 3 === 0 ? 1.25 : 1));
    const colItems = Array.from({ length: cols }, () => []);
    photos.forEach((_, i) => colItems[i % cols].push(i));
    const colW = (W - g * (cols - 1)) / cols;
    const result = new Array(n);
    for (let c = 0; c < cols; c++) {
      const items = colItems[c];
      if (!items.length) continue;
      const totalW = items.reduce((s, i) => s + weights[i], 0);
      const avail = H - g * (items.length - 1);
      let y = 0;
      for (const i of items) {
        const h = avail * (weights[i] / totalW);
        result[i] = { x: c * (colW + g), y, w: colW, h };
        y += h + g;
      }
    }
    return result;
  }

  function layoutEditorial(photos, W, H, g) {
    const n = photos.length;
    if (n === 0) return [];
    if (n === 1) return [{ x: 0, y: 0, w: W, h: H }];
    const slots = [{ x: 0, y: 0, w: W * 0.52 - g / 2, h: H }];
    const rest = n - 1;
    const cols = rest <= 2 ? 1 : 2;
    const rows = Math.ceil(rest / cols);
    const areaX = W * 0.52 + g / 2;
    const areaW = W * 0.48 - g / 2;
    const cw = (areaW - g * (cols - 1)) / cols;
    const ch = (H - g * (rows - 1)) / rows;
    for (let i = 0; i < rest; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      slots.push({ x: areaX + c * (cw + g), y: r * (ch + g), w: cw, h: ch });
    }
    return slots;
  }

  function layoutDiagonal(photos, W, H, g) {
    const n = Math.min(photos.length, 6);
    if (n === 0) return [];
    if (n === 1) return [{ x: 0, y: 0, w: W, h: H }];
    // slanted bands from top-left to bottom-right
    const slots = [];
    const step = 1 / n;
    for (let i = 0; i < n; i++) {
      slots.push({
        x: 0,
        y: 0,
        w: W,
        h: H,
        poly: [
          [i * step * W, 0],
          [(i + 1) * step * W + g * 0.2, 0],
          [(i + 1) * step * W - H + g * 0.2, H],
          [i * step * W - H, H],
        ],
      });
    }
    // better: classic half diagonal splits for 2-3
    if (n === 2) {
      return [
        { x: 0, y: 0, w: W, h: H, poly: [[0, 0], [W, 0], [0, H]] },
        { x: 0, y: 0, w: W, h: H, poly: [[W, 0], [W, H], [0, H]] },
      ];
    }
    if (n === 3) {
      return [
        { x: 0, y: 0, w: W, h: H, poly: [[0, 0], [W, 0], [W * 0.45, H], [0, H]] },
        { x: 0, y: 0, w: W, h: H, poly: [[W, 0], [W, H * 0.55], [W * 0.35, 0]] },
        { x: 0, y: 0, w: W, h: H, poly: [[W * 0.45, H], [W, H * 0.55], [W, H], [W * 0.2, H]] },
      ];
    }
    // n>=4: diagonal bands
    const band = [];
    for (let i = 0; i < n; i++) {
      const x0 = (i / n) * (W + H) - H;
      const x1 = ((i + 1) / n) * (W + H) - H;
      band.push({
        x: 0,
        y: 0,
        w: W,
        h: H,
        poly: [
          [Math.max(0, x0), 0],
          [Math.min(W, x1), 0],
          [Math.min(W, x1 - H) + (x1 - H > W ? W - (x1 - H) : 0), H],
          [Math.max(0, x0 - H), H],
        ],
      });
      // simpler reliable bands:
      band[i].poly = [
        [x0 + H, 0],
        [x1 + H, 0],
        [x1, H],
        [x0, H],
      ].map(([x, y]) => [x, y]);
    }
    return band;
  }

  function layoutStrip4(photos, W, H, g) {
    const n = photos.length;
    const rows = Math.min(Math.max(n, 1), 4);
    const ch = (H - g * (rows - 1)) / rows;
    return photos.slice(0, 4).map((_, i) => ({
      x: 0,
      y: i * (ch + g),
      w: W,
      h: ch,
      film: true,
    }));
  }

  function layoutVLine(photos, W, H, g) {
    return layoutGridEqual(photos, W, H, g, Math.max(photos.length, 1));
  }

  function layoutHLine(photos, W, H, g) {
    const n = Math.max(1, photos.length);
    const ch = (H - g * (n - 1)) / n;
    return photos.map((_, i) => ({ x: 0, y: i * (ch + g), w: W, h: ch }));
  }

  function hashRand(i, seed) {
    const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function layoutPolaroid(photos, W, H) {
    const n = photos.length;
    if (n === 0) return [];
    const base = Math.min(W, H);
    const size = n <= 2 ? base * 0.55 : n <= 4 ? base * 0.42 : base * 0.32;
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    const padX = (W - cols * size) / (cols + 1);
    const padY = (H - rows * size) / (rows + 1);
    return photos.map((_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const jx = (hashRand(i, 1) - 0.5) * size * 0.22;
      const jy = (hashRand(i, 2) - 0.5) * size * 0.22;
      return {
        x: padX + col * (size + padX) + jx,
        y: padY + row * (size + padY) + jy,
        w: size,
        h: size,
        rot: (hashRand(i, 3) - 0.5) * 0.28,
        polaroid: true,
      };
    });
  }

  function layoutScrapbook(photos, W, H) {
    const n = photos.length;
    if (n === 0) return [];
    const base = Math.min(W, H);
    const size = n <= 2 ? base * 0.58 : base * 0.42;
    return photos.map((_, i) => {
      const fx = 0.08 + (i % 3) * 0.28 + (hashRand(i, 7) - 0.5) * 0.08;
      const fy = 0.08 + Math.floor(i / 3) * 0.22 + (hashRand(i, 8) - 0.5) * 0.06;
      return {
        x: Math.max(0, Math.min(W - size, fx * W)),
        y: Math.max(0, Math.min(H - size, fy * H)),
        w: size,
        h: size * (0.85 + hashRand(i, 9) * 0.2),
        rot: (hashRand(i, 10) - 0.5) * 0.35,
        polaroid: true,
        scrap: true,
      };
    });
  }

  function layoutCircle(photos, W, H) {
    const n = photos.length;
    if (n === 0) return [];
    if (n === 1) {
      const r = Math.min(W, H) * 0.36;
      return [{ x: W / 2, y: H / 2, w: r, h: r, clip: "circle", cx: W / 2, cy: H / 2, radius: r }];
    }
    const R = Math.min(W, H) * 0.3;
    const size = Math.min(W, H) * (n <= 3 ? 0.34 : n <= 5 ? 0.28 : 0.22);
    const radius = size / 2;
    return photos.map((_, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const cx = W / 2 + Math.cos(a) * R;
      const cy = H / 2 + Math.sin(a) * R;
      return { x: cx - radius, y: cy - radius, w: size, h: size, clip: "circle", cx, cy, radius };
    });
  }

  function layoutYtShort(photos, W, H) {
    // 竖屏短视频：主画面全幅，动作栏叠加在右侧，不再另放侧栏缩略图
    if (!photos.length) return [];
    return [{ x: 0, y: 0, w: W, h: H, fullBleed: true, role: "main" }];
  }

  function layoutYtPanel(photos, W, H, g) {
    if (!photos.length) return [];
    const mainH = H * 0.58;
    const panelY = mainH + g;
    const panelH = H - panelY;
    const slots = [{ x: 0, y: 0, w: W, h: mainH, fullBleed: true, role: "main" }];
    const rest = photos.slice(1);
    if (!rest.length) return slots;
    const n = Math.min(rest.length, 4);
    const tw = (W - g * (n - 1)) / n;
    const th = panelH * 0.55;
    for (let i = 0; i < n; i++) {
      slots.push({ x: i * (tw + g), y: panelY + panelH * 0.08, w: tw, h: th, role: "thumb" });
    }
    return slots;
  }

  function layoutPlayer(photos, W, H) {
    if (!photos.length) return [];
    return [{ x: 0, y: 0, w: W, h: H, fullBleed: true, role: "art" }];
  }

  function layoutType(photos, W, H) {
    if (!photos.length) return [];
    return [{ x: 0, y: 0, w: W, h: H, fullBleed: true }];
  }

  function computeSlots(photos, W, H, g) {
    switch (state.layout) {
      case "mosaic":
        return layoutMosaic(photos, W, H, g);
      case "contact":
      case "grid":
      case "sns":
        return layoutGridEqual(photos, W, H, g);
      case "ig-post":
        return layoutIgPost(photos, W, H);
      case "editorial":
        return layoutEditorial(photos, W, H, g);
      case "split":
        return layoutGridEqual(photos, W, H, g);
      case "diagonal":
        return layoutDiagonal(photos, W, H, g);
      case "strip4":
        return layoutStrip4(photos, W, H, g);
      case "vline":
        return layoutVLine(photos, W, H, g);
      case "hline":
        return layoutHLine(photos, W, H, g);
      case "polaroid":
        return layoutPolaroid(photos, W, H);
      case "scrapbook":
        return layoutScrapbook(photos, W, H);
      case "circle":
        return layoutCircle(photos, W, H);
      case "yt-short":
        return layoutYtShort(photos, W, H);
      case "yt-panel":
        return layoutYtPanel(photos, W, H, g);
      case "player":
        return layoutPlayer(photos, W, H);
      case "type":
        return layoutType(photos, W, H);
      default:
        return layoutMosaic(photos, W, H, g);
    }
  }

  /* ——— texture / light / bg ——— */
  let grainCanvas = null;
  let paperCanvas = null;

  function ensureTextures() {
    if (!grainCanvas) {
      grainCanvas = document.createElement("canvas");
      grainCanvas.width = 128;
      grainCanvas.height = 128;
      const g = grainCanvas.getContext("2d");
      const imgData = g.createImageData(128, 128);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const v = 128 + ((Math.random() - 0.5) * 70) | 0;
        imgData.data[i] = v;
        imgData.data[i + 1] = v;
        imgData.data[i + 2] = v;
        imgData.data[i + 3] = 36;
      }
      g.putImageData(imgData, 0, 0);
    }
    if (!paperCanvas) {
      paperCanvas = document.createElement("canvas");
      paperCanvas.width = 128;
      paperCanvas.height = 128;
      const p = paperCanvas.getContext("2d");
      p.fillStyle = "rgba(180,160,120,0.04)";
      p.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 180; i++) {
        p.fillStyle = Math.random() > 0.5 ? "rgba(120,100,60,0.05)" : "rgba(255,250,230,0.04)";
        p.fillRect(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 2, 1 + Math.random() * 3);
      }
    }
  }

  function applyTexture(c, W, H) {
    ensureTextures();
    const mode = state.grain;
    if (mode === "none") return;
    if (lightDrag || state.photos.length > 18) {
      // lighter path during drag / large albums
      if (mode !== "paper") {
        c.save();
        c.globalAlpha = 0.35;
        c.globalCompositeOperation = "overlay";
        const pat = c.createPattern(grainCanvas, "repeat");
        if (pat) {
          c.fillStyle = pat;
          c.fillRect(0, 0, W, H);
        }
        c.restore();
      }
      return;
    }
    c.save();
    c.globalCompositeOperation = "overlay";
    if (mode === "paper" || mode === "both") {
      const pat = c.createPattern(paperCanvas, "repeat");
      if (pat) {
        c.fillStyle = pat;
        c.fillRect(0, 0, W, H);
      }
    }
    if (mode === "grain" || mode === "both") {
      c.globalAlpha = mode === "both" ? 0.55 : 0.85;
      const pat = c.createPattern(grainCanvas, "repeat");
      if (pat) {
        c.fillStyle = pat;
        c.fillRect(0, 0, W, H);
      }
    }
    c.restore();
  }

  function applyLight(c, W, H, th) {
    const mode = state.light;
    const s = state.lightStrength;
    const lightCol = state.lightColor || "#fff5e0";
    if (mode === "none" || s <= 0) return;
    c.save();
    if (mode === "diag-l" || mode === "diag-r") {
      const grd = c.createLinearGradient(mode === "diag-l" ? 0 : W, 0, mode === "diag-l" ? W : 0, H);
      grd.addColorStop(0, hexToRgba(lightCol, 0.22 * s));
      grd.addColorStop(0.45, "rgba(255,255,255,0)");
      grd.addColorStop(1, `rgba(0,0,0,${0.25 * s})`);
      c.fillStyle = grd;
      c.fillRect(0, 0, W, H);
    } else if (mode === "spot") {
      const grd = c.createRadialGradient(W / 2, H * 0.42, Math.min(W, H) * 0.1, W / 2, H * 0.5, Math.min(W, H) * 0.7);
      grd.addColorStop(0, hexToRgba(lightCol, 0.2 * s));
      grd.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = grd;
      c.fillRect(0, 0, W, H);
    } else if (mode === "vignette") {
      const grd = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.min(W, H) * 0.72);
      grd.addColorStop(0, "rgba(0,0,0,0)");
      grd.addColorStop(1, `rgba(0,0,0,${0.45 * s})`);
      c.fillStyle = grd;
      c.fillRect(0, 0, W, H);
    }
    void th;
    c.restore();
  }

  function drawBackground(c, W, H, photos, th) {
    c.fillStyle = th.bg;
    c.fillRect(0, 0, W, H);

    const mode = state.bgMode;
    if ((mode === "ghost" || mode === "jacket") && photos[0]?.img) {
      const img = photos[0].img;
      if (mode === "ghost") {
        c.save();
        c.globalAlpha = state.ghost;
        drawCover(c, img, 0, 0, W, H, 0, photos[0].crop);
        c.restore();
        c.fillStyle = `rgba(${hexRgb(th.bg)},${0.35})`;
        c.fillRect(0, 0, W, H);
      } else if (mode === "jacket") {
        // frosted full-bleed blur-ish
        c.save();
        c.globalAlpha = 0.45;
        drawCover(c, img, -W * 0.05, -H * 0.05, W * 1.1, H * 1.1, 0);
        c.restore();
        c.fillStyle = `rgba(${hexRgb(th.bg)},0.55)`;
        c.fillRect(0, 0, W, H);
        // soft vignette bands
        const grd = c.createLinearGradient(0, 0, 0, H);
        grd.addColorStop(0, `rgba(0,0,0,0.18)`);
        grd.addColorStop(0.5, "rgba(0,0,0,0)");
        grd.addColorStop(1, `rgba(0,0,0,0.22)`);
        c.fillStyle = grd;
        c.fillRect(0, 0, W, H);
      }
    }

    if (mode === "glass") {
      const pad = Math.min(W, H) * 0.06;
      c.fillStyle = "rgba(255,255,255,0.08)";
      roundedPath(c, pad, pad, W - pad * 2, H - pad * 2, 24);
      c.fill();
      c.strokeStyle = "rgba(255,255,255,0.14)";
      c.lineWidth = 2;
      c.stroke();
    }
  }

  function hexRgb(hex) {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16);
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  }

  /* ——— text / UI chrome ——— */
  function fontStack(key) {
    return (FONTS[key] || FONTS.gothic).display;
  }

  function fontWeight(key) {
    return (FONTS[key] || FONTS.gothic).weight;
  }

  function layoutChromeOwnsTitle() {
    return state.layout === "yt-short" || state.layout === "yt-panel" || state.layout === "player";
  }

  function drawText(c, W, H, th) {
    const base = Math.min(W, H);
    const title = state.title.trim();
    const subtitle = state.subtitle.trim();
    const footer = state.footer.trim();
    const subfooter = state.subfooter.trim();
    const style = state.textStyle;
    const ff = fontStack(state.font);
    const fw = fontWeight(state.font);
    const fs = fontStack(state.fontSub);
    const fsw = fontWeight(state.fontSub);
    // YT / 播放器布局自带标题 UI，避免同一标题再画一遍造成重影
    const chromeTitle = layoutChromeOwnsTitle() && state.layout !== "player";
    const playerChrome = state.layout === "player";

    if (!chromeTitle && !playerChrome) {
      if (style === "center-type" || state.layout === "type") {
        drawCenterType(c, W, H, th);
      } else if (style === "bottom-bar") {
        drawBottomBar(c, W, H, th, title, footer, ff, fw);
      } else if (style === "edition") {
        drawEdition(c, W, H, th, title, footer, subtitle, ff, fw);
      } else if (title) {
        const size = Math.round(base * 0.055);
        c.save();
        c.font = `${fw} ${size}px ${ff}`;
        c.fillStyle = th.ink;
        c.textBaseline = "top";
        if (state.glow) {
          c.shadowColor = th.accent;
          c.shadowBlur = size * 0.45;
        } else {
          c.shadowColor = "rgba(0,0,0,0.45)";
          c.shadowBlur = size * 0.25;
        }
        const pad = Math.round(base * 0.045);
        title.split("\n").slice(0, 3).forEach((line, i) => {
          c.fillText(line, pad, pad + i * size * 1.2);
        });
        c.restore();
      }

      if (style !== "bottom-bar" && style !== "edition" && subtitle && style !== "center-type" && state.layout !== "type") {
        const size = Math.round(base * 0.028);
        c.save();
        c.font = `${fsw} ${size}px ${fs}`;
        c.fillStyle = th.accent;
        c.textAlign = "right";
        c.textBaseline = "top";
        const pad = Math.round(base * 0.045);
        subtitle.split("\n").slice(0, 2).forEach((line, i) => {
          c.fillText(line, W - pad, pad + i * size * 1.25);
        });
        c.restore();
      }
    }

    // 页脚：普通版式画底部；YT 布局把副页脚/水印放到更底，避免和控件叠标题
    if (style === "head-footer" || style === "center-type" || chromeTitle) {
      if (footer || subfooter || state.credit) {
        const size = Math.round(base * (chromeTitle ? 0.022 : 0.028));
        c.save();
        c.font = `400 ${size}px ${fs}`;
        c.fillStyle = th.sub;
        c.textAlign = "center";
        c.textBaseline = "bottom";
        const pad = Math.round(base * (chromeTitle ? 0.02 : 0.04));
        const small = [];
        // YT 布局不重复画大标题页脚，只保留副信息
        const mainLine = chromeTitle ? "" : footer;
        if (subfooter) small.push(subfooter);
        if (state.credit) small.push("光房拼贴");
        if (chromeTitle && footer && footer !== title) small.unshift(footer);
        if (mainLine) c.fillText(mainLine, W / 2, H - pad);
        if (small.length) {
          c.font = `400 ${Math.round(base * (chromeTitle ? 0.018 : 0.022))}px ${fs}`;
          c.fillText(small.join("  ·  "), W / 2, H - pad + Math.round(base * (chromeTitle ? 0.02 : 0.028)));
        }
        c.restore();
      }
    }

    // 播放器布局不绘制页脚水印
    if (state.layout === "player") {
      // chrome 自绘信息
    }

    if (state.layout === "yt-short") drawYtShortUi(c, W, H, th, fs, fsw);
    if (state.layout === "yt-panel") drawYtPanelUi(c, W, H, th, fs, fsw);
    // 播放器布局自己画全套 UI；短视频/面板布局的音量条已内联，避免叠成双轨进度条
    if (state.layout === "player") drawPlayerChrome(c, W, H, th, fs, fsw);
    else if (state.volumeBar && state.layout !== "yt-short" && state.layout !== "yt-panel") {
      drawPlayerChrome(c, W, H, th, fs, fsw);
    }
  }

  function drawCenterType(c, W, H, th) {
    const base = Math.min(W, H);
    const text = state.title.trim() || "COLLAGE";
    const size = Math.round(base * (state.layout === "type" ? 0.14 : 0.1));
    c.save();
    if (state.layout === "type") {
      const grd = c.createLinearGradient(0, 0, 0, H);
      grd.addColorStop(0, "rgba(0,0,0,0.35)");
      grd.addColorStop(0.5, "rgba(0,0,0,0.15)");
      grd.addColorStop(1, "rgba(0,0,0,0.45)");
      c.fillStyle = grd;
      c.fillRect(0, 0, W, H);
    }
    c.font = `${fontWeight(state.font)} ${size}px ${fontStack(state.font)}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.lineWidth = Math.max(2, size * 0.04);
    c.strokeStyle = "rgba(0,0,0,0.35)";
    c.fillStyle = th.ink;
    if (state.glow) {
      c.shadowColor = th.accent;
      c.shadowBlur = size * 0.35;
    }
    const lines = text.split("\n").slice(0, 3);
    const startY = H / 2 - ((lines.length - 1) * size * 0.55) / 2;
    lines.forEach((line, i) => {
      const y = startY + i * size * 0.55;
      c.strokeText(line, W / 2, y);
      c.fillText(line, W / 2, y);
    });
    if (state.footer.trim()) {
      c.shadowBlur = 0;
      c.font = `400 ${Math.round(base * 0.03)}px ${fontStack(state.fontSub)}`;
      c.fillStyle = th.accent;
      c.fillText(state.footer.trim(), W / 2, H - base * 0.08);
    }
    c.restore();
  }

  function drawBottomBar(c, W, H, th, title, footer, ff, fw) {
    const base = Math.min(W, H);
    const barH = Math.round(base * 0.14);
    c.save();
    c.fillStyle = th.card;
    c.globalAlpha = 0.92;
    c.fillRect(0, H - barH, W, barH);
    c.globalAlpha = 1;
    c.fillStyle = th.accent;
    c.fillRect(0, H - barH, W, 3);
    const pad = Math.round(base * 0.04);
    if (title) {
      c.font = `${fw} ${Math.round(base * 0.045)}px ${ff}`;
      c.fillStyle = th.ink;
      c.textAlign = "left";
      c.textBaseline = "middle";
      c.fillText(title.split("\n")[0], pad, H - barH * 0.45);
    }
    if (footer || state.credit) {
      c.font = `400 ${Math.round(base * 0.024)}px ${fontStack(state.fontSub)}`;
      c.fillStyle = th.sub;
      c.textAlign = "right";
      const extra = state.credit ? " · 光房拼贴" : "";
      c.fillText((footer || "") + extra, W - pad, H - barH * 0.42);
    }
    c.restore();
  }

  function drawEdition(c, W, H, th, title, footer, subtitle, ff, fw) {
    const base = Math.min(W, H);
    const h = Math.round(base * 0.12);
    c.save();
    c.fillStyle = "rgba(0,0,0,0.35)";
    c.fillRect(0, H - h, W, h);
    c.strokeStyle = th.ink;
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(0, H - h);
    c.lineTo(W, H - h);
    c.stroke();
    const cols = 3;
    for (let i = 1; i < cols; i++) {
      c.beginPath();
      c.moveTo((W / cols) * i, H - h);
      c.lineTo((W / cols) * i, H);
      c.stroke();
    }
    const cellW = W / cols;
    const items = [
      title || "CONTACT SHEET",
      subtitle || `${state.photos.length} FRAMES`,
      footer || `${formatDateShort()}${state.credit ? " · 光房拼贴" : ""}`,
    ];
    items.forEach((txt, i) => {
      c.fillStyle = i === 0 ? th.ink : th.accent;
      c.font = `${i === 0 ? fw : "400"} ${Math.round(base * (i === 0 ? 0.032 : 0.024))}px ${ff}`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(String(txt).split("\n")[0], cellW * i + cellW / 2, H - h / 2);
    });
    c.restore();
  }

  function roundRectFill(c, x, y, w, h, r, fill, stroke) {
    roundedPath(c, x, y, w, h, r);
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.stroke();
    }
  }

  /* ——— icon assets: 优先 icon/ 目录 Lucide SVG，其次内置数据，再次用户上传 ——— */
  const LOCAL_ICON_PATH = {
    shuffle: "icon/shuffle.svg",
    prev: "icon/skip-back.svg",
    next: "icon/skip-forward.svg",
    // repeat.svg 已被改为「播放」内容，循环钮使用内嵌 lucide-repeat
    heart: "icon/heart.svg",
    waypoints: "icon/waypoints.svg",
    queue: "icon/list-chevrons-up-down.svg",
    // 用户标注：1=repeat.svg → 播放；2=play.svg → 暂停
    play: "icon/repeat.svg",
    pause: "icon/play.svg",
    send: "icon/send.svg",
  };

  // 与 D:\program\photo cut\icon\*.svg 内容一致（Lucide 24×24 stroke）
  const BUILTIN_ICON_SVG = {
    shuffle:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 14 4 4-4 4"/><path d="m18 2 4 4-4 4"/><path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22"/><path d="M2 6h1.972a4 4 0 0 1 3.6 2.2"/><path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45"/></svg>',
    prev: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.971 4.285A2 2 0 0 1 21 6v12a2 2 0 0 1-3.029 1.715l-9.997-5.998a2 2 0 0 1-.003-3.432z"/><path d="M3 20V4"/></svg>',
    next: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4v16"/><path d="M6.029 4.285A2 2 0 0 0 3 6v12a2 2 0 0 0 3.029 1.715l9.997-5.998a2 2 0 0 0 .003-3.432z"/></svg>',
    repeat:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>',
    heart:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>',
    heartFilled:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#ffffff" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>',
    waypoints:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.586 5.414-5.172 5.172"/><path d="m18.586 13.414-5.172 5.172"/><path d="M6 12h12"/><circle cx="12" cy="20" r="2"/><circle cx="12" cy="4" r="2"/><circle cx="20" cy="12" r="2"/><circle cx="4" cy="12" r="2"/></svg>',
    queue:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h8"/><path d="M3 12h8"/><path d="M3 19h8"/><path d="m15 8 3-3 3 3"/><path d="m15 16 3 3 3-3"/></svg>',
    send:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg>',
    // 播放/暂停：与 icon/repeat.svg（播放）· icon/play.svg（暂停）一致
    play: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="#ffffff" stroke="none" d="M8 5v14l11-7L8 5z"/></svg>',
    pause:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path fill="#ffffff" stroke="none" d="M6 5h4v14H6V5zm8 0h4v14h-4V5z"/></svg>',
    message:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
    share:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>',
    repost:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
    bookmark:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
  };

  /**
   * 关键：绝不用 file:// URL 直接 drawImage（会污染 Canvas，toBlob 导出失败）。
   * 仅使用 data: URL（用户上传 / 本地 SVG 转码 / 内嵌兜底）。
   */
  const iconBitmaps = Object.create(null); // dataURL -> Image | 'pending' | null
  const localSvgDataUrl = Object.create(null); // name -> dataURL（从 icon/*.svg 读入）

  function svgToDataUrl(svg) {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function customIconSrc(name) {
    return (state.customIcons && state.customIcons[name]) || null;
  }

  function builtinIconSrc(name) {
    if (name === "heart" && state.ui?.liked) {
      return svgToDataUrl(BUILTIN_ICON_SVG.heartFilled || BUILTIN_ICON_SVG.heart);
    }
    const svg = BUILTIN_ICON_SVG[name];
    return svg ? svgToDataUrl(svg) : null;
  }

  function safeIconSrc(name) {
    const custom = customIconSrc(name);
    if (custom && String(custom).startsWith("data:")) return custom;
    const local = localSvgDataUrl[name];
    if (local && String(local).startsWith("data:")) {
      if (name === "heart" && state.ui?.liked) return builtinIconSrc("heart");
      return local;
    }
    return builtinIconSrc(name);
  }

  function loadIconSrc(src) {
    if (!src || !String(src).startsWith("data:")) return null;
    const cached = iconBitmaps[src];
    if (cached === "pending") return null;
    if (cached === null) return null;
    if (cached) return cached;
    iconBitmaps[src] = "pending";
    const img = new Image();
    img.onload = () => {
      iconBitmaps[src] = img;
      renderSoon();
    };
    img.onerror = () => {
      iconBitmaps[src] = null;
      renderSoon();
    };
    img.src = src;
    return null;
  }

  function getIconImage(name) {
    if (name === "heart" && state.ui && state.ui.liked) {
      return loadIconSrc(builtinIconSrc("heart"));
    }
    return loadIconSrc(safeIconSrc(name));
  }

  function drawIconBitmap(c, img, cx, cy, size, color) {
    const px = Math.max(24, Math.ceil(size * 2));
    const off = document.createElement("canvas");
    off.width = px;
    off.height = px;
    const o = off.getContext("2d");
    o.drawImage(img, 0, 0, px, px);
    if (color) {
      o.globalCompositeOperation = "source-in";
      o.fillStyle = color;
      o.fillRect(0, 0, px, px);
    }
    c.drawImage(off, cx - size / 2, cy - size / 2, size, size);
  }

  function drawIconByName(c, name, cx, cy, size, color) {
    const img = getIconImage(name);
    if (!img) return false;
    try {
      drawIconBitmap(c, img, cx, cy, size, color);
      return true;
    } catch (e) {
      console.warn("drawIconByName failed", name, e);
      return false;
    }
  }

  /** 将 icon/*.svg 读成 data:URL，避免 file:// 污染导出画布 */
  async function hydrateLocalIcons() {
    const names = Object.keys(LOCAL_ICON_PATH);
    await Promise.all(
      names.map(async (name) => {
        const rel = LOCAL_ICON_PATH[name];
        try {
          const url = new URL(rel, document.baseURI).href;
          const res = await fetch(url);
          if (!res.ok) return;
          let svg = await res.text();
          if (!svg || svg.indexOf("<svg") === -1) return;
          // 统一白色描边/填充，便于重染
          svg = svg.replace(/stroke="(?!none)[^"]*"/gi, 'stroke="#ffffff"');
          localSvgDataUrl[name] = svgToDataUrl(svg);
          loadIconSrc(localSvgDataUrl[name]);
        } catch {
          /* file:// 下 fetch 可能失败 → 使用内嵌 SVG */
        }
      })
    );
    // 内嵌兜底也预热
    Object.keys(BUILTIN_ICON_SVG).forEach((name) => loadIconSrc(builtinIconSrc(name)));
    renderSoon();
  }

  function preloadBuiltinIcons() {
    hydrateLocalIcons();
  }

  function drawTwitterHeart(c, cx, cy, s, fill, filled) {
    c.save();
    c.fillStyle = fill;
    c.strokeStyle = fill;
    c.lineWidth = Math.max(1.4, s * 0.1);
    const x = cx;
    const y = cy - s * 0.42;
    c.beginPath();
    c.moveTo(x, y + s * 0.38);
    c.bezierCurveTo(x - s * 0.05, y + s * 0.2, x - s * 0.42, y + s * 0.02, x - s * 0.42, y + s * 0.24);
    c.bezierCurveTo(x - s * 0.42, y + s * 0.52, x - s * 0.08, y + s * 0.68, x, y + s * 0.88);
    c.bezierCurveTo(x + s * 0.08, y + s * 0.68, x + s * 0.42, y + s * 0.52, x + s * 0.42, y + s * 0.24);
    c.bezierCurveTo(x + s * 0.42, y + s * 0.02, x + s * 0.05, y + s * 0.2, x, y + s * 0.38);
    c.closePath();
    if (filled) c.fill();
    else c.stroke();
    c.restore();
  }

  function drawTwitterReply(c, cx, cy, s, fill, active) {
    const w = s * 0.82;
    const h = s * 0.62;
    const x = cx - w / 2;
    const y = cy - h / 2 - s * 0.02;
    c.save();
    c.lineWidth = Math.max(1.5, s * 0.1);
    c.strokeStyle = fill;
    c.fillStyle = fill;
    const r = s * 0.14;
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + w * 0.45, y + h);
    c.lineTo(x + w * 0.3, y + h + s * 0.2);
    c.lineTo(x + w * 0.3, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
    if (active) c.fill();
    else c.stroke();
    c.restore();
  }

  function drawTwitterRetweet(c, cx, cy, s, fill, active) {
    c.save();
    c.strokeStyle = fill;
    c.fillStyle = fill;
    c.lineWidth = Math.max(1.5, s * 0.1);
    c.lineCap = "round";
    c.lineJoin = "round";
    const arm = s * 0.3;
    c.beginPath();
    c.moveTo(cx - arm, cy - s * 0.16);
    c.lineTo(cx + arm * 0.5, cy - s * 0.16);
    c.stroke();
    c.beginPath();
    c.moveTo(cx + arm * 0.55, cy - s * 0.16);
    c.lineTo(cx + arm * 0.28, cy - s * 0.3);
    c.lineTo(cx + arm * 0.28, cy - s * 0.02);
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(cx + arm, cy + s * 0.16);
    c.lineTo(cx - arm * 0.5, cy + s * 0.16);
    c.stroke();
    c.beginPath();
    c.moveTo(cx - arm * 0.55, cy + s * 0.16);
    c.lineTo(cx - arm * 0.28, cy + s * 0.3);
    c.lineTo(cx - arm * 0.28, cy + s * 0.02);
    c.closePath();
    c.fill();
    void active;
    c.restore();
  }

  function drawTwitterShare(c, cx, cy, s, fill) {
    c.save();
    c.strokeStyle = fill;
    c.fillStyle = fill;
    c.lineWidth = Math.max(1.5, s * 0.1);
    c.lineCap = "round";
    c.lineJoin = "round";
    const w = s * 0.5;
    const h = s * 0.36;
    const x = cx - w / 2;
    const y = cy - h / 2 + s * 0.1;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + w * 0.5, y);
    c.moveTo(x + w, y + s * 0.06);
    c.lineTo(x + w, y + h);
    c.lineTo(x, y + h);
    c.stroke();
    c.beginPath();
    c.moveTo(cx + w * 0.3, y - s * 0.02);
    c.lineTo(cx + w * 0.3, y - s * 0.42);
    c.stroke();
    c.beginPath();
    c.moveTo(cx + w * 0.3, y - s * 0.48);
    c.lineTo(cx + w * 0.3 - s * 0.12, y - s * 0.26);
    c.lineTo(cx + w * 0.3 + s * 0.12, y - s * 0.26);
    c.closePath();
    c.fill();
    c.restore();
  }

  function iconRailPalette(th) {
    const theme = state.ui.iconTheme || "twitter";
    const liked = !!state.ui.liked;
    const showCounts = state.ui.showCounts !== false;
    let base = "#fff";
    let likeOn = "#ff4d6d";
    let likeOff = "#fff";
    let accent = "#1d9bf0";
    if (theme === "mono") {
      base = "#fff";
      likeOn = "#fff";
      likeOff = "#fff";
      accent = "#fff";
    } else if (theme === "blue") {
      base = "#fff";
      likeOn = "#1d9bf0";
      likeOff = "#71767b";
      accent = "#1d9bf0";
    } else if (theme === "pink") {
      base = "#fff";
      likeOn = "#ff4d6d";
      likeOff = "#ff8fa3";
      accent = "#ff4d6d";
    } else if (theme === "accent") {
      base = th.ink;
      likeOn = th.accent;
      likeOff = th.sub;
      accent = th.accent;
    }
    return {
      showCounts,
      base,
      accent,
      likeColor: liked ? likeOn : likeOff,
      likeFilled: liked && theme !== "mono",
      replyColor: theme === "accent" ? th.sub : base,
      repostColor: theme === "blue" ? accent : theme === "accent" ? th.accent : base,
    };
  }

  function drawYtShortUi(c, W, H, th, fs) {
    const base = Math.min(W, H);
    c.save();

    const g1 = c.createLinearGradient(0, 0, 0, H * 0.2);
    g1.addColorStop(0, "rgba(0,0,0,0.55)");
    g1.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g1;
    c.fillRect(0, 0, W, H * 0.2);

    const g2 = c.createLinearGradient(0, H * 0.58, 0, H);
    g2.addColorStop(0, "rgba(0,0,0,0)");
    g2.addColorStop(1, "rgba(0,0,0,0.72)");
    c.fillStyle = g2;
    c.fillRect(0, H * 0.58, W, H * 0.42);

    const title = state.title.trim() || "短视频";
    c.fillStyle = "#fff";
    c.font = `700 ${Math.round(base * 0.045)}px ${fs}`;
    c.textAlign = "left";
    c.textBaseline = "top";
    if (state.glow) {
      c.save();
      c.shadowColor = th.accent;
      c.shadowBlur = Math.round(base * 0.03);
      c.fillText(title.split("\n")[0], W * 0.05, H * 0.05);
      c.restore();
    }
    c.fillText(title.split("\n")[0], W * 0.05, H * 0.05);

    if (state.ui.live) {
      const lw = Math.round(base * 0.09);
      roundRectFill(c, W * 0.05, H * 0.115, lw, Math.round(base * 0.038), 4, "#e11");
      c.fillStyle = "#fff";
      c.font = `700 ${Math.round(base * 0.02)}px ${fs}`;
      c.textAlign = "left";
      c.textBaseline = "middle";
      c.fillText("● LIVE", W * 0.05 + 6, H * 0.115 + Math.round(base * 0.019));
    }

    // —— 右侧推特风动作栏（图标居中，数字在图标正下方，间距足够避免重叠）——
    const iconS = Math.round(base * 0.05);
    const ax = W * 0.88;
    const railGap = Math.round(base * 0.17);
    const railTop = H * 0.44;
    const pal = iconRailPalette(th);

    const railW = Math.round(base * 0.16);
    const itemCount = 4;
    const railH = railGap * (itemCount - 1) + Math.round(base * 0.12);
    roundRectFill(
      c,
      ax - railW / 2,
      railTop - iconS * 0.75,
      railW,
      railH,
      railW / 2,
      "rgba(0,0,0,0.32)"
    );

    const drawRailItem = (index, iconName, fallbackDraw, countText, color, filled) => {
      const cy = railTop + index * railGap;
      const ok = drawIconByName(c, iconName, ax, cy, iconS, color);
      if (!ok) fallbackDraw(c, ax, cy, iconS, color, filled);
      if (!pal.showCounts || !countText) return;
      c.font = `600 ${Math.round(base * 0.018)}px ${fs}`;
      c.fillStyle = color;
      c.textAlign = "center";
      c.textBaseline = "top";
      c.fillText(countText, ax, cy + iconS * 0.72);
    };

    drawRailItem(0, "heart", drawTwitterHeart, pal.showCounts ? (state.ytStats?.likes || "").trim() : "", pal.likeColor, pal.likeFilled);
    drawRailItem(1, "message", drawTwitterReply, pal.showCounts ? ((state.ui.live && !(state.ytStats?.comments || "").trim()) ? "直播" : (state.ytStats?.comments || "").trim()) : "", pal.replyColor, false);
    drawRailItem(2, "repost", drawTwitterRetweet, pal.showCounts ? (state.ytStats?.reposts || "").trim() : "", pal.repostColor, false);
    drawRailItem(3, "share", drawTwitterShare, "", pal.base, false);

    // —— 底部：订阅 + 单条进度条 ——
    const footerPadX = Math.round(W * 0.05);
    const bottomBandY = Math.round(H * 0.78);
    const subW = Math.min(W * 0.34, Math.round(base * 0.42));
    const subH = Math.round(base * 0.055);
    roundRectFill(
      c,
      footerPadX,
      bottomBandY,
      subW,
      subH,
      subH / 2,
      state.ui.subs ? "rgba(255,255,255,0.22)" : th.accent
    );
    c.fillStyle = state.ui.subs ? "#fff" : "#111";
    c.font = `700 ${Math.round(base * 0.026)}px ${fs}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(state.ui.subs ? "已订阅" : "订阅", footerPadX + subW / 2, bottomBandY + subH / 2);

    // 进度条：只有一条，贴底部信息区上方
    const trackH = Math.max(3, Math.round(base * 0.008));
    const trackW = W - footerPadX * 2;
    const trackX = footerPadX;
    const trackY = Math.round(H * 0.9);
    const prog = state.ui.live ? 1 : 0.42;

    c.fillStyle = "rgba(255,255,255,0.28)";
    roundRectFill(c, trackX, trackY, trackW, trackH, trackH / 2, "rgba(255,255,255,0.28)");
    c.fillStyle = state.ui.live ? "#ff2d55" : "#1d9bf0";
    roundRectFill(c, trackX, trackY, trackW * prog, trackH, trackH / 2, state.ui.live ? "#ff2d55" : "#1d9bf0");

    if (state.ui.live) {
      // 直播：进度到最右，端点为红色圆点
      const hx = trackX + trackW - trackH;
      c.beginPath();
      c.arc(hx + trackH / 2, trackY + trackH / 2, trackH * 1.1, 0, Math.PI * 2);
      c.fillStyle = "#ff2d55";
      c.fill();
    } else {
      // 点头
      const hx = trackX + trackW * prog;
      c.beginPath();
      c.arc(hx, trackY + trackH / 2, trackH * 1.15, 0, Math.PI * 2);
      c.fillStyle = "#fff";
      c.fill();
    }

    // 进度条下方信息行
    const infoY = Math.round(H * 0.945);
    c.font = `400 ${Math.round(base * 0.022)}px ${fs}`;
    c.fillStyle = "rgba(255,255,255,0.92)";
    c.textBaseline = "middle";
    c.textAlign = "left";
    const playLabel = state.ui.live
      ? state.ui.playing
        ? "▶ 直播中"
        : "▶ 直播"
      : state.ui.playing
        ? "▶ 播放中"
        : "▶ 播放";
    c.fillText(playLabel, footerPadX, infoY);

    // 可选音量：做成左侧短条，不再与进度条叠成双轨
    if (state.volumeBar) {
      const volW = Math.round(base * 0.18);
      const volX = footerPadX + Math.round(base * 0.22);
      const volY = infoY - trackH;
      c.fillStyle = "rgba(255,255,255,0.25)";
      roundRectFill(c, volX, volY, volW, trackH, trackH / 2, "rgba(255,255,255,0.25)");
      c.fillStyle = th.accent;
      roundRectFill(c, volX, volY, volW * 0.62, trackH, trackH / 2, th.accent);
    }

    c.textAlign = "right";
    c.fillStyle = "rgba(255,255,255,0.85)";
    c.fillText(state.ui.autoplay ? "自动播放 · 开" : "自动播放 · 关", W - footerPadX, infoY);

    if (state.ui.live) {
      c.fillStyle = "#ff2d55";
      c.font = `700 ${Math.round(base * 0.02)}px ${fs}`;
      c.textAlign = "right";
      c.fillText("LIVE", W - footerPadX, trackY - Math.round(base * 0.03));
    }

    c.restore();
  }

  function drawYtPanelUi(c, W, H, th, fs) {
    const base = Math.min(W, H);
    c.save();
    const panelY = H * 0.58;
    const g = c.createLinearGradient(0, panelY, 0, H);
    g.addColorStop(0, "rgba(0,0,0,0.55)");
    g.addColorStop(1, "rgba(0,0,0,0.75)");
    c.fillStyle = g;
    c.fillRect(0, panelY, W, H - panelY);

    const title = state.title.trim() || "Now Watching";
    c.fillStyle = "#fff";
    c.font = `700 ${Math.round(base * 0.04)}px ${fs}`;
    c.textAlign = "left";
    c.textBaseline = "top";
    c.fillText(title.split("\n")[0], W * 0.04, panelY + H * 0.02);
    if (state.subtitle.trim()) {
      c.fillStyle = "rgba(255,255,255,0.7)";
      c.font = `400 ${Math.round(base * 0.024)}px ${fs}`;
      c.fillText(state.subtitle.trim(), W * 0.04, panelY + H * 0.07);
    }

    // control pills + Twitter-like action row
    const y = H * 0.82;
    const btn = (x, label, active) => {
      const w = Math.min(W * 0.22, 140);
      const h = Math.round(base * 0.045);
      roundRectFill(c, x, y, w, h, h / 2, active ? th.accent : "rgba(255,255,255,0.15)");
      c.fillStyle = active ? "#111" : "#fff";
      c.font = `600 ${Math.round(base * 0.022)}px ${fs}`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(label, x + w / 2, y + h / 2);
      return w;
    };
    let x = W * 0.04;
    x += btn(x, state.ui.playing ? "▶ 播放中" : "▶ 播放", state.ui.playing) + 8;
    x += btn(x, state.ui.subs ? "已订阅" : "订阅", state.ui.subs) + 8;

    // Twitter-style icons on the right of the panel controls
    const s = Math.round(base * 0.04);
    const iconY = y + Math.round(base * 0.022);
    let ix = W * 0.96;
    const pal = iconRailPalette(th);
    const counts = [
      { draw: drawTwitterShare, label: "", fill: pal.base, filled: false },
      { draw: drawTwitterRetweet, label: pal.showCounts ? (state.ytStats?.reposts || "").trim() : "", fill: pal.repostColor, filled: false },
      { draw: drawTwitterReply, label: pal.showCounts ? (state.ytStats?.comments || "").trim() : "", fill: pal.replyColor, filled: false },
      {
        draw: drawTwitterHeart,
        label: pal.showCounts ? (state.ytStats?.likes || "").trim() : "",
        fill: pal.likeColor,
        filled: pal.likeFilled,
      },
    ];
    counts.forEach((item) => {
      c.save();
      c.font = `600 ${Math.round(base * 0.018)}px ${fs}`;
      c.textAlign = "right";
      c.textBaseline = "middle";
      if (item.label) {
        c.fillStyle = item.fill;
        c.fillText(item.label, ix, iconY + s * 0.75);
        ix -= c.measureText(item.label).width + s * 0.35;
      }
      item.draw(c, ix, iconY, s, item.fill, item.filled);
      ix -= s * 1.35;
      c.restore();
    });

    // single progress line under controls
    const trackY = Math.round(H * 0.9);
    const trackX = W * 0.04;
    const trackW = W * 0.92;
    const th2 = Math.max(3, Math.round(base * 0.008));
    roundRectFill(c, trackX, trackY, trackW, th2, th2 / 2, "rgba(255,255,255,0.28)");
    const prog = state.ui.live ? 1 : 0.42;
    roundRectFill(
      c,
      trackX,
      trackY,
      trackW * prog,
      th2,
      th2 / 2,
      state.ui.live ? "#ff2d55" : "#1d9bf0"
    );

    if (state.ui.live) {
      c.fillStyle = "#ff2d55";
      c.font = `700 ${Math.round(base * 0.024)}px ${fs}`;
      c.textAlign = "right";
      c.textBaseline = "top";
      c.fillText("● LIVE", W * 0.96, panelY + H * 0.03);
    }
    c.restore();
  }

  function igChromeMetrics(W, H) {
    const topH = Math.round(H * 0.085);
    const userH = Math.round(H * 0.07);
    // 操作区：图标一行 + 数字一行（防重叠）
    const actionH = Math.round(H * 0.105);
    const capH = Math.round(H * 0.1);
    const pad = Math.round(W * 0.045);
    const gridY = topH + userH;
    const gridH = Math.max(40, H - topH - userH - actionH - capH);
    return { topH, userH, actionH, capH, pad, gridY, gridH };
  }

  function layoutIgPost(photos, W, H) {
    const m = igChromeMetrics(W, H);
    const gap = Math.round(W * 0.015);
    const gw = (W - m.pad * 2 - gap) / 2;
    const gh = (m.gridH - gap) / 2;
    return photos.slice(0, 4).map((_, i) => ({
      x: m.pad + (i % 2) * (gw + gap),
      y: m.gridY + Math.floor(i / 2) * (gh + gap),
      w: gw,
      h: gh,
      role: "ig-cell",
    }));
  }

  function drawIgBookmark(c, cx, cy, s, color) {
    // 以 cx,cy 为视觉中心的书签
    const w = s * 0.55;
    const h = s * 0.8;
    const x = cx - w / 2;
    const y = cy - h / 2;
    c.save();
    c.strokeStyle = color;
    c.lineWidth = Math.max(1.6, s * 0.1);
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + w, y);
    c.lineTo(x + w, y + h);
    c.lineTo(cx, y + h * 0.62);
    c.lineTo(x, y + h);
    c.closePath();
    c.stroke();
    c.restore();
  }

  function drawMediaIconShuffle(c, cx, cy, s, color) {
    c.save();
    c.strokeStyle = color;
    c.fillStyle = color;
    c.lineWidth = Math.max(1.6, s * 0.12);
    c.lineCap = "round";
    c.lineJoin = "round";
    const a = s * 0.42;
    // two crossing paths with arrow heads
    c.beginPath();
    c.moveTo(cx - a, cy - a * 0.45);
    c.lineTo(cx - a * 0.15, cy - a * 0.45);
    c.lineTo(cx + a * 0.35, cy + a * 0.35);
    c.lineTo(cx + a, cy + a * 0.35);
    c.stroke();
    c.beginPath();
    c.moveTo(cx + a * 0.7, cy + a * 0.05);
    c.lineTo(cx + a, cy + a * 0.35);
    c.lineTo(cx + a * 0.7, cy + a * 0.65);
    c.stroke();
    c.beginPath();
    c.moveTo(cx - a, cy + a * 0.45);
    c.lineTo(cx - a * 0.25, cy + a * 0.45);
    c.lineTo(cx + a * 0.25, cy - a * 0.45);
    c.lineTo(cx + a, cy - a * 0.45);
    c.stroke();
    c.beginPath();
    c.moveTo(cx + a * 0.7, cy - a * 0.75);
    c.lineTo(cx + a, cy - a * 0.45);
    c.lineTo(cx + a * 0.7, cy - a * 0.15);
    c.stroke();
    c.restore();
  }

  function drawMediaIconPrev(c, cx, cy, s, color) {
    c.save();
    c.fillStyle = color;
    const w = s * 0.55;
    const h = s * 0.7;
    // bar
    c.fillRect(cx - w * 0.55, cy - h / 2, s * 0.1, h);
    // triangle pointing left
    c.beginPath();
    c.moveTo(cx - w * 0.35, cy);
    c.lineTo(cx + w * 0.45, cy - h / 2);
    c.lineTo(cx + w * 0.45, cy + h / 2);
    c.closePath();
    c.fill();
    c.restore();
  }

  function drawMediaIconNext(c, cx, cy, s, color) {
    c.save();
    c.fillStyle = color;
    const w = s * 0.55;
    const h = s * 0.7;
    c.beginPath();
    c.moveTo(cx + w * 0.35, cy);
    c.lineTo(cx - w * 0.45, cy - h / 2);
    c.lineTo(cx - w * 0.45, cy + h / 2);
    c.closePath();
    c.fill();
    c.fillRect(cx + w * 0.45, cy - h / 2, s * 0.1, h);
    c.restore();
  }

  function drawMediaIconRepeat(c, cx, cy, s, color) {
    c.save();
    c.strokeStyle = color;
    c.fillStyle = color;
    c.lineWidth = Math.max(1.6, s * 0.12);
    c.lineCap = "round";
    c.lineJoin = "round";
    const a = s * 0.4;
    // loop rectangle with gaps and arrows
    c.beginPath();
    c.moveTo(cx - a, cy - a * 0.35);
    c.lineTo(cx + a * 0.35, cy - a * 0.35);
    c.stroke();
    c.beginPath();
    c.moveTo(cx + a * 0.55, cy - a * 0.65);
    c.lineTo(cx + a, cy - a * 0.35);
    c.lineTo(cx + a * 0.55, cy - a * 0.05);
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(cx + a, cy + a * 0.35);
    c.lineTo(cx - a * 0.35, cy + a * 0.35);
    c.stroke();
    c.beginPath();
    c.moveTo(cx - a * 0.55, cy + a * 0.65);
    c.lineTo(cx - a, cy + a * 0.35);
    c.lineTo(cx - a * 0.55, cy + a * 0.05);
    c.closePath();
    c.fill();
    c.restore();
  }

  function drawMediaPlayPause(c, cx, cy, r, color, playing) {
    // 只画圆形底；图标由 drawIconByName 叠加，避免与矢量字形叠画
    c.save();
    c.fillStyle = color;
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "rgba(255,255,255,0.18)";
    c.lineWidth = Math.max(1, r * 0.06);
    c.beginPath();
    c.arc(cx, cy, r * 0.92, 0, Math.PI * 2);
    c.stroke();
    // 图标资源未就绪时的极简兜底
    if (!getIconImage(playing !== false ? "pause" : "play")) {
      c.fillStyle = "#fff";
      if (playing !== false) {
        const bw = r * 0.16;
        const bh = r * 0.62;
        const gap = r * 0.14;
        c.fillRect(cx - gap / 2 - bw, cy - bh / 2, bw, bh);
        c.fillRect(cx + gap / 2, cy - bh / 2, bw, bh);
      } else {
        c.beginPath();
        c.moveTo(cx - r * 0.18, cy - r * 0.34);
        c.lineTo(cx + r * 0.34, cy);
        c.lineTo(cx - r * 0.18, cy + r * 0.34);
        c.closePath();
        c.fill();
      }
    }
    c.restore();
  }

  function drawIgPostChrome(c, W, H, photos) {
    // 参考 Totegram / Ins 动态墙：浅色 UI + 2×2 图 + 互动数据 + 文案
    const base = Math.min(W, H);
    const bg = "#fafafa";
    const ink = "#262626";
    const muted = "#8e8e8e";
    const line = "#dbdbdb";
    const heart = "#ff3040";
    const brand = (state.igBrand || state.footer.trim() || "").slice(0, 24);
    const user = (state.title.trim() || "").split("\n")[0].slice(0, 28);
    const captionExtra = (state.igCaption || state.subfooter.trim() || "").slice(0, 40);
    const stats = state.igStats || {};
    const likes = (stats.likes || "").trim();
    const comments = (stats.comments || "").trim();
    const reposts = (stats.reposts || "").trim();
    const shares = (stats.shares || "").trim();
    const fontUi = fontStack("gothic");
    const fontBrand = fontStack("script");

    c.save();
    c.fillStyle = bg;
    c.fillRect(0, 0, W, H);

    const m = igChromeMetrics(W, H);
    const topH = m.topH;
    const userH = m.userH;
    const actionH = m.actionH;
    const capH = m.capH;
    const pad = m.pad;

    // top bar
    c.strokeStyle = line;
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(0, topH);
    c.lineTo(W, topH);
    c.stroke();
    // camera glyph
    c.strokeStyle = ink;
    c.lineWidth = Math.max(1.5, base * 0.006);
    const cam = base * 0.028;
    roundedPath(c, pad, topH / 2 - cam * 0.45, cam * 1.25, cam * 0.95, 3);
    c.stroke();
    c.beginPath();
    c.arc(pad + cam * 0.62, topH / 2, cam * 0.22, 0, Math.PI * 2);
    c.stroke();
    // brand center（未填写则不画）
    if (brand) {
      c.fillStyle = ink;
      c.font = `italic 500 ${Math.round(base * 0.045)}px ${fontBrand}`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(brand, W / 2, topH / 2);
    }
    // send plane
    c.fillStyle = ink;
    c.beginPath();
    const sx = W - pad - base * 0.03;
    const sy = topH / 2;
    c.moveTo(sx, sy);
    c.lineTo(sx - base * 0.045, sy - base * 0.022);
    c.lineTo(sx - base * 0.012, sy);
    c.lineTo(sx - base * 0.045, sy + base * 0.022);
    c.closePath();
    c.fill();

    // user row（用户名空则只画占位圆点）
    const uy = topH + userH / 2;
    c.fillStyle = "#262626";
    c.beginPath();
    c.arc(pad + base * 0.035, uy, base * 0.035, 0, Math.PI * 2);
    c.fill();
    if (user) {
      c.fillStyle = "#fff";
      c.font = `700 ${Math.round(base * 0.03)}px ${fontUi}`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(user.slice(0, 1).toUpperCase(), pad + base * 0.035, uy);
      c.fillStyle = ink;
      c.font = `600 ${Math.round(base * 0.032)}px ${fontUi}`;
      c.textAlign = "left";
      c.fillText(user, pad + base * 0.09, uy);
    }
    c.fillStyle = muted;
    c.font = `700 ${Math.round(base * 0.035)}px ${fontUi}`;
    c.textAlign = "right";
    c.fillText("···", W - pad, uy);

    // grid
    const slots = layoutIgPost(photos, W, H);
    const r = Math.round(base * 0.008);
    photos.slice(0, 4).forEach((photo, i) => {
      const slot = slots[i];
      if (!slot || !photo?.img) return;
      drawCover(c, photo.img, slot.x, slot.y, slot.w, slot.h, r, photo.crop);
      c.strokeStyle = "rgba(0,0,0,0.06)";
      c.lineWidth = 1;
      roundedPath(c, slot.x, slot.y, slot.w, slot.h, r);
      c.stroke();
    });

    // —— 操作栏：Ins 式「图标一行 + 数字固定下一行」——
    // 规范：cx/cy 为图标视觉中心；数字顶边 ≥ cy + s*0.7；列距均分
    const gridBottom = m.gridY + m.gridH;
    const isz = Math.round(base * 0.042);
    const iconCy = gridBottom + actionH * 0.32;
    const countCy = iconCy + isz * 0.95; // 数字行：图标包围盒之下
    const countFont = `600 ${Math.round(base * 0.026)}px ${fontUi}`;
    const bookmarkW = isz * 1.2;
    const trackLeft = pad;
    const trackRight = W - pad - bookmarkW;
    const items = [
      { draw: (cc, x, y, s) => drawTwitterHeart(cc, x, y, s, heart, true), count: likes },
      { draw: (cc, x, y, s) => drawTwitterReply(cc, x, y, s, ink, false), count: comments },
      { draw: (cc, x, y, s) => drawTwitterRetweet(cc, x, y, s, ink, false), count: reposts },
      { draw: (cc, x, y, s) => drawTwitterShare(cc, x, y, s, ink), count: shares },
    ];
    const cellW = (trackRight - trackLeft) / items.length;
    c.font = countFont;
    items.forEach((item, i) => {
      const cx = trackLeft + cellW * (i + 0.5);
      item.draw(c, cx, iconCy, isz, ink);
      if (!item.count) return;
      c.fillStyle = ink;
      c.textAlign = "center";
      c.textBaseline = "top";
      c.fillText(item.count, cx, iconCy + isz * 0.72);
    });
    drawIgBookmark(c, W - pad - bookmarkW * 0.35, iconCy, isz, ink);

    // caption
    const cyCap = gridBottom + actionH + capH * 0.12;
    const cap = [user, captionExtra].filter(Boolean).join(" ");
    if (cap) {
      c.fillStyle = ink;
      c.font = `600 ${Math.round(base * 0.032)}px ${fontUi}`;
      c.textAlign = "left";
      c.textBaseline = "top";
      c.fillText(cap.slice(0, 36), pad, cyCap);
    }
    c.fillStyle = muted;
    c.font = `400 ${Math.round(base * 0.026)}px ${fontUi}`;
    c.fillText(formatDateShort(), pad, cyCap + (cap ? base * 0.042 : 0));

    c.restore();
    return slots;
  }

  /** 解析 0:56 / -4:34 / 56 / 274 等为秒 */
  function parseTimeToSeconds(str) {
    if (str == null) return null;
    let s = String(str).trim();
    if (!s) return null;
    let neg = false;
    if (s.startsWith("-")) {
      neg = true;
      s = s.slice(1).trim();
    }
    if (/^\d+(\.\d+)?$/.test(s)) {
      const n = Number(s);
      return neg ? -n : n;
    }
    const m = s.match(/^(\d{1,3}):([0-5]?\d)$/);
    if (!m) return null;
    const sec = Number(m[1]) * 60 + Number(m[2]);
    return neg ? -sec : sec;
  }

  /** 播放进度：左侧为已播，右侧可为剩余（负号）或总时长 */
  function playerProgressFromTimes(t1, t2, live) {
    if (live) return 1;
    const a = parseTimeToSeconds(t1);
    if (a == null || a < 0) return 0.22;
    let b = parseTimeToSeconds(t2);
    if (b == null) return 0.22;
    if (b < 0) b = -b; // -4:34 → 剩余 4:34
    // 若右侧更大且很像「总时长」（≥ 当前已播），优先当总时长
    let total;
    if (b > a && b >= 60 && String(t2 || "").trim().startsWith("-") === false) {
      // 右侧可能是总时长：0:56 / 5:30
      total = b;
    } else {
      total = a + b;
    }
    if (total <= 0) return 0.22;
    return Math.max(0.02, Math.min(0.98, a / total));
  }

  function drawPlayerChrome(c, W, H, th, fs) {
    const base = Math.min(W, H);
    c.save();
    if (state.layout === "player" && state.photos[0]?.img) {
      const img = state.photos[0].img;
      // 全幅封面 + 裁切，避免 UI 画出画布外导致预览「看不全」
      c.save();
      c.beginPath();
      c.rect(0, 0, W, H);
      c.clip();
      drawCover(c, img, 0, 0, W, H, 0, state.photos[0].crop);
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "rgba(0,0,0,0.35)");
      g.addColorStop(0.35, "rgba(0,0,0,0.05)");
      g.addColorStop(0.62, "rgba(0,0,0,0.15)");
      g.addColorStop(1, "rgba(0,0,0,0.72)");
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);

      const pad = Math.round(Math.min(W, H) * 0.05);
      const base = Math.min(W, H);
      const pm = state.playerMeta || {};
      const header = ((pm.header || state.title || "").toString().trim() || "").split("\n")[0];
      const track = ((pm.track || state.subtitle || "").toString().trim() || "").split("\n")[0];
      const artist = ((pm.artist || state.subfooter || "").toString().trim() || "").split("\n")[0];
      const t1 = (pm.timeLeft || "").toString().trim();
      const t2 = (pm.timeRight || "").toString().trim();
      const playColor = state.playerColor || "#7c3aed";

      // 顶栏
      c.fillStyle = "#fff";
      c.font = `500 ${Math.round(base * 0.04)}px ${fs}`;
      c.textAlign = "left";
      c.textBaseline = "middle";
      c.fillText("⌄", pad, pad + base * 0.02);
      if (header) {
        c.textAlign = "center";
        c.font = `600 ${Math.round(base * 0.036)}px ${fs}`;
        c.fillText(header, W / 2, pad + base * 0.02);
      }
      c.textAlign = "right";
      c.font = `700 ${Math.round(base * 0.036)}px ${fs}`;
      c.fillText("···", W - pad, pad + base * 0.02);

      // 歌曲信息：整体上移，给播控与底栏留出完整空间
      const thumb = Math.round(Math.min(base * 0.14, H * 0.12));
      const infoY = Math.min(H * 0.68, H - thumb - base * 0.28);
      c.save();
      c.shadowColor = "rgba(0,0,0,0.4)";
      c.shadowBlur = 12;
      drawCover(c, img, pad, infoY, thumb, thumb, Math.round(base * 0.012), state.photos[0].crop);
      c.restore();
      if (track || artist) {
        c.fillStyle = "#fff";
        c.font = `700 ${Math.round(base * 0.045)}px ${fs}`;
        c.textAlign = "left";
        c.textBaseline = "top";
        const tx = pad + thumb + base * 0.03;
        if (track) c.fillText(track, tx, infoY + base * 0.01);
        if (artist) {
          c.fillStyle = "rgba(255,255,255,0.75)";
          c.font = `400 ${Math.round(base * 0.028)}px ${fs}`;
          c.fillText(artist, tx, infoY + (track ? base * 0.065 : base * 0.01));
        }
      }
      if (!drawIconByName(c, "heart", W - pad - base * 0.02, infoY + thumb * 0.45, base * 0.05, state.ui.liked ? "#ff2d55" : "rgba(255,255,255,0.9)")) {
        drawTwitterHeart(c, W - pad - base * 0.02, infoY + thumb * 0.45, base * 0.045, state.ui.liked ? "#ff2d55" : "rgba(255,255,255,0.85)", !!state.ui.liked);
      }

      // 进度条（时间紧贴条下方）
      const py = infoY + thumb + base * 0.035;
      const pw = W - pad * 2;
      const ph = Math.max(3, base * 0.008);
      const prog = playerProgressFromTimes(t1, t2, state.ui.live);
      roundRectFill(c, pad, py, pw, ph, ph / 2, "rgba(255,255,255,0.28)");
      roundRectFill(c, pad, py, pw * prog, ph, ph / 2, "#c4b5fd");
      c.beginPath();
      c.arc(pad + pw * prog, py + ph / 2, ph * 1.2, 0, Math.PI * 2);
      c.fillStyle = "#fff";
      c.fill();
      const timeSize = Math.round(base * 0.02);
      const timeY = py + ph + base * 0.014;
      c.fillStyle = "rgba(255,255,255,0.8)";
      c.font = `400 ${timeSize}px ${fs}`;
      c.textAlign = "left";
      c.textBaseline = "top";
      if (t1) c.fillText(t1, pad, timeY);
      if (t2) {
        c.textAlign = "right";
        c.fillText(t2, W - pad, timeY);
      }

      // 播控：与进度条/时间拉开间距（参考图二），底部仍完整可见
      const iconS = Math.round(Math.min(W * 0.075, base * 0.08, H * 0.042));
      const btnR = Math.round(Math.min(W * 0.095, base * 0.11, H * 0.055));
      const timesBottom = timeY + timeSize;
      // 参考图：时间与播控之间约 0.05–0.08 画布高
      const gapBarIcons = Math.max(base * 0.07, H * 0.045);
      const botIcon = Math.round(Math.min(base * 0.036, H * 0.022));
      const bottomBand = Math.max(botIcon * 2.8, H * 0.045) + pad * 0.6;
      let ty = timesBottom + gapBarIcons + btnR;
      // 底栏图标带之后仍要落在画布内
      const maxTy = H - bottomBand - btnR;
      if (ty > maxTy) ty = Math.max(timesBottom + btnR + 8, maxTy);
      const cx = W / 2;
      const isPlaying = state.ui.playing !== false;
      const step = Math.min(W * 0.155, base * 0.24);
      const clampX = (x) => Math.max(pad + iconS * 0.2, Math.min(W - pad - iconS * 0.2, x));
      const iconColor = "rgba(255,255,255,0.95)";
      drawMediaPlayPause(c, cx, ty, btnR, playColor, isPlaying);
      drawIconByName(c, isPlaying ? "pause" : "play", cx, ty, btnR * 1.05, "#fff");
      const side = [
        ["shuffle", clampX(cx - step * 2), drawMediaIconShuffle],
        ["prev", clampX(cx - step), drawMediaIconPrev],
        ["next", clampX(cx + step), drawMediaIconNext],
        ["repeat", clampX(cx + step * 2), drawMediaIconRepeat],
      ];
      side.forEach(([name, x, fallback]) => {
        if (!drawIconByName(c, name, x, ty, iconS, iconColor)) {
          fallback(c, x, ty, iconS, iconColor);
        }
      });

      // 底栏：与播控行再拉开一档（图二：最下一排图标更靠底）
      const botY = Math.min(H - pad * 0.75, ty + btnR + Math.max(botIcon * 2.4, H * 0.038));
      if (!drawIconByName(c, "waypoints", pad + botIcon * 0.55, botY, botIcon, "rgba(255,255,255,0.8)")) {
        c.fillStyle = "rgba(255,255,255,0.75)";
        c.font = `400 ${Math.round(base * 0.022)}px ${fs}`;
        c.textAlign = "left";
        c.textBaseline = "middle";
        c.fillText("♫", pad, botY);
      }
      const qIcon = botIcon;
      const rx = W - pad - qIcon * 0.55;
      if (!drawIconByName(c, "queue", rx, botY, qIcon, "rgba(255,255,255,0.8)")) {
        c.fillStyle = "rgba(255,255,255,0.75)";
        c.font = `400 ${Math.round(base * 0.022)}px ${fs}`;
        c.textAlign = "right";
        c.textBaseline = "middle";
        c.fillText("≡", W - pad, botY);
      }
      const shX = W - pad - qIcon * 2.3;
      if (!drawIconByName(c, "send", shX, botY, qIcon * 1.15, "rgba(255,255,255,0.9)")) {
        c.save();
        c.strokeStyle = "rgba(255,255,255,0.85)";
        c.lineWidth = Math.max(1.4, base * 0.006);
        c.beginPath();
        c.moveTo(shX + qIcon * 0.45, botY - qIcon * 0.2);
        c.lineTo(shX - qIcon * 0.5, botY + qIcon * 0.28);
        c.lineTo(shX - qIcon * 0.08, botY);
        c.lineTo(shX - qIcon * 0.5, botY - qIcon * 0.28);
        c.closePath();
        c.stroke();
        c.restore();
      }
      c.restore();
    } else if (state.volumeBar && state.layout !== "player") {
      const vw = W * 0.35;
      const vx = (W - vw) / 2;
      const vy = H * 0.92;
      c.fillStyle = "rgba(0,0,0,0.35)";
      roundedPath(c, vx - 8, vy - 8, vw + 16, 22, 8);
      c.fill();
      c.fillStyle = "rgba(255,255,255,0.25)";
      roundedPath(c, vx, vy, vw, 6, 3);
      c.fill();
      c.fillStyle = th.accent;
      roundedPath(c, vx, vy, vw * 0.62, 6, 3);
      c.fill();
    }
    c.restore();
  }

  /* ——— paint tiles ——— */
  function paintSlots(c, W, H, photos, slots, th, r, activeId, highlight) {
    // special backgrounds already painted

    if (state.bgMode === "jacket" && photos[0] && state.layout !== "player") {
      // square art centered handled by slots usually; keep as-is
    }

    // polaroid/scrap backings
    if (state.layout === "polaroid" || state.layout === "scrapbook") {
      slots.forEach((slot) => {
        const pad = slot.w * 0.06;
        const bottom = slot.h * (state.layout === "scrapbook" ? 0.08 : 0.18);
        c.save();
        if (slot.rot) {
          c.translate(slot.x + slot.w / 2, slot.y + slot.h / 2);
          c.rotate(slot.rot);
          c.translate(-(slot.x + slot.w / 2), -(slot.y + slot.h / 2));
        }
        c.fillStyle = state.layout === "scrapbook" ? th.card : th.card;
        c.shadowColor = "rgba(0,0,0,0.35)";
        c.shadowBlur = 12;
        c.shadowOffsetY = 4;
        roundedPath(c, slot.x - pad * 0.3, slot.y - pad * 0.3, slot.w + pad * 0.6, slot.h + bottom, r * 0.6);
        c.fill();
        c.restore();
      });
    }

    photos.forEach((photo, i) => {
      const slot = slots[i];
      if (!slot || !photo.img) return;
      const crop = photo.crop;

      c.save();
      if (slot.rot) {
        c.translate(slot.x + slot.w / 2, slot.y + slot.h / 2);
        c.rotate(slot.rot);
        const x = -slot.w / 2;
        const y = -slot.h / 2;
        if (slot.polaroid) {
          drawCover(c, photo.img, x, y, slot.w, slot.h * 0.78, r, crop);
          c.fillStyle = th.card;
          c.fillRect(x - slot.w * 0.06, y + slot.h * 0.78, slot.w * 1.12, slot.h * 0.22);
        } else {
          drawCover(c, photo.img, x, y, slot.w, slot.h, r, crop);
        }
      } else if (slot.clip === "circle") {
        drawCoverCircle(c, photo.img, slot.cx, slot.cy, slot.radius, crop);
        if (highlight && photo.id === activeId) {
          c.beginPath();
          c.arc(slot.cx, slot.cy, slot.radius + 2, 0, Math.PI * 2);
          c.strokeStyle = "#c9a227";
          c.lineWidth = 3;
          c.stroke();
        }
      } else if (slot.poly) {
        c.beginPath();
        slot.poly.forEach(([px, py], idx) => {
          if (idx === 0) c.moveTo(px, py);
          else c.lineTo(px, py);
        });
        c.closePath();
        c.save();
        c.clip();
        // draw image covering full canvas
        drawCover(c, photo.img, 0, 0, W, H, 0, crop);
        c.restore();
        if (highlight && photo.id === activeId) {
          c.save();
          c.strokeStyle = "#c9a227";
          c.lineWidth = 3;
          c.stroke();
          c.restore();
        }
      } else if (slot.polaroid) {
        drawCover(c, photo.img, slot.x, slot.y, slot.w, slot.h * 0.78, r, crop);
        c.fillStyle = th.card;
        c.fillRect(slot.x - slot.w * 0.04, slot.y + slot.h * 0.78, slot.w * 1.08, slot.h * 0.2);
      } else {
        drawCover(c, photo.img, slot.x, slot.y, slot.w, slot.h, slot.fullBleed ? 0 : slot.radius ?? r, crop);
      }

      // player art re-draw on top later
      if (highlight && photo.id === activeId && !slot.clip && !slot.poly) {
        c.save();
        if (slot.rot) {
          c.translate(slot.x + slot.w / 2, slot.y + slot.h / 2);
          c.rotate(slot.rot);
          roundedPath(c, -slot.w / 2, -slot.h / 2, slot.w, slot.h, Math.max(4, r));
        } else {
          roundedPath(c, slot.x, slot.y, slot.w, slot.h, Math.max(4, r));
        }
        c.strokeStyle = "#c9a227";
        c.lineWidth = 2.5;
        c.stroke();
        c.restore();
      }
      c.restore();
    });
  }

  /* ——— export engine ——— */
  function formatDateShort() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
  }

  function stampLocal() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  }

  function sourceLongEdge() {
    let m = 0;
    for (const p of state.photos) {
      const img = p.img;
      if (!img) continue;
      m = Math.max(m, img.width || p.naturalWidth || 0, img.height || p.naturalHeight || 0);
    }
    return m;
  }

  function defaultMaxMB(size) {
    if (size === "ig") return 2;
    if (size === "x") return 5;
    return 0;
  }

  function resolveExportDimensions() {
    const ratioV = RATIOS[state.ratio] || 1;
    const dimFromLong = (long) => {
      if (ratioV >= 1) return { w: long, h: Math.max(1, Math.round(long / ratioV)) };
      return { w: Math.max(1, Math.round(long * ratioV)), h: long };
    };

    if (state.exportSize === "ig") {
      return { w: 1080, h: Math.max(1, Math.round(1080 / ratioV)), mode: "ig" };
    }
    if (state.exportSize === "x") {
      return { ...dimFromLong(4096), mode: "x" };
    }

    const srcLong = Math.max(sourceLongEdge(), 0);
    const n = state.photos.length || 1;
    const layout = state.layout;

    // 多格布局：按单格长边 ≈ 源图，反推画布长边
    let factor = 1;
    const gridFactor = (cols, rows) => {
      const c = Math.max(1, cols);
      const r = Math.max(1, rows);
      if (ratioV >= 1) return Math.min(c, ratioV * r) * 1.06;
      return Math.min(r, c / ratioV) * 1.06;
    };
    if (layout === "contact" || layout === "grid" || layout === "sns") {
      const c = n <= 4 ? 2 : n <= 9 ? 3 : 4;
      const r = Math.ceil(n / c);
      factor = gridFactor(c, r);
    } else if (layout === "mosaic") {
      const c = n <= 6 ? 2 : 3;
      const r = Math.ceil(n / c);
      factor = gridFactor(c, r) * 1.08;
    } else if (layout === "editorial") {
      factor = gridFactor(2, 2) * 0.95;
    } else if (layout === "split" || layout === "vline") {
      const c = Math.min(4, Math.max(2, n));
      factor = gridFactor(c, 1);
    } else if (layout === "hline" || layout === "filmstrip" || layout === "strip4") {
      const r = Math.min(6, Math.max(1, n));
      factor = gridFactor(1, r);
    } else if (layout === "polaroid") {
      factor = n <= 2 ? 1.9 : n <= 4 ? 2.35 : 2.9;
    } else if (layout === "scrapbook" || layout === "circle") {
      factor = 2.2;
    } else if (layout === "type" || layout === "player" || layout === "yt-short" || n === 1) {
      factor = 1;
      // 播放器/短视频原寸导出上限，避免超大画布导致 toBlob 失败
      if (layout === "player" || layout === "yt-short") factor = 1;
    } else {
      factor = 1.2;
    }

    let targetLong;
    if (srcLong > 0) {
      targetLong = factor <= 1 ? srcLong : Math.round(srcLong * factor);
    } else {
      targetLong = Math.max(previewW, previewH) * 2;
    }
    // 竖屏 UI 布局限制长边，保证可导出
    if (layout === "player" || layout === "yt-short" || layout === "yt-panel" || layout === "ig-post") {
      targetLong = Math.min(targetLong, 2560);
    }
    targetLong = Math.min(4096, Math.max(720, targetLong));
    return { ...dimFromLong(targetLong), mode: "original" };
  }

  function estimateSlotLong(w, h) {
    const single =
      state.photos.length === 1 ||
      state.layout === "type" ||
      state.layout === "player" ||
      state.layout === "yt-short";
    if (single) return Math.max(w, h);
    const g = gapPx(w, h);
    const slots = computeSlots(state.photos, w, h, g);
    let maxSlot = 0;
    slots.forEach((s) => {
      if (s.clip === "circle") maxSlot = Math.max(maxSlot, (s.radius || 0) * 2);
      else if (s.poly || s.fullBleed) maxSlot = Math.max(maxSlot, Math.max(w, h));
      else if (s.w > 0 && s.h > 0) maxSlot = Math.max(maxSlot, Math.max(s.w, s.h));
    });
    return maxSlot || Math.max(w, h);
  }

  function buildExportBasename() {
    const stamp = stampLocal();
    const n = state.photos.length;
    if (state.layout === "contact" || state.lastPreset === "archive") {
      return `contact-sheet_${stamp}_${n}p`;
    }
    return `collage_${state.layout}_${stamp}`;
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "—";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
  }

  function updateExportPreflight() {
    if (!els.metaSize) return;
    const dim = resolveExportDimensions();
    const src = sourceLongEdge();
    const slotLong = estimateSlotLong(dim.w, dim.h);
    const willUpscale = src > 0 && slotLong > src * 1.25;
    const fmt = state.exportFormat || "jpg";
    const maxMB = Number(state.maxMB) || 0;
    const filename = `${buildExportBasename()}.${fmt === "png" ? "png" : "jpg"}`;

    els.metaSize.textContent = `${dim.w}×${dim.h}`;
    els.metaFormat.textContent =
      fmt === "png"
        ? maxMB
          ? `PNG · 参考 ≤${maxMB}MB`
          : "PNG · 无损"
        : maxMB
          ? `JPG · 目标 ≤${maxMB}MB`
          : "JPG · 不限体积";
    els.metaUpscale.textContent = !src
      ? "—"
      : willUpscale
        ? `单格 ${Math.round(slotLong)}px > 源 ${src}px · 会放大`
        : `单格 ${Math.round(slotLong)}px / 源 ${src}px · 合理`;
    els.metaUpscale.style.color = willUpscale ? "var(--danger)" : "";
    els.metaFilename.textContent = filename;
    if (els.btnExport) els.btnExport.textContent = fmt === "png" ? "导出 PNG" : "导出 JPG";
    if (els.btnExport2) els.btnExport2.textContent = fmt === "png" ? "下载 PNG" : "下载 JPG";
  }

  function sampleCountForLayout() {
    const id = state.layout;
    if (id === "contact" || id === "sns") return 9;
    if (id === "grid") return 4;
    if (id === "split") return 2;
    if (id === "strip4") return 4;
    if (id === "vline" || id === "hline") return 4;
    if (id === "polaroid") return 4;
    if (id === "scrapbook") return 3;
    if (id === "circle") return 3;
    if (id === "mosaic" || id === "editorial") return 3;
    return 4;
  }

  function loadSamplePhoto() {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        samplePhoto = {
          id: "sample",
          name: "示例图",
          url: SAMPLE_SRC,
          img,
          naturalWidth: img.naturalWidth || img.width,
          naturalHeight: img.naturalHeight || img.height,
          crop: { zoom: 1, ox: 0, oy: 0 },
          isSample: true,
        };
        resolve(samplePhoto);
      };
      img.onerror = () => resolve(null);
      img.src = SAMPLE_SRC;
    });
  }

  function samplePhotosFor(count) {
    if (!samplePhoto) return [];
    const n = Math.max(1, Math.min(count || 4, 9));
    return Array.from({ length: n }, (_, i) => ({
      ...samplePhoto,
      id: `sample-${i}`,
      crop: { zoom: 1, ox: 0, oy: 0 },
    }));
  }

  function readFileAsImage(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        reject(new Error("不是图片文件"));
        return;
      }
      const url = URL.createObjectURL(file);
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const finish = (img, nw, nh) => {
        resolve({
          id,
          name: file.name,
          size: file.size || 0,
          type: file.type,
          url,
          img,
          naturalWidth: nw || img.width || 0,
          naturalHeight: nh || img.height || 0,
          crop: { zoom: 1, ox: 0, oy: 0 },
        });
      };
      const fallback = () => {
        const img = new Image();
        img.onload = () => finish(img, img.naturalWidth, img.naturalHeight);
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("无法读取图片"));
        };
        img.src = url;
      };
      // honor EXIF orientation for real camera/phone photos
      if (typeof createImageBitmap === "function") {
        createImageBitmap(file, { imageOrientation: "from-image" })
          .then((bmp) => finish(bmp, bmp.width, bmp.height))
          .catch(() => fallback());
      } else {
        fallback();
      }
    });
  }

  function paintCollage(c, W, H, photos, options = {}) {
    const th = theme();
    const g = gapPx(W, H);
    const r = radiusPx(W, H);
    const highlight = !!options.highlight;
    const activeId = state.activeId;

    drawBackground(c, W, H, photos, th);

    // jacket/player: main art already in background for player
    const slots = computeSlots(photos, W, H, g);
    if (options.captureSlots) lastSlots = slots;

    if (state.layout === "player") {
      // art + chrome；不绘制「光房拼贴」
      drawPlayerChrome(c, W, H, th, fontStack(state.fontSub));
    } else if (state.layout === "ig-post") {
      const igSlots = drawIgPostChrome(c, W, H, photos);
      if (options.captureSlots) lastSlots = igSlots;
      // 不套用通用文字，避免叠字
    } else if (state.layout === "type") {
      const img = photos[0]?.img;
      if (img) drawCover(c, img, 0, 0, W, H, 0, photos[0].crop);
      drawText(c, W, H, th);
    } else {
      paintSlots(c, W, H, photos, slots, th, r, activeId, highlight);
      drawText(c, W, H, th);
    }

    // 播放器 / IG 帖不叠加颗粒以外的品牌水印
    applyLight(c, W, H, th);
    applyTexture(c, W, H);
    return state.layout === "ig-post" ? (options.captureSlots ? lastSlots : layoutIgPost(photos, W, H)) : slots;
  }

  function computePreviewSize() {
    const ratio = RATIOS[state.ratio];
    const wrap = document.querySelector(".preview-wrap");
    const maxW = Math.min(wrap ? wrap.clientWidth - 2 : 720, 760);
    const maxH = Math.min(wrap ? wrap.clientHeight - 2 : 640, window.innerHeight - 56 - 72);
    let w, h;
    if (ratio >= 1) {
      w = Math.max(240, Math.floor(Math.min(maxW, maxH * ratio)));
      h = Math.floor(w / ratio);
    } else {
      h = Math.max(240, Math.floor(Math.min(maxH, maxW / ratio)));
      w = Math.floor(h * ratio);
    }
    previewW = Math.max(240, Math.round(w));
    previewH = Math.max(240, Math.round(h));
    els.canvas.width = previewW;
    els.canvas.height = previewH;
    applyViewZoom();
  }

  function layoutChromeUi() {
    return state.layout === "yt-short" || state.layout === "yt-panel" || state.layout === "player";
  }

  function layoutYtIcons() {
    return state.layout === "yt-short" || state.layout === "yt-panel";
  }

  function setBlockUnavailable(blockId, controlEl, hide, note) {
    const block = blockId ? document.getElementById(blockId) : controlEl?.closest?.(".control-block");
    if (!block) return;
    // 选定画布/预设后：不可用的文字设置直接隐藏，不占界面
    block.classList.toggle("is-hidden-ui", !!hide);
    block.classList.remove("is-unavailable");
    if (controlEl) {
      controlEl.disabled = !!hide;
      controlEl.setAttribute("aria-hidden", hide ? "true" : "false");
    }
    const noteEl = block.querySelector(".block-note");
    if (noteEl) {
      noteEl.hidden = true;
      noteEl.textContent = "";
    }
    void note;
  }

  function setPanelHidden(panelId, hidden, tagId, tagOn, tagOff) {
    const panel = panelId ? document.getElementById(panelId) : null;
    if (panel) {
      panel.classList.toggle("is-hidden-ui", !!hidden);
      panel.hidden = !!hidden;
    }
    const tag = tagId ? document.getElementById(tagId) : null;
    if (tag) {
      tag.textContent = hidden ? tagOff || "" : tagOn || "";
      tag.classList.toggle("is-off", !!hidden);
    }
  }

  function updateTextAvailability() {
    const L = state.layout;
    const chrome = layoutChromeUi();
    const ytIcons = layoutYtIcons();
    const isType = L === "type";
    const isIg = L === "ig-post";
    const isPlayer = L === "player";
    const layoutNameText = layoutName(L);

    // 文字版式：类型/Chrome/IG/播放器 均不使用通用文字版式 → 直接隐藏
    const styleOff = isType || chrome || isIg || isPlayer;
    setBlockUnavailable("block-text-style", els.selTextStyle, styleOff, "");

    // 标题：IG/播放器有专用字段，通用标题隐藏避免重复
    setBlockUnavailable("block-title", els.inpTitle, isIg || isPlayer, "");

    setBlockUnavailable("block-glow", els.chkGlow, isIg || isPlayer || isType, "");

    setBlockUnavailable("block-subtitle", els.inpSubtitle, isType || L === "yt-short" || isIg || isPlayer, "");

    setBlockUnavailable("block-footer", els.inpFooter, isType || L === "player" || isIg, "");

    setBlockUnavailable("block-subfooter", els.inpSubfooter, isType || L === "player" || L === "yt-short" || isIg, "");

    setBlockUnavailable("block-font", els.selFont, isIg || isPlayer || isType, "");

    setBlockUnavailable("block-font-sub", els.selFontSub, isType || isIg || isPlayer, "");

    // 界面模拟：仅 YT/播放器布局有意义
    const uiNote = chrome ? "" : `仅短视频 / 视频面板 / 播放器布局可用（当前：${layoutNameText}）`;
    const uiOff = !chrome;
    ["block-subs:chk-subs", "block-autoplay:chk-autoplay", "block-live:chk-live", "block-playing:chk-playing", "block-liked:chk-liked"].forEach(
      (pair) => {
        const [bid, cid] = pair.split(":");
        setBlockUnavailable(bid, $(cid), uiOff, uiNote);
      }
    );

    // 图标数字 / 颜色：短视频与面板动作栏
    const iconNote = ytIcons ? "" : `仅短视频 / 视频面板的动作栏图标可用（当前：${layoutNameText}）`;
    setBlockUnavailable("block-counts", els.chkCounts, !ytIcons, iconNote);
    setBlockUnavailable("block-icon-theme", els.selIconTheme, !ytIcons, iconNote);
    const ytCountOff = !ytIcons || state.ui.showCounts === false;
    const ytCountNote = !ytIcons
      ? iconNote
      : state.ui.showCounts === false
        ? "先勾选「显示图标旁数字」"
        : "";
    ["block-yt-likes:inp-yt-likes", "block-yt-comments:inp-yt-comments", "block-yt-reposts:inp-yt-reposts"].forEach((pair) => {
      const [bid, cid] = pair.split(":");
      setBlockUnavailable(bid, $(cid), ytCountOff, ytCountNote);
    });

    const panel = document.getElementById("panel-ui-sim");
    // 整组界面模拟：非 YT/播放器布局时直接不显示
    setPanelHidden("panel-ui-sim", !chrome, "ui-sim-tag", ytIcons ? "动作栏图标可用" : "播放器 UI 可用", "当前布局下不可用");
    void panel;

    // IG 动态墙面板：非 IG 布局整块隐藏
    setPanelHidden("panel-ig-content", !isIg, "ig-content-tag", "可编辑", "当前布局下不可用");
    const igOff = !isIg;
    [
      "block-ig-brand:inp-ig-brand",
      "block-ig-user:inp-ig-user",
      "block-ig-likes:inp-ig-likes",
      "block-ig-comments:inp-ig-comments",
      "block-ig-reposts:inp-ig-reposts",
      "block-ig-shares:inp-ig-shares",
      "block-ig-caption:inp-ig-caption",
    ].forEach((pair) => {
      const [bid, cid] = pair.split(":");
      setBlockUnavailable(bid, $(cid), igOff, "");
    });

    // 播放器面板：非播放器布局整块隐藏
    setPanelHidden("panel-player-content", !isPlayer, "player-content-tag", "可编辑", "当前布局下不可用");
    const plOff = !isPlayer;
    [
      "block-player-header:inp-player-header",
      "block-player-track:inp-player-track",
      "block-player-artist:inp-player-artist",
      "block-player-time:inp-player-t1",
      "block-player-color:inp-player-color",
      "block-player-icons:btn-reset-icons",
    ].forEach((pair) => {
      const [bid, cid] = pair.split(":");
      setBlockUnavailable(bid, $(cid), plOff, "");
    });
    if (els.btnEyedrop) els.btnEyedrop.disabled = plOff;
    const plT2 = $("inp-player-t2");
    if (plT2) plT2.disabled = plOff;
    void layoutNameText;
  }

  function render() {
    const photos = state.photos;
    const hasPhotos = photos.length > 0;
    const showSample = !hasPhotos && !!samplePhoto;
    const renderPhotos = hasPhotos ? photos : showSample ? samplePhotosFor(sampleCountForLayout()) : [];
    const W = previewW;
    const H = previewH;

    els.ctx.clearRect(0, 0, W, H);
    els.emptyState.hidden = hasPhotos || showSample;
    els.canvas.classList.toggle("is-empty", !hasPhotos && !showSample);
    els.canvas.classList.toggle("is-crop", hasPhotos && state.editMode === "crop" && !state.colorPickMode);
    els.canvas.classList.toggle("is-eyedrop", !!state.colorPickMode && hasPhotos);
    if (els.canvasMode) {
      els.canvasMode.textContent = state.colorPickMode ? "取色模式" : state.editMode === "crop" ? "裁剪模式" : state.editMode === "reorder" ? "排序模式" : "预览模式";
    }
    els.btnExport.disabled = !hasPhotos;
    els.btnExport2.disabled = !hasPhotos;
    els.btnClear.disabled = !hasPhotos;
    if (state.layout === "player") {
      // 播放器布局强制不输出「光房拼贴」水印
      state.credit = false;
      if (els.chkCredit) els.chkCredit.checked = false;
    }
    if (els.metaCount) els.metaCount.textContent = `${photos.length} 张`;

    if (!hasPhotos && !showSample) {
      lastSlots = [];
      if (els.metaSize) els.metaSize.textContent = "—";
      updateExportPreflight();
      els.statusText.textContent = "等待照片";
      els.statusText.classList.remove("is-ready");
      els.statusDetail.textContent = state.ratio;
      syncCropUi();
      syncZoomUi();
      updateTextAvailability();
      return;
    }

    if (showSample && !hasPhotos) {
      paintCollage(els.ctx, W, H, renderPhotos, { highlight: false, captureSlots: false, isSample: true });
      updateExportPreflight();
      els.statusText.textContent = `布局预览 · ${layoutName(state.layout)} · 示例图`;
      els.statusText.classList.add("is-ready");
      els.statusDetail.textContent = `${state.ratio} · ${themeName(state.theme)} · 点击布局实时切换`;
      syncCropUi();
      syncZoomUi();
      applyViewZoom();
      updateTextAvailability();
      return;
    }

    // export quality path: never draw crop chrome on preview export sync
    paintCollage(els.ctx, W, H, photos, {
      highlight: state.editMode === "crop" || state.editMode === "reorder",
      captureSlots: true,
    });

    updateExportPreflight();
    els.statusText.textContent = `已就绪 · ${photos.length} 张 · ${layoutName(state.layout)}${
      state.editMode === "crop" ? " · 裁剪模式" : state.editMode === "reorder" ? " · 排序模式" : ""
    }`;
    els.statusText.classList.add("is-ready");
    const act = activePhoto();
    const gz = Math.round((state.photoZoomAll || 1) * 100);
    const vz = Math.round((state.viewZoom || 1) * 100);
    const lz = act ? Number(act.crop?.zoom ?? 1).toFixed(2) : "1.00";
    els.statusDetail.textContent = `${state.ratio} · ${themeName(state.theme)} · 照片 ${gz}% / 视图 ${vz}%（单图 ${lz}×）`;
    syncCropUi();
    syncZoomUi();
    applyViewZoom();
    updateTextAvailability();
  }

  function softRender() {
    els.canvas.classList.add("is-fading");
    requestAnimationFrame(() => {
      render();
      requestAnimationFrame(() => els.canvas.classList.remove("is-fading"));
    });
  }

  function layoutName(id) {
    return LAYOUTS.find((l) => l.id === id)?.name || id;
  }

  function themeName(id) {
    return { dark: "暗色", light: "亮色", paper: "纸张", sepia: "深褐", midnight: "午夜" }[id] || id;
  }

  /* ——— photo IO ——— */
  async function addFiles(fileList) {
    const incoming = Array.from(fileList || []);
    const invalidCount = incoming.filter((f) => !f.type.startsWith("image/")).length;
    const files = incoming.filter((f) => f.type.startsWith("image/"));
    if (!files.length) {
      showToast("请选择图片文件（支持 JPG、PNG、WEBP 等格式）", true);
      return;
    }
    const existing = new Set(state.photos.map((p) => `${p.name}:${p.size || 0}`));
    const uniqueFiles = files.filter((file) => {
      const key = `${file.name}:${file.size || 0}`;
      if (existing.has(key)) return false;
      existing.add(key);
      return true;
    });
    if (!uniqueFiles.length) {
      showToast("这些照片已经添加过了", true);
      return;
    }
    try {
      snapshot("添加照片");
      const loaded = await Promise.all(uniqueFiles.map(readFileAsImage));
      state.photos.push(...loaded);
      if (!state.activeId && loaded[0]) state.activeId = loaded[0].id;
      renderFilmstrip();
      render();
      const note = invalidCount ? `，已跳过 ${invalidCount} 个非图片文件` : "";
      showToast(`已添加 ${loaded.length} 张${note} · 可裁剪、排序或套用预设`);
    } catch (err) {
      if (undoStack.length) {
        const last = undoStack[undoStack.length - 1];
        if (last.label === "添加照片") undoStack.pop();
      }
      showToast(err.message || "读取失败", true);
      if (els.btnUndo) els.btnUndo.disabled = undoStack.length === 0;
    }
  }

  function removePhoto(id) {
    snapshot("删除照片");
    const idx = state.photos.findIndex((p) => p.id === id);
    if (idx >= 0) {
      state.trash.push(state.photos[idx]);
      state.photos.splice(idx, 1);
    }
    if (state.activeId === id) state.activeId = state.photos[0]?.id || null;
    renderFilmstrip();
    render();
  }

  function clearPhotos() {
    if (!state.photos.length) return;
    snapshot("清空照片");
    state.photos.forEach((p) => state.trash.push(p));
    state.photos = [];
    state.activeId = null;
    renderFilmstrip();
    render();
  }

  function shufflePhotos() {
    snapshot("打乱顺序");
    for (let i = state.photos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [state.photos[i], state.photos[j]] = [state.photos[j], state.photos[i]];
    }
    renderFilmstrip();
    render();
  }

  function sortByName() {
    snapshot("按文件名排序");
    state.photos.sort((a, b) => a.name.localeCompare(b.name, "zh"));
    renderFilmstrip();
    render();
  }

  function moveActive(dir) {
    const i = state.photos.findIndex((p) => p.id === state.activeId);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= state.photos.length) return;
    snapshot("调整顺序");
    const tmp = state.photos[i];
    state.photos[i] = state.photos[j];
    state.photos[j] = tmp;
    renderFilmstrip();
    render();
  }

  function resetCrop(photo) {
    if (!photo) return;
    snapshot("重置裁剪");
    photo.crop = { zoom: 1, ox: 0, oy: 0 };
    render();
  }

  function resetAllCrops() {
    snapshot("重置全部裁剪");
    state.photos.forEach((p) => {
      p.crop = { zoom: 1, ox: 0, oy: 0 };
    });
    render();
  }

  function setZoom(delta) {
    const p = activePhoto();
    if (!p) {
      // 无选中图时退化为全局缩放
      setGlobalZoom((state.photoZoomAll || 1) + delta);
      return;
    }
    snapshotThrottled("裁剪缩放");
    const crop = ensureCrop(p);
    crop.zoom = Math.max(1, Math.min(4, Math.round((crop.zoom + delta) * 100) / 100));
    render();
  }

  function setGlobalZoom(next) {
    snapshotThrottled("全局缩放");
    state.photoZoomAll = Math.max(0.5, Math.min(2.5, Math.round(next * 100) / 100));
    syncZoomUi();
    render();
  }

  function resetZoomAll() {
    snapshot("重置缩放");
    state.photoZoomAll = 1;
    state.photos.forEach((p) => {
      if (p.crop) {
        p.crop.zoom = 1;
        p.crop.ox = 0;
        p.crop.oy = 0;
      }
    });
    syncZoomUi();
    render();
  }

  function setViewZoom(next) {
    state.viewZoom = Math.max(0.4, Math.min(3, Math.round(next * 100) / 100));
    applyViewZoom();
  }

  function resetViewZoom() {
    state.viewZoom = 1;
    applyViewZoom();
  }

  function applyViewZoom() {
    if (!els.canvas) return;
    const z = state.viewZoom || 1;
    const stageInner = els.stageInner || document.querySelector(".stage-inner");
    if (Math.abs(z - 1) < 0.001) {
      els.canvas.classList.remove("is-view-zoomed", "can-pan-view");
      els.canvas.style.width = "";
      els.canvas.style.height = "";
      if (stageInner) stageInner.classList.remove("has-view-overflow");
    } else {
      els.canvas.classList.add("is-view-zoomed", "can-pan-view");
      els.canvas.style.width = `${Math.max(120, Math.round(previewW * z))}px`;
      els.canvas.style.height = `${Math.max(120, Math.round(previewH * z))}px`;
      if (stageInner) stageInner.classList.add("has-view-overflow");
    }
    if (els.viewZoomVal) els.viewZoomVal.textContent = `${Math.round(z * 100)}%`;
  }

  function viewportScroller() {
    return els.stageInner || document.querySelector(".stage-inner");
  }

  function panViewportBy(dx, dy) {
    const sc = viewportScroller();
    if (!sc) return;
    sc.scrollLeft = (sc.scrollLeft || 0) - dx;
    sc.scrollTop = (sc.scrollTop || 0) - dy;
  }

  function isViewPanEvent(e) {
    if (!e) return false;
    if (e.button === 1) return true; // 中键
    if (e.altKey && e.button === 0) return true; // Alt+左键
    if (state.spacePan && e.button === 0) return true; // 空格+左键
    // 视图已放大且非裁剪模式时，左键拖拽平移视口
    if ((state.viewZoom || 1) > 1.02 && state.editMode !== "crop" && e.button === 0) return true;
    return false;
  }

  function syncZoomUi() {
    const pct = Math.round((state.photoZoomAll || 1) * 100);
    if (els.stageZoomVal) els.stageZoomVal.textContent = `${pct}%`;
    // 视图缩放始终可用；照片缩放组一并展示便于对照
    if (els.stageZoom) els.stageZoom.hidden = false;
    if (els.viewZoomVal) els.viewZoomVal.textContent = `${Math.round((state.viewZoom || 1) * 100)}%`;
    const p = activePhoto();
    const local = p ? (p.crop?.zoom ?? 1) : 1;
    if (els.zoomValue) els.zoomValue.textContent = `${Number(local).toFixed(2)}×`;
    if (els.rngZoom) els.rngZoom.value = String(Math.round(local * 100));
  }

  function renderFilmstrip() {
    const has = state.photos.length > 0;
    els.filmstrip.hidden = !has;
    els.filmActions.hidden = !has;
    els.photoEditPanel.hidden = !has;
    if (els.photoSummary) els.photoSummary.hidden = !has;
    if (els.photoCount) els.photoCount.textContent = `${state.photos.length} 张照片`;
    if (els.photoSizeSummary) {
      const total = state.photos.reduce((sum, photo) => sum + (photo.size || 0), 0);
      els.photoSizeSummary.textContent = total ? `${(total / 1024 / 1024).toFixed(1)} MB` : "本地处理";
    }
    els.dropzone.classList.toggle("has-photos", has);
    els.filmstrip.innerHTML = "";
    els.filmstripSort.innerHTML = "";

    const makeFrame = (p, i) => {
      const frame = document.createElement("div");
      frame.className = "film-frame" + (p.id === state.activeId ? " is-active" : "");
      frame.tabIndex = 0;
      frame.dataset.id = p.id;
      frame.setAttribute("role", "button");
      frame.setAttribute("aria-label", `照片 ${i + 1}：${p.name}`);
      frame.title = `${p.name} · ${p.naturalWidth || 0}×${p.naturalHeight || 0}`;
      const img = document.createElement("img");
      img.src = p.url;
      img.alt = "";
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "film-remove";
      remove.textContent = "×";
      remove.title = "移除";
      remove.addEventListener("click", (e) => {
        e.stopPropagation();
        removePhoto(p.id);
      });
      const idx = document.createElement("span");
      idx.className = "film-idx";
      idx.textContent = String(i + 1).padStart(2, "0");
      frame.append(img, remove, idx);

      frame.addEventListener("click", () => {
        setActivePhoto(p.id);
      });
      frame.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setActivePhoto(p.id);
        }
        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          removePhoto(p.id);
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          const current = state.photos.findIndex((photo) => photo.id === p.id);
          const next = current + (e.key === "ArrowRight" ? 1 : -1);
          if (state.photos[next]) setActivePhoto(state.photos[next].id);
        }
      });

      frame.draggable = true;
      frame.addEventListener("dragstart", (e) => {
        dragSortId = p.id;
        frame.classList.add("is-dragging");
        e.dataTransfer.effectAllowed = "move";
      });
      frame.addEventListener("dragend", () => {
        dragSortId = null;
        frame.classList.remove("is-dragging");
      });
      frame.addEventListener("dragover", (e) => {
        e.preventDefault();
      });
      frame.addEventListener("drop", (e) => {
        e.preventDefault();
        const from = state.photos.findIndex((x) => x.id === dragSortId);
        const to = state.photos.findIndex((x) => x.id === p.id);
        if (from < 0 || to < 0 || from === to) return;
        snapshot("拖拽排序");
        const [item] = state.photos.splice(from, 1);
        state.photos.splice(to, 0, item);
        renderFilmstrip();
        render();
      });
      return frame;
    };

    state.photos.forEach((p, i) => {
      els.filmstrip.appendChild(makeFrame(p, i));
      els.filmstripSort.appendChild(makeFrame(p, i));
    });
  }

  function syncCropUi() {
    const p = activePhoto();
    els.activePhotoLabel.textContent = p ? p.name : "—";
    const crop = p ? ensureCrop(p) : { zoom: 1, ox: 0, oy: 0 };
    els.zoomValue.textContent = `${crop.zoom.toFixed(2)}×`;
    els.rngZoom.value = String(Math.round(crop.zoom * 100));
    els.rngOx.value = String(Math.round(crop.ox * 100));
    els.rngOy.value = String(Math.round(crop.oy * 100));
  }

  /* ——— export download ——— */
  function setExportBusy(busy) {
    document.body.classList.toggle("is-exporting", busy);
    [els.btnExport, els.btnExport2].forEach((button) => {
      if (!button) return;
      button.disabled = busy || !state.photos.length;
      button.classList.toggle("is-busy", busy);
      if (busy) button.textContent = "导出中…";
    });
    if (els.statusText && busy) els.statusText.textContent = "正在生成导出文件…";
  }

  function exportJpg() {
    if (document.body.classList.contains("is-exporting")) return;
    if (!state.photos.length) {
      showToast("请先添加照片", true);
      return;
    }
    if (state.layout === "player" && !state.photos[0]?.img) {
      showToast("播放器封面需要至少一张照片", true);
      return;
    }
    document.body.classList.add("is-exporting");
    setExportBusy(true);

    const dim = resolveExportDimensions();
    let w = dim.w;
    let h = dim.h;
    const ratioV = RATIOS[state.ratio] || 1;
    // 播放器/短视频：强制使用安全社交尺寸，避免 0 尺寸或超大画布导致 toBlob 失败
    if (state.layout === "player" || state.layout === "yt-short" || state.layout === "ig-post") {
      if (state.exportSize === "ig" || state.exportFormat === "png") {
        if (ratioV >= 1) {
          w = 1080;
          h = Math.max(1, Math.round(1080 / ratioV));
        } else {
          w = 1080;
          h = Math.max(1, Math.round(1080 / ratioV));
        }
      } else if (state.exportSize === "x") {
        const long = Math.min(2560, 2160);
        if (ratioV >= 1) {
          w = long;
          h = Math.round(long / ratioV);
        } else {
          w = Math.round(long * ratioV);
          h = long;
        }
      } else {
        // original：以预览为基准 2×，上限 2048
        const scale = 2;
        w = Math.min(2048, Math.max(1080, previewW * scale));
        h = Math.round(w / ratioV);
      }
    }
    // 防御：异常尺寸不导出
    if (!w || !h || w < 8 || h < 8 || w > 8000 || h > 8000) {
      w = Math.min(2048, Math.max(720, previewW));
      h = Math.round(w / (RATIOS[state.ratio] || 1));
      if ((RATIOS[state.ratio] || 1) < 1) {
        h = Math.min(2560, Math.max(1280, previewH));
        w = Math.round(h * (RATIOS[state.ratio] || 1));
      }
    }
    const fmt = state.exportFormat === "png" ? "png" : "jpg";
    const maxMB = Number(state.maxMB) || 0;
    const maxSize = maxMB > 0 ? maxMB * 1024 * 1024 : Infinity;

    const finishDownload = (blob, quality) => {
      setExportBusy(false);
      if (!blob || !blob.size) {
        showToast("导出失败：未生成图像数据", true);
        return;
      }
      const filename = `${buildExportBasename()}.${fmt === "png" ? "png" : "jpg"}`;
      const a = document.createElement("a");
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      const report = { w, h, format: fmt, bytes: blob.size, quality, filename, mode: state.exportSize, srcLong: sourceLongEdge() };
      state.lastExport = report;
      window.__lastExport = report;
      if (els.metaLast) {
        const qText = quality != null ? ` · q${Math.round(quality * 100)}` : "";
        els.metaLast.textContent = `${w}×${h} · ${fmt.toUpperCase()} · ${formatBytes(blob.size)}${qText}`;
      }
      showToast(`已导出 ${filename} · ${w}×${h} · ${formatBytes(blob.size)}`);
      updateExportPreflight();
    };

    try {
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const c = off.getContext("2d", { alpha: false });
      const prevLight = lightDrag;
      lightDrag = false;

      const blitPreview = () => {
        try {
          c.clearRect(0, 0, w, h);
          c.fillStyle = theme().bg;
          c.fillRect(0, 0, w, h);
          c.drawImage(els.canvas, 0, 0, w, h);
          return true;
        } catch (e) {
          console.error("blit preview failed", e);
          return false;
        }
      };

      let painted = false;
      try {
        paintCollage(c, w, h, state.photos, { highlight: false, captureSlots: false });
        // 采样多个点，判断是否几乎空白
        const pts = [
          [Math.floor(w * 0.5), Math.floor(h * 0.5)],
          [Math.floor(w * 0.2), Math.floor(h * 0.2)],
          [Math.floor(w * 0.8), Math.floor(h * 0.85)],
        ];
        painted = false;
        for (const [px, py] of pts) {
          try {
            const probe = c.getImageData(px, py, 1, 1).data;
            if (probe[0] + probe[1] + probe[2] > 8) {
              painted = true;
              break;
            }
          } catch (probeErr) {
            // Canvas 被污染时 getImageData 会抛错 —— 改走预览拷贝
            console.warn("export getImageData failed", probeErr);
            painted = blitPreview();
            break;
          }
        }
        if (!painted && state.layout === "player") {
          // 播放器：封面若偏暗，中心可能接近背景，再检查底部 UI 区
          try {
            const ui = c.getImageData(Math.floor(w * 0.5), Math.floor(h * 0.9), 1, 1).data;
            painted = ui[0] + ui[1] + ui[2] > 20;
          } catch {
            painted = blitPreview();
          }
        }
      } catch (paintErr) {
        console.error("paintCollage export failed", paintErr);
        painted = blitPreview();
      }
      if (!painted) {
        blitPreview() || c.fillRect(0, 0, w, h);
      }
      lightDrag = prevLight;

      const toBlob = (quality, type) =>
        new Promise((resolve) => {
          try {
            const cb = (blob) => resolve(blob);
            if (off.toBlob) off.toBlob(cb, type, quality);
            else resolve(null);
          } catch (e) {
            console.error("toBlob throw", e);
            resolve(null);
          }
        });

      (async () => {
        let blob = null;
        let quality = null;
        try {
          if (fmt === "png") {
            blob = await toBlob(undefined, "image/png");
          } else {
            quality = 0.98;
            blob = await toBlob(quality, "image/jpeg");
            while (blob && blob.size > maxSize && quality > 0.62) {
              quality = Math.round((quality - 0.04) * 100) / 100;
              blob = await toBlob(quality, "image/jpeg");
            }
          }
        } catch (blobErr) {
          console.error(blobErr);
          blob = null;
        }

        // toBlob 失败时用 dataURL 兜底
        if (!blob) {
          try {
            const dataUrl = off.toDataURL(fmt === "png" ? "image/png" : "image/jpeg", 0.92);
            const parts = dataUrl.split(",");
            const bin = atob(parts[1] || "");
            const arr = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
            blob = new Blob([arr], { type: fmt === "png" ? "image/png" : "image/jpeg" });
          } catch (dataErr) {
            console.error(dataErr);
            setExportBusy(false);
            showToast("导出失败：请改用 JPG 或降低尺寸后重试", true);
            return;
          }
        }
        if (!blob || !blob.size) {
          setExportBusy(false);
          showToast("导出失败：未生成图像数据", true);
          return;
        }
        finishDownload(blob, quality);
      })();
    } catch (err) {
      setExportBusy(false);
      console.error(err);
      showToast("导出失败，请重试", true);
    }
  }

  /* ——— settings memory ——— */
  function collectSettings() {
    return {
      layout: state.layout,
      ratio: state.ratio,
      theme: state.theme,
      cols: state.cols,
      bgMode: state.bgMode,
      ghost: state.ghost,
      gap: state.gap,
      radius: state.radius,
      grain: state.grain,
      light: state.light,
      lightStrength: state.lightStrength,
      lightColor: state.lightColor,
      volumeBar: state.volumeBar,
      textStyle: state.textStyle,
      font: state.font,
      fontSub: state.fontSub,
      glow: state.glow,
      ui: { ...state.ui },
      ytStats: { ...(state.ytStats || {}) },
      igStats: { ...(state.igStats || {}) },
      igCaption: state.igCaption,
      igBrand: state.igBrand,
      playerMeta: { ...(state.playerMeta || {}) },
      playerColor: state.playerColor,
      customIcons: { ...(state.customIcons || {}) },
      exportSize: state.exportSize,
      exportFormat: state.exportFormat,
      maxMB: state.maxMB,
      lastPreset: state.lastPreset,
      credit: state.credit,
      title: state.title,
      subtitle: state.subtitle,
      footer: state.footer,
      subfooter: state.subfooter,
    };
  }

  function applySettings(s) {
    if (!s) return;
    Object.assign(state, {
      layout: s.layout ?? state.layout,
      ratio: s.ratio ?? state.ratio,
      theme: s.theme ?? state.theme,
      cols: s.cols ?? state.cols,
      bgMode: s.bgMode ?? state.bgMode,
      ghost: s.ghost ?? state.ghost,
      gap: s.gap ?? state.gap,
      radius: s.radius ?? state.radius,
      grain: s.grain ?? state.grain,
      light: s.light ?? state.light,
      lightStrength: s.lightStrength ?? state.lightStrength,
      lightColor: s.lightColor ?? state.lightColor,
      volumeBar: !!s.volumeBar,
      textStyle: s.textStyle ?? state.textStyle,
      font: s.font ?? state.font,
      fontSub: s.fontSub ?? state.fontSub,
      glow: !!s.glow,
      ui: s.ui ? { ...state.ui, ...s.ui } : state.ui,
      ytStats: s.ytStats ? { ...(state.ytStats || {}), ...s.ytStats } : state.ytStats,
      igStats: s.igStats ? { ...(state.igStats || {}), ...s.igStats } : state.igStats,
      igCaption: s.igCaption != null ? s.igCaption : state.igCaption,
      igBrand: s.igBrand != null ? s.igBrand : state.igBrand,
      playerMeta: s.playerMeta ? { ...(state.playerMeta || {}), ...s.playerMeta } : state.playerMeta,
      playerColor: s.playerColor != null ? s.playerColor : state.playerColor,
      customIcons: s.customIcons ? { ...(state.customIcons || {}), ...s.customIcons } : state.customIcons,
      exportSize: s.exportSize ?? state.exportSize,
      exportFormat: s.exportFormat ?? state.exportFormat,
      maxMB: s.maxMB != null ? s.maxMB : state.maxMB,
      lastPreset: s.lastPreset ?? state.lastPreset,
      credit: !!s.credit,
      title: s.title ?? state.title,
      subtitle: s.subtitle ?? state.subtitle,
      footer: s.footer ?? state.footer,
      subfooter: s.subfooter ?? state.subfooter,
    });
  }

  function syncControlsFromState() {
    const set = (el, val) => {
      if (el) el.value = val;
    };
    set(els.selRatio, state.ratio);
    set(els.selTheme, state.theme);
    set(els.selCols, state.cols);
    set(els.selBg, state.bgMode);
    set(els.rngGhost, Math.round(state.ghost * 100));
    set(els.selGap, state.gap);
    set(els.selRadius, state.radius);
    set(els.selGrain, state.grain);
    set(els.selLight, state.light);
    set(els.rngLight, Math.round(state.lightStrength * 100));
    set(els.inpTitle, state.title);
    set(els.inpSubtitle, state.subtitle);
    set(els.inpFooter, state.footer);
    set(els.inpSubfooter, state.subfooter);
    set(els.selTextStyle, state.textStyle);
    set(els.selFont, state.font);
    set(els.selFontSub, state.fontSub);
    set(els.selExport, state.exportSize);
    if (els.selExportFormat) set(els.selExportFormat, state.exportFormat || "jpg");
    if (els.inpMaxMB) els.inpMaxMB.value = state.maxMB ? String(state.maxMB) : "";
    els.chkGlow.checked = state.glow;
    els.chkCredit.checked = state.credit;
    els.chkSubs.checked = state.ui.subs;
    els.chkAutoplay.checked = state.ui.autoplay;
    els.chkLive.checked = state.ui.live;
    els.chkPlaying.checked = state.ui.playing;
    els.chkLiked.checked = state.ui.liked;
    if (els.chkCounts) els.chkCounts.checked = state.ui.showCounts !== false;
    if (els.inpYtLikes) els.inpYtLikes.value = (state.ytStats && state.ytStats.likes) || "";
    if (els.inpYtComments) els.inpYtComments.value = (state.ytStats && state.ytStats.comments) || "";
    if (els.inpYtReposts) els.inpYtReposts.value = (state.ytStats && state.ytStats.reposts) || "";
    if (els.selIconTheme) els.selIconTheme.value = state.ui.iconTheme || "twitter";
    // IG
    if (els.inpIgBrand) els.inpIgBrand.value = state.igBrand || "";
    if (els.inpIgUser) els.inpIgUser.value = state.title || "";
    if (els.inpIgLikes) els.inpIgLikes.value = (state.igStats && state.igStats.likes) || "";
    if (els.inpIgComments) els.inpIgComments.value = (state.igStats && state.igStats.comments) || "";
    if (els.inpIgReposts) els.inpIgReposts.value = (state.igStats && state.igStats.reposts) || "";
    if (els.inpIgShares) els.inpIgShares.value = (state.igStats && state.igStats.shares) || "";
    if (els.inpIgCaption) els.inpIgCaption.value = state.igCaption || "";
    // Player
    const pm = state.playerMeta || {};
    if (els.inpPlayerHeader) els.inpPlayerHeader.value = pm.header || "";
    if (els.inpPlayerTrack) els.inpPlayerTrack.value = pm.track || "";
    if (els.inpPlayerArtist) els.inpPlayerArtist.value = pm.artist || "";
    if (els.inpPlayerT1) els.inpPlayerT1.value = pm.timeLeft || "";
    if (els.inpPlayerT2) els.inpPlayerT2.value = pm.timeRight || "";
    if (els.inpPlayerColor) els.inpPlayerColor.value = state.playerColor || "#7c3aed";
    els.ghostValue.textContent = state.ghost.toFixed(2);
    els.lightValue.textContent = state.lightStrength.toFixed(2);
    els.ghostStrengthBlock.hidden = state.bgMode !== "ghost";
    const lcE=$("inp-light-color"); if(lcE) lcE.value=state.lightColor||"#fff5e0";
    const lhE=$("light-color-hex"); if(lhE) lhE.textContent=(state.lightColor||"#fff5e0").toUpperCase();
    document.querySelectorAll(".light-swatch").forEach(sw=>sw.classList.toggle("is-active",sw.dataset.color===state.lightColor));
    renderLayoutOptions();
  }

  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(collectSettings()));
      showToast("已记住当前设置");
    } catch {
      showToast("本地存储不可用", true);
    }
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      applySettings(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }

  /* ——— UI build ——— */
  function thumbSvg(rects) {
    return rects
      .map(([x, y, w, h]) => `<span style="left:${x}%;top:${y}%;width:${w}%;height:${h}%"></span>`)
      .join("");
  }

  function renderLayoutOptions() {
    els.layoutGrid.innerHTML = "";
    LAYOUTS.forEach((layout) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "layout-opt" + (state.layout === layout.id ? " is-active" : "");
      btn.title = `${layout.name} · ${layout.hint} · 可用于当前照片布局`;
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", state.layout === layout.id ? "true" : "false");
      btn.innerHTML = `<div class="layout-thumb">${thumbSvg(layout.thumb)}</div><span class="layout-name">${layout.name}</span><span class="layout-hint">${layout.hint}</span>`;
      btn.addEventListener("click", () => {
        if (state.layout !== layout.id) snapshot(`布局·${layout.name}`);
        state.layout = layout.id;
        state.lastPreset = "";
        syncPresetChips(null);
        renderLayoutOptions();
        softRender();
        updateTextAvailability();
      });
      els.layoutGrid.appendChild(btn);
    });
  }

  function bindTabs() {
    const presetPanel = $("preset-panel");
    document.querySelectorAll(".rail-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".rail-tab").forEach((t) => {
          t.classList.toggle("is-active", t === tab);
          t.setAttribute("aria-selected", t === tab ? "true" : "false");
        });
        document.querySelectorAll(".tab-pane").forEach((pane) => {
          const on = pane.id === `tab-${tab.dataset.tab}`;
          pane.classList.toggle("is-active", on);
          pane.hidden = !on;
        });
        if (presetPanel) presetPanel.hidden = tab.dataset.tab !== "look";
        render();
      });
    });
    if (presetPanel) presetPanel.hidden = !document.querySelector('.rail-tab[data-tab="look"].is-active');
  }

  function bindEditMode() {
    document.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.editMode = btn.dataset.mode;
        document.querySelectorAll(".mode-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
        els.editCrop.hidden = state.editMode !== "crop";
        els.editReorder.hidden = state.editMode !== "reorder";
        render();
      });
    });
  }

  function canvasPoint(e) {
    const rect = els.canvas.getBoundingClientRect();
    const scaleX = els.canvas.width / rect.width;
    const scaleY = els.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function hitSlot(x, y, slots) {
    // topmost: iterate reverse
    for (let i = slots.length - 1; i >= 0; i--) {
      const s = slots[i];
      if (s.cx != null) {
        const dx = x - s.cx;
        const dy = y - s.cy;
        if (dx * dx + dy * dy <= s.radius * s.radius) return i;
      } else if (s.poly) {
        if (pointInPoly(x, y, s.poly)) return i;
      } else {
        if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return i;
      }
    }
    return -1;
  }

  function pointInPoly(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i];
      const [xj, yj] = poly[j];
      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 0.0) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function bindCanvasPan() {
    const canvas = els.canvas;
    let viewPanDrag = null;

    // 空格键进入视口平移修饰
    window.addEventListener("keydown", (e) => {
      if (e.code !== "Space" && e.key !== " ") return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      state.spacePan = true;
      if (els.canvas) els.canvas.classList.add("can-pan-view");
      // 焦点在按钮/链接时不 preventDefault，避免抢走原生激活
      if (tag !== "BUTTON" && tag !== "A" && tag !== "LABEL") e.preventDefault();
    });
    window.addEventListener("keyup", (e) => {
      if (e.code !== "Space" && e.key !== " ") return;
      state.spacePan = false;
      if ((state.viewZoom || 1) <= 1.02 && els.canvas) els.canvas.classList.remove("can-pan-view");
    });

    canvas.addEventListener("contextmenu", (e) => {
      // 中键平移时避免菜单；右键不拦截
      if (e.button === 1) e.preventDefault();
    });

    canvas.addEventListener("pointerdown", (e) => {
      // 封面取色：单击预览像素 → 播放钮颜色
      if (state.colorPickMode && state.photos.length) {
        e.preventDefault();
        try {
          const pt = canvasPoint(e);
          const x = Math.max(0, Math.min(els.canvas.width - 1, Math.floor(pt.x)));
          const y = Math.max(0, Math.min(els.canvas.height - 1, Math.floor(pt.y)));
          const d = els.ctx.getImageData(x, y, 1, 1).data;
          const hex = "#" + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, "0")).join("");
          state.playerColor = hex;
          if (els.inpPlayerColor) els.inpPlayerColor.value = hex;
          if (els.eyedropTag) els.eyedropTag.textContent = `已取色 ${hex}`;
          if (window.__drawColorRing) window.__drawColorRing();
          state.colorPickMode = false;
          canvas.classList.remove("is-eyedrop");
          if (els.btnEyedrop) {
            els.btnEyedrop.textContent = "在封面图上取色";
            els.btnEyedrop.classList.remove("btn-primary");
          }
          render();
          showToast(`播放钮颜色已设为 ${hex}`);
        } catch (err) {
          console.error(err);
          state.colorPickMode = false;
          canvas.classList.remove("is-eyedrop");
          showToast("取色失败，请重试", true);
        }
        return;
      }

      // —— 视口平移优先：中键 / Alt+左键 / 空格+左键 / 放大后非裁剪模式左键 ——
      if (isViewPanEvent(e)) {
        e.preventDefault();
        const sc = viewportScroller();
        viewPanDrag = {
          x: e.clientX,
          y: e.clientY,
          sl: sc ? sc.scrollLeft : 0,
          st: sc ? sc.scrollTop : 0,
        };
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        canvas.classList.add("is-panning-view");
        return;
      }

      if (!state.photos.length || state.editMode !== "crop") return;
      const pt = canvasPoint(e);
      const idx = hitSlot(pt.x, pt.y, lastSlots);
      if (idx >= 0 && state.photos[idx]) {
        setActivePhoto(state.photos[idx].id);
      }
      const p = activePhoto();
      if (!p) return;
      snapshotThrottled("裁剪平移");
      const crop = ensureCrop(p);
      dragPan = {
        id: p.id,
        startX: e.clientX,
        startY: e.clientY,
        ox0: crop.ox,
        oy0: crop.oy,
        fine: e.shiftKey,
      };
      lightDrag = true;
      canvas.setPointerCapture(e.pointerId);
      canvas.classList.add("is-panning");
    });
    canvas.addEventListener("pointermove", (e) => {
      if (viewPanDrag) {
        const sc = viewportScroller();
        if (sc) {
          sc.scrollLeft = viewPanDrag.sl - (e.clientX - viewPanDrag.x);
          sc.scrollTop = viewPanDrag.st - (e.clientY - viewPanDrag.y);
        }
        return;
      }
      if (!dragPan) return;
      const p = state.photos.find((x) => x.id === dragPan.id);
      if (!p) return;
      const crop = ensureCrop(p);
      const scale = dragPan.fine ? 480 : 120;
      const dx = (e.clientX - dragPan.startX) / scale;
      const dy = (e.clientY - dragPan.startY) / scale;
      crop.ox = Math.max(-1, Math.min(1, dragPan.ox0 + dx));
      crop.oy = Math.max(-1, Math.min(1, dragPan.oy0 + dy));
      renderSoon();
    });
    const end = (e) => {
      if (viewPanDrag) {
        viewPanDrag = null;
        canvas.classList.remove("is-panning-view");
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        return;
      }
      if (!dragPan) return;
      dragPan = null;
      lightDrag = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      canvas.classList.remove("is-panning");
      render();
    };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    canvas.addEventListener("pointerleave", () => {
      // 空格松开后若焦点不在画布，去掉 grab
      if (!state.spacePan && (state.viewZoom || 1) <= 1.02) {
        canvas.classList.remove("can-pan-view");
      }
    });

    // 滚轮：
    // Ctrl/Cmd = 画布视图缩放
    // Shift = 当前选中图的裁剪缩放
    // 普通滚轮 = 所有照片的全局缩放
    canvas.addEventListener(
      "wheel",
      (e) => {
        if (!state.photos.length && !(e.ctrlKey || e.metaKey)) return;
        e.preventDefault();
        const step = e.deltaY > 0 ? -0.08 : 0.08;
        if (e.ctrlKey || e.metaKey) {
          setViewZoom((state.viewZoom || 1) + step);
          return;
        }
        if (!state.photos.length) return;
        if (e.shiftKey) {
          const p = activePhoto();
          if (!p) return;
          snapshotThrottled("滚轮缩放当前图");
          const crop = ensureCrop(p);
          crop.zoom = Math.max(1, Math.min(4, Math.round((crop.zoom + step) * 100) / 100));
          syncZoomUi();
          render();
          return;
        }
        setGlobalZoom((state.photoZoomAll || 1) + step);
      },
      { passive: false }
    );

    // 双击：在 1.0× 与 1.35× 之间切换该格照片
    canvas.addEventListener("dblclick", (e) => {
      if (!state.photos.length) return;
      const pt = canvasPoint(e);
      const idx = hitSlot(pt.x, pt.y, lastSlots);
      const p = idx >= 0 ? state.photos[idx] : activePhoto();
      if (!p) return;
      snapshot("双击缩放");
      state.activeId = p.id;
      const crop = ensureCrop(p);
      crop.zoom = crop.zoom > 1.05 ? 1 : 1.35;
      renderFilmstrip();
      syncZoomUi();
      render();
    });
  }

  function bindControls() {
    bindTabs();
    bindEditMode();
    bindCanvasPan();

    ["panel-ui-sim", "panel-ig-content", "panel-player-content"].forEach((id) => {
      const panel = $(id);
      const heading = panel?.querySelector(".panel-head");
      if (!panel || !heading || heading.querySelector(".panel-collapse")) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-ghost btn-sm panel-collapse";
      button.textContent = "收起";
      button.setAttribute("aria-expanded", "true");
      button.addEventListener("click", () => {
        const collapsed = panel.classList.toggle("is-collapsed");
        [...panel.children].forEach((child) => { if (child !== heading) child.hidden = collapsed; });
        button.textContent = collapsed ? "展开" : "收起";
        button.setAttribute("aria-expanded", String(!collapsed));
      });
      heading.appendChild(button);
    });

    if (els.btnTogglePresets && els.presetPanel) {
      els.btnTogglePresets.addEventListener("click", () => {
        const collapsed = els.presetPanel.classList.toggle("is-collapsed");
        els.btnTogglePresets.textContent = collapsed ? "展开" : "收起";
        els.btnTogglePresets.setAttribute("aria-expanded", String(!collapsed));
      });
    }
    if (els.btnFitView) {
      els.btnFitView.addEventListener("click", () => {
        resetViewZoom();
        const sc = viewportScroller();
        if (sc) { sc.scrollLeft = 0; sc.scrollTop = 0; }
        showToast("画布已适应窗口");
      });
    }
    if (els.btnResetAll) {
      els.btnResetAll.addEventListener("click", () => {
        snapshot("重置画布");
        resetZoomAll();
        resetAllCrops();
        resetViewZoom();
        showToast("已重置画布缩放与照片裁剪");
      });
    }

    els.dropzone.addEventListener("click", () => els.fileInput.click());
    els.dropzone.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        els.fileInput.click();
      }
    });
    els.fileInput.addEventListener("change", () => {
      addFiles(els.fileInput.files);
      els.fileInput.value = "";
    });

    ["dragenter", "dragover"].forEach((evt) => {
      els.dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        els.dropzone.classList.add("is-dragover");
      });
    });
    ["dragleave", "drop"].forEach((evt) => {
      els.dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        els.dropzone.classList.remove("is-dragover");
      });
    });
    els.dropzone.addEventListener("drop", (e) => {
      const files = e.dataTransfer?.files;
      if (files) addFiles(files);
    });

    const stage = document.querySelector(".stage");
    ["dragenter", "dragover"].forEach((eventName) => stage.addEventListener(eventName, (e) => {
      e.preventDefault();
      stage.classList.add("is-dragover");
    }));
    ["dragleave", "drop"].forEach((eventName) => stage.addEventListener(eventName, (e) => {
      e.preventDefault();
      stage.classList.remove("is-dragover");
    }));
    stage.addEventListener("drop", (e) => {
      const files = e.dataTransfer?.files;
      if (files) addFiles(files);
    });

    const bindSelect = (el, key, after) => {
      el.addEventListener("change", () => {
        snapshot(`设置·${key}`);
        state[key] = el.value;
        state.lastPreset = "";
        document.querySelectorAll(".preset-chip").forEach((chip) => {
          chip.classList.remove("is-active");
        });
        if (after) after();
        softRender();
      });
    };

    bindSelect(els.selRatio, "ratio", computePreviewSize);
    bindSelect(els.selTheme, "theme");
    bindSelect(els.selCols, "cols");
    bindSelect(els.selBg, "bgMode", () => {
      els.ghostStrengthBlock.hidden = state.bgMode !== "ghost";
    });
    bindSelect(els.selGap, "gap");
    bindSelect(els.selRadius, "radius");
    bindSelect(els.selGrain, "grain");
    bindSelect(els.selLight, "light");
    bindSelect(els.selTextStyle, "textStyle");
    bindSelect(els.selFont, "font");
    bindSelect(els.selFontSub, "fontSub");
    bindSelect(els.selExport, "exportSize", () => {
      const d = defaultMaxMB(state.exportSize);
      state.maxMB = d;
      if (els.inpMaxMB) els.inpMaxMB.value = d ? String(d) : "";
      updateExportPreflight();
    });
    if (els.selExportFormat) {
      els.selExportFormat.addEventListener("change", () => {
        snapshot("设置·format");
        state.exportFormat = els.selExportFormat.value === "png" ? "png" : "jpg";
        updateExportPreflight();
        renderSoon();
      });
    }
    if (els.inpMaxMB) {
      els.inpMaxMB.addEventListener("change", () => {
        const v = parseFloat(els.inpMaxMB.value);
        state.maxMB = Number.isFinite(v) && v > 0 ? v : 0;
        updateExportPreflight();
      });
    }

    const bindText = (el, key) => {
      el.addEventListener("focus", () => snapshotThrottled(`文字·${key}`));
      el.addEventListener("input", () => {
        state[key] = el.value;
        renderSoon();
      });
    };
    bindText(els.inpTitle, "title");
    bindText(els.inpSubtitle, "subtitle");
    bindText(els.inpFooter, "footer");
    bindText(els.inpSubfooter, "subfooter");

    els.rngGhost.addEventListener("pointerdown", () => snapshotThrottled("淡影浓度"));
    els.rngGhost.addEventListener("input", () => {
      state.ghost = Number(els.rngGhost.value) / 100;
      els.ghostValue.textContent = state.ghost.toFixed(2);
      lightDrag = true;
      renderSoon();
    });
    els.rngGhost.addEventListener("change", () => {
      lightDrag = false;
      render();
    });
    els.rngLight.addEventListener("pointerdown", () => snapshotThrottled("光效强度"));
    els.rngLight.addEventListener("input", () => {
      state.lightStrength = Number(els.rngLight.value) / 100;
      els.lightValue.textContent = state.lightStrength.toFixed(2);
      renderSoon();
    });

    const bindChk = (el, fn) => {
      el.addEventListener("change", () => {
        snapshot(`勾选·${el.id}`);
        fn(el.checked);
        render();
      });
    };
    bindChk(els.chkGlow, (v) => (state.glow = v));
    bindChk(els.chkCredit, (v) => (state.credit = v));
    bindChk(els.chkSubs, (v) => (state.ui.subs = v));
    bindChk(els.chkAutoplay, (v) => (state.ui.autoplay = v));
    bindChk(els.chkLive, (v) => (state.ui.live = v));
    bindChk(els.chkPlaying, (v) => (state.ui.playing = v));
    bindChk(els.chkLiked, (v) => (state.ui.liked = v));
    if (els.chkCounts) bindChk(els.chkCounts, (v) => {
      state.ui = { ...state.ui, showCounts: v };
      updateTextAvailability();
    });
    const bindYtCount = (el, key) => {
      if (!el) return;
      el.addEventListener("focus", () => snapshotThrottled("短视频计数"));
      el.addEventListener("input", () => {
        state.ytStats = { ...(state.ytStats || {}), [key]: el.value };
        renderSoon();
      });
    };
    bindYtCount(els.inpYtLikes, "likes");
    bindYtCount(els.inpYtComments, "comments");
    bindYtCount(els.inpYtReposts, "reposts");
    if (els.selIconTheme) {
      els.selIconTheme.addEventListener("change", () => {
        snapshot("设置·iconTheme");
        state.ui = { ...state.ui, iconTheme: els.selIconTheme.value || "twitter" };
        renderSoon();
      });
    }

    const bindIgText = (el, apply) => {
      if (!el) return;
      el.addEventListener("focus", () => snapshotThrottled("IG 内容"));
      el.addEventListener("input", () => {
        apply(el.value);
        renderSoon();
      });
    };
    bindIgText(els.inpIgBrand, (v) => (state.igBrand = v));
    bindIgText(els.inpIgUser, (v) => (state.title = v));
    bindIgText(els.inpIgLikes, (v) => (state.igStats = { ...state.igStats, likes: v }));
    bindIgText(els.inpIgComments, (v) => (state.igStats = { ...state.igStats, comments: v }));
    bindIgText(els.inpIgReposts, (v) => (state.igStats = { ...state.igStats, reposts: v }));
    bindIgText(els.inpIgShares, (v) => (state.igStats = { ...state.igStats, shares: v }));
    bindIgText(els.inpIgCaption, (v) => (state.igCaption = v));

    const bindPlText = (el, key) => {
      if (!el) return;
      el.addEventListener("focus", () => snapshotThrottled("播放器内容"));
      el.addEventListener("input", () => {
        state.playerMeta = { ...(state.playerMeta || {}), [key]: el.value };
        renderSoon();
      });
    };
    bindPlText(els.inpPlayerHeader, "header");
    bindPlText(els.inpPlayerTrack, "track");
    bindPlText(els.inpPlayerArtist, "artist");
    bindPlText(els.inpPlayerT1, "timeLeft");
    bindPlText(els.inpPlayerT2, "timeRight");
    if (els.inpPlayerColor) {
      els.inpPlayerColor.addEventListener("input", () => {
        state.playerColor = els.inpPlayerColor.value || "#7c3aed";
        drawColorRing();
        renderSoon();
      });
    }
    // 圆环取色盘
    const ringCanvas = $("color-ring");
    if (ringCanvas) {
      const ctx = ringCanvas.getContext("2d");
      const CX = 80, CY = 80, R_OUT = 78, R_IN = 52;
      function drawColorRing() {
        ctx.clearRect(0, 0, 160, 160);
        for (let a = 0; a < 360; a += 0.5) {
          const rad = (a - 90) * Math.PI / 180;
          ctx.beginPath();
          ctx.arc(CX, CY, (R_OUT + R_IN) / 2, rad, rad + Math.PI / 180);
          ctx.strokeStyle = `hsl(${a},100%,50%)`;
          ctx.lineWidth = R_OUT - R_IN;
          ctx.stroke();
        }
        const h = (state.playerColor || "#7c3aed").replace("#", "");
        const r = parseInt(h.substring(0,2),16)||0, g = parseInt(h.substring(2,4),16)||0, b = parseInt(h.substring(4,6),16)||0;
        const sw = $("color-ring-swatch"); if (sw) sw.style.background = state.playerColor || "#7c3aed";
        const hx = $("color-ring-hex"); if (hx) hx.textContent = (state.playerColor || "#7c3aed").toUpperCase();
        const or = $("rgbo-r"), og = $("rgbo-g"), ob = $("rgbo-b");
        if (or) or.textContent = r; if (og) og.textContent = g; if (ob) ob.textContent = b;
      }
      ringCanvas.addEventListener("click", (e) => {
        const rect = ringCanvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (160 / rect.width) - CX;
        const y = (e.clientY - rect.top) * (160 / rect.height) - CY;
        const dist = Math.sqrt(x * x + y * y);
        if (dist < R_IN - 4 || dist > R_OUT + 4) return;
        const hue = ((Math.atan2(y, x) * 180 / Math.PI) + 90 + 360) % 360;
        snapshotThrottled("圆环取色");
        state.playerColor = hslToHex(hue, 0.85, 0.55);
        if (els.inpPlayerColor) els.inpPlayerColor.value = state.playerColor;
        drawColorRing();
        renderSoon();
      });
      drawColorRing();
      window.__drawColorRing = drawColorRing;
    }
    // 灯光颜色
    const inpLC=$("inp-light-color"), lcHex=$("light-color-hex");
    function syncLightColor(){
      if(inpLC) inpLC.value=state.lightColor||"#fff5e0";
      if(lcHex) lcHex.textContent=(state.lightColor||"#fff5e0").toUpperCase();
      document.querySelectorAll(".light-swatch").forEach(sw=>sw.classList.toggle("is-active",sw.dataset.color===state.lightColor));
    }
    if(inpLC) inpLC.addEventListener("input",()=>{state.lightColor=inpLC.value;syncLightColor();renderSoon();});
    document.querySelectorAll(".light-swatch").forEach(sw=>{
      sw.addEventListener("click",()=>{snapshot("灯光颜色");state.lightColor=sw.dataset.color;syncLightColor();render();});
    });
    syncLightColor();

    // —— 封面取色：改播放钮颜色 ——
    const setPickMode = (on) => {
      state.colorPickMode = !!on;
      if (els.canvas) els.canvas.classList.toggle("is-eyedrop", !!on);
      if (els.btnEyedrop) {
        els.btnEyedrop.textContent = on ? "取消取色" : "在封面图上取色";
        els.btnEyedrop.classList.toggle("btn-primary", !!on);
      }
      if (els.eyedropTag) {
        els.eyedropTag.textContent = on ? "请在预览封面上单击…" : "点击预览中的颜色";
      }
    };
    if (els.btnEyedrop) {
      els.btnEyedrop.addEventListener("click", () => {
        if (state.layout !== "player") {
          showToast("请先选择「播放器」布局", true);
          return;
        }
        if (!state.photos.length) {
          showToast("请先添加封面照片", true);
          return;
        }
        setPickMode(!state.colorPickMode);
      });
    }

    // 自定义图标上传
    const iconSlots = [
      ["shuffle", "icon-shuffle"],
      ["prev", "icon-prev"],
      ["play", "icon-play"],
      ["next", "icon-next"],
      ["repeat", "icon-repeat"],
      ["heart", "icon-heart"],
    ];
    const updateIconTag = () => {
      if (!els.iconCustomTag) return;
      const n = Object.keys(state.customIcons || {}).length;
      els.iconCustomTag.textContent = n ? `自定义 ${n} 个` : "icon/ + 内置";
    };
    iconSlots.forEach(([key, id]) => {
      const input = $(id);
      if (!input) return;
      input.addEventListener("change", () => {
        const file = input.files && input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          snapshot("上传图标");
          state.customIcons = { ...(state.customIcons || {}), [key]: String(reader.result) };
          updateIconTag();
          render();
          showToast(`已载入图标：${key}`);
        };
        reader.readAsDataURL(file);
        input.value = "";
      });
    });
    if (els.btnResetIcons) {
      els.btnResetIcons.addEventListener("click", () => {
        snapshot("恢复内置图标");
        state.customIcons = {};
        updateIconTag();
        render();
        showToast("已恢复内置图标");
      });
    }
    updateIconTag();

    // crop controls
    els.btnZoomIn.addEventListener("click", () => setZoom(0.1));
    els.btnZoomOut.addEventListener("click", () => setZoom(-0.1));
    els.btnCropReset.addEventListener("click", () => resetCrop(activePhoto()));
    els.rngZoom.addEventListener("pointerdown", () => snapshotThrottled("裁剪缩放"));
    els.rngZoom.addEventListener("input", () => {
      const p = activePhoto();
      if (!p) return;
      ensureCrop(p).zoom = Math.max(1, Number(els.rngZoom.value) / 100);
      render();
    });
    els.rngZoom.addEventListener("change", () => {
      syncZoomUi();
      render();
    });

    if (els.stageZoomIn) els.stageZoomIn.addEventListener("click", () => setGlobalZoom((state.photoZoomAll || 1) + 0.1));
    if (els.stageZoomOut) els.stageZoomOut.addEventListener("click", () => setGlobalZoom((state.photoZoomAll || 1) - 0.1));
    if (els.stageZoomReset) els.stageZoomReset.addEventListener("click", resetZoomAll);
    if (els.viewZoomIn) els.viewZoomIn.addEventListener("click", () => setViewZoom((state.viewZoom || 1) + 0.1));
    if (els.viewZoomOut) els.viewZoomOut.addEventListener("click", () => setViewZoom((state.viewZoom || 1) - 0.1));
    if (els.viewZoomReset) els.viewZoomReset.addEventListener("click", () => {
      resetViewZoom();
      showToast("视图已 1:1");
    });
    els.rngOx.addEventListener("pointerdown", () => snapshotThrottled("裁剪偏移"));
    els.rngOx.addEventListener("input", () => {
      const p = activePhoto();
      if (!p) return;
      ensureCrop(p).ox = Number(els.rngOx.value) / 100;
      renderSoon();
    });
    els.rngOy.addEventListener("pointerdown", () => snapshotThrottled("裁剪偏移"));
    els.rngOy.addEventListener("input", () => {
      const p = activePhoto();
      if (!p) return;
      ensureCrop(p).oy = Number(els.rngOy.value) / 100;
      renderSoon();
    });

    els.btnMoveLeft.addEventListener("click", () => moveActive(-1));
    els.btnMoveRight.addEventListener("click", () => moveActive(1));
    els.btnSortName.addEventListener("click", sortByName);
    els.btnResetCrops.addEventListener("click", () => {
      resetAllCrops();
      showToast("已重置全部裁剪");
    });

    els.btnExport.addEventListener("click", exportJpg);
    els.btnExport2.addEventListener("click", exportJpg);
    els.btnClear.addEventListener("click", clearPhotos);
    els.btnShuffle.addEventListener("click", () => {
      if (state.photos.length < 2) {
        showToast("至少需要两张照片才能打乱");
        return;
      }
      shufflePhotos();
    });
    els.btnSaveSettings.addEventListener("click", saveSettings);
    if (els.btnUndo) els.btnUndo.addEventListener("click", undoOnce);
    if (els.btnRedo) els.btnRedo.addEventListener("click", redoOnce);

    window.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "e") {
        const tag = document.activeElement?.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
          e.preventDefault();
          exportJpg();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && e.shiftKey) {
        const tag = document.activeElement?.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
          e.preventDefault();
          redoOnce();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        const tag = document.activeElement?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        undoOnce();
        return;
      }
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      // Ctrl + 0 / ± = 画布视图缩放（无照片也可用）
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "0") {
          e.preventDefault();
          resetViewZoom();
          showToast("视图已 1:1");
          return;
        }
        if (e.key === "+" || e.key === "=") {
          e.preventDefault();
          setViewZoom((state.viewZoom || 1) + 0.1);
          return;
        }
        if (e.key === "-" || e.key === "_") {
          e.preventDefault();
          setViewZoom((state.viewZoom || 1) - 0.1);
          return;
        }
      }
      if (!state.photos.length) return;
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        if (e.shiftKey) setGlobalZoom((state.photoZoomAll || 1) + 0.1);
        else setZoom(0.1);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        if (e.shiftKey) setGlobalZoom((state.photoZoomAll || 1) - 0.1);
        else setZoom(-0.1);
      } else if (e.key === "0") {
        e.preventDefault();
        resetZoomAll();
      }
    });

    window.addEventListener("beforeunload", () => {
      const all = [...state.photos, ...(state.trash || [])];
      all.forEach((p) => {
        try {
          URL.revokeObjectURL(p.url);
        } catch {
          /* ignore */
        }
      });
    });

    els.btnTextRemember.addEventListener("click", () => {
      const payload = {
        title: state.title,
        subtitle: state.subtitle,
        footer: state.footer,
        subfooter: state.subfooter,
        textStyle: state.textStyle,
        font: state.font,
        fontSub: state.fontSub,
        glow: state.glow,
      };
      localStorage.setItem(TEXT_MEMORY_KEY, JSON.stringify(payload));
      showToast("文字设置已记住");
    });
    els.btnTextRecall.addEventListener("click", () => {
      try {
        const raw = localStorage.getItem(TEXT_MEMORY_KEY);
        if (!raw) {
          showToast("还没有记住的文字设置");
          return;
        }
        const s = JSON.parse(raw);
        applySettings(s);
        syncControlsFromState();
        render();
        showToast("已调用文字设置");
      } catch {
        showToast("调用失败", true);
      }
    });
    els.btnTextReset.addEventListener("click", () => {
      state.title = "";
      state.subtitle = "";
      state.footer = "";
      state.subfooter = "";
      state.glow = false;
      state.textStyle = "head-footer";
      syncControlsFromState();
      render();
      showToast("文字已重置");
    });

    window.addEventListener("resize", () => {
      computePreviewSize();
      render();
    });
  }

  function cacheEls() {
    els.fileInput = $("file-input");
    els.dropzone = $("dropzone");
    els.filmstrip = $("filmstrip");
    els.filmstripSort = $("filmstrip-sort");
    els.filmActions = $("film-actions");
    els.photoEditPanel = $("photo-edit-panel");
    els.editCrop = $("edit-crop");
    els.editReorder = $("edit-reorder");
    els.layoutGrid = $("layout-grid");
    els.selRatio = $("sel-ratio");
    els.selTheme = $("sel-theme");
    els.selCols = $("sel-cols");
    els.selBg = $("sel-bg");
    els.rngGhost = $("rng-ghost");
    els.ghostValue = $("ghost-value");
    els.ghostStrengthBlock = $("ghost-strength-block");
    els.selGap = $("sel-gap");
    els.selRadius = $("sel-radius");
    els.selGrain = $("sel-grain");
    els.selLight = $("sel-light");
    els.rngLight = $("rng-light");
    els.lightValue = $("light-value");
    els.inpTitle = $("inp-title");
    els.inpSubtitle = $("inp-subtitle");
    els.inpFooter = $("inp-footer");
    els.inpSubfooter = $("inp-subfooter");
    els.selTextStyle = $("sel-text-style");
    els.selFont = $("sel-font");
    els.selFontSub = $("sel-font-sub");
    els.chkGlow = $("chk-glow");
    els.chkSubs = $("chk-subs");
    els.chkAutoplay = $("chk-autoplay");
    els.chkLive = $("chk-live");
    els.chkPlaying = $("chk-playing");
    els.chkLiked = $("chk-liked");
    els.chkCounts = $("chk-counts");
    els.inpYtLikes = $("inp-yt-likes");
    els.inpYtComments = $("inp-yt-comments");
    els.inpYtReposts = $("inp-yt-reposts");
    els.selIconTheme = $("sel-icon-theme");
    els.inpIgBrand = $("inp-ig-brand");
    els.inpIgUser = $("inp-ig-user");
    els.inpIgLikes = $("inp-ig-likes");
    els.inpIgComments = $("inp-ig-comments");
    els.inpIgReposts = $("inp-ig-reposts");
    els.inpIgShares = $("inp-ig-shares");
    els.inpIgCaption = $("inp-ig-caption");
    els.inpPlayerHeader = $("inp-player-header");
    els.inpPlayerTrack = $("inp-player-track");
    els.inpPlayerArtist = $("inp-player-artist");
    els.inpPlayerT1 = $("inp-player-t1");
    els.inpPlayerT2 = $("inp-player-t2");
    els.inpPlayerColor = $("inp-player-color");
    els.btnEyedrop = $("btn-eyedrop");
    els.eyedropTag = $("eyedrop-tag");
    els.btnResetIcons = $("btn-reset-icons");
    els.iconCustomTag = $("icon-custom-tag");
    els.selExport = $("sel-export");
    els.selExportFormat = $("sel-export-format");
    els.inpMaxMB = $("inp-max-mb");
    els.metaFormat = $("meta-format");
    els.metaUpscale = $("meta-upscale");
    els.metaFilename = $("meta-filename");
    els.metaLast = $("meta-last");
    els.chkCredit = $("chk-credit");
    els.btnExport = $("btn-export");
    els.btnExport2 = $("btn-export-2");
    els.btnClear = $("btn-clear");
    els.btnShuffle = $("btn-shuffle");
    els.btnUndo = $("btn-undo");
    els.btnRedo = $("btn-redo");
    els.btnSaveSettings = $("btn-save-settings");
    els.btnTogglePresets = $("btn-toggle-presets");
    els.presetPanel = $("preset-panel");
    els.photoSummary = $("photo-summary");
    els.photoCount = $("photo-count");
    els.photoSizeSummary = $("photo-size-summary");
    els.canvasMode = $("canvas-mode");
    els.btnFitView = $("btn-fit-view");
    els.btnResetAll = $("btn-reset-all");
    els.btnTextRemember = $("btn-text-remember");
    els.btnTextRecall = $("btn-text-recall");
    els.btnTextReset = $("btn-text-reset");
    els.btnZoomIn = $("btn-zoom-in");
    els.btnZoomOut = $("btn-zoom-out");
    els.btnCropReset = $("btn-crop-reset");
    els.rngZoom = $("rng-zoom");
    els.rngOx = $("rng-ox");
    els.rngOy = $("rng-oy");
    els.zoomValue = $("zoom-value");
    els.btnMoveLeft = $("btn-move-left");
    els.btnMoveRight = $("btn-move-right");
    els.btnSortName = $("btn-sort-name");
    els.btnResetCrops = $("btn-reset-crops");
    els.activePhotoLabel = $("active-photo-label");
    els.canvas = $("preview");
    els.stageInner = document.querySelector(".stage-inner");
    els.emptyState = $("empty-state");
    els.metaSize = $("meta-size");
    els.metaCount = $("meta-count");
    els.statusText = $("status-text");
    els.statusDetail = $("status-detail");
    els.stageZoom = $("stage-zoom");
    els.stageZoomVal = $("stage-zoom-val");
    els.stageZoomIn = $("stage-zoom-in");
    els.stageZoomOut = $("stage-zoom-out");
    els.stageZoomReset = $("stage-zoom-reset");
    els.viewZoomVal = $("view-zoom-val");
    els.viewZoomIn = $("view-zoom-in");
    els.viewZoomOut = $("view-zoom-out");
    els.viewZoomReset = $("view-zoom-reset");
    els.toast = $("toast");
    els.ctx = els.canvas.getContext("2d");
  }

  function init() {
    cacheEls();
    state.trash = state.trash || [];
    loadSettings();
    renderPresetPanels();
    renderLayoutOptions();
    syncControlsFromState();
    bindControls();
    preloadBuiltinIcons();
    if (els.btnUndo) els.btnUndo.disabled = true;
    if (els.btnRedo) els.btnRedo.disabled = true;
    computePreviewSize();
    render();
    applyViewZoom();
    updateTextAvailability();
    if (state.lastPreset && PRESETS[state.lastPreset]) syncPresetChips(state.lastPreset);
    loadSamplePhoto().then(() => { if (!state.photos.length) render(); });
    window.__collageDebug = {
      resolveExportDimensions,
      buildExportBasename,
      sourceLongEdge,
      defaultMaxMB,
      estimateSlotLong,
      getSnapshot: () => ({
        layout: state.layout,
        ratio: state.ratio,
        exportSize: state.exportSize,
        exportFormat: state.exportFormat,
        maxMB: state.maxMB,
        lastPreset: state.lastPreset,
        photoCount: state.photos.length,
        srcLong: sourceLongEdge(),
        dim: resolveExportDimensions(),
        slotLong: estimateSlotLong(resolveExportDimensions().w, resolveExportDimensions().h),
      }),
      getState: () => ({
        layout: state.layout,
        photoCount: state.photos.length,
        photoZoomAll: state.photoZoomAll,
        viewZoom: state.viewZoom,
        spacePan: state.spacePan,
        playerProgress: playerProgressFromTimes(
          state.playerMeta?.timeLeft,
          state.playerMeta?.timeRight,
          state.ui?.live
        ),
        playerTimes: {
          t1: state.playerMeta?.timeLeft || "",
          t2: state.playerMeta?.timeRight || "",
        },
        activeId: state.activeId,
        activeCrop: activePhoto() ? { ...(activePhoto().crop || {}) } : null,
        editMode: state.editMode,
        scroll: (() => {
          const sc = viewportScroller();
          return sc
            ? {
                left: sc.scrollLeft,
                top: sc.scrollTop,
                sw: sc.scrollWidth,
                sh: sc.scrollHeight,
                cw: sc.clientWidth,
                ch: sc.clientHeight,
              }
            : null;
        })(),
        textDisabled: {
          textStyle: !!document.getElementById("sel-text-style")?.disabled,
          subtitle: !!document.getElementById("inp-subtitle")?.disabled,
          footer: !!document.getElementById("inp-footer")?.disabled,
          subfooter: !!document.getElementById("inp-subfooter")?.disabled,
          fontSub: !!document.getElementById("sel-font-sub")?.disabled,
          uiSim: !!document.getElementById("chk-subs")?.disabled,
          iconTheme: !!document.getElementById("sel-icon-theme")?.disabled,
        },
      }),
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
