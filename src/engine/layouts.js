import { GAP, RADIUS, RATIOS } from "./constants.js";

export function gapPx(state, W, H) {
  const base = Math.min(W, H);
  const raw = GAP[state.gap] ?? GAP.standard;
  return Math.round(raw * (base / 800));
}

export function radiusPx(state, W, H) {
  const base = Math.min(W, H);
  const raw = RADIUS[state.radius] ?? RADIUS.soft;
  return Math.round(raw * (base / 800));
}

export function colCountFor(state, n) {
  if (state.cols !== "auto") {
    const c = parseInt(state.cols, 10);
    if (c >= 4 && c <= 7) return Math.min(c, Math.max(1, n));
  }
  return n <= 4 ? 2 : n <= 9 ? 3 : n <= 16 ? 4 : 5;
}

export function hashRand(i, seed) {
  const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function layoutGridEqual(photos, W, H, g, cols) {
  const n = photos.length || 1;
  const c = cols || 2;
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

function layoutDiagonal(photos, W, H) {
  const n = Math.min(photos.length, 6);
  if (n === 0) return [];
  if (n === 1) return [{ x: 0, y: 0, w: W, h: H }];
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
  const band = [];
  for (let i = 0; i < n; i++) {
    const x0 = (i / n) * (W + H) - H;
    const x1 = ((i + 1) / n) * (W + H) - H;
    band.push({
      x: 0,
      y: 0,
      w: W,
      h: H,
      poly: [[x0 + H, 0], [x1 + H, 0], [x1, H], [x0, H]],
    });
  }
  return band;
}

function layoutStrip4(photos, W, H, g) {
  const n = Math.min(Math.max(photos.length, 1), 4);
  const ch = (H - g * (n - 1)) / n;
  return photos.slice(0, 4).map((_, i) => ({
    x: 0,
    y: i * (ch + g),
    w: W,
    h: ch,
    film: true,
  }));
}

function layoutHLine(photos, W, H, g) {
  const n = Math.max(1, photos.length);
  const ch = (H - g * (n - 1)) / n;
  return photos.map((_, i) => ({ x: 0, y: i * (ch + g), w: W, h: ch }));
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
    return [{ x: W / 2 - r, y: H / 2 - r, w: r * 2, h: r * 2, clip: "circle", cx: W / 2, cy: H / 2, radius: r }];
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

function layoutIgPost(photos, W, H) {
  const n = photos.length;
  if (n === 0) return [];
  const pad = W * 0.08;
  const top = H * 0.12;
  const areaW = W - pad * 2;
  const areaH = H * 0.62;
  if (n === 1) return [{ x: pad, y: top, w: areaW, h: areaH, polaroid: true }];
  const cols = n <= 2 ? 2 : n <= 4 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  const g = W * 0.03;
  const cw = (areaW - g * (cols - 1)) / cols;
  const ch = (areaH - g * (rows - 1)) / rows;
  return photos.map((_, i) => ({
    x: pad + (i % cols) * (cw + g),
    y: top + Math.floor(i / cols) * (ch + g),
    w: cw,
    h: ch,
  }));
}

export function computeSlots(state, photos, W, H, g) {
  const cols = colCountFor(state, photos.length || 1);
  switch (state.layout) {
    case "mosaic":
      return layoutMosaic(photos, W, H, g);
    case "contact":
    case "grid":
    case "sns":
    case "split":
      return layoutGridEqual(photos, W, H, g, cols);
    case "ig-post":
      return layoutIgPost(photos, W, H);
    case "editorial":
      return layoutEditorial(photos, W, H, g);
    case "diagonal":
      return layoutDiagonal(photos, W, H);
    case "strip4":
      return layoutStrip4(photos, W, H, g);
    case "vline":
      return layoutGridEqual(photos, W, H, g, Math.max(photos.length, 1));
    case "hline":
      return layoutHLine(photos, W, H, g);
    case "polaroid":
      return layoutPolaroid(photos, W, H);
    case "scrapbook":
      return layoutScrapbook(photos, W, H);
    case "circle":
      return layoutCircle(photos, W, H);
    case "yt-short":
    case "player":
    case "type":
      return photos.length ? [{ x: 0, y: 0, w: W, h: H, fullBleed: true }] : [];
    case "yt-panel": {
      if (!photos.length) return [];
      const mainH = H * 0.58;
      const panelY = mainH + g;
      const panelH = H - panelY;
      const slots = [{ x: 0, y: 0, w: W, h: mainH, fullBleed: true }];
      const rest = photos.slice(1);
      if (!rest.length) return slots;
      const n = Math.min(rest.length, 4);
      const tw = (W - g * (n - 1)) / n;
      const th = panelH * 0.55;
      for (let i = 0; i < n; i++) {
        slots.push({ x: i * (tw + g), y: panelY + panelH * 0.08, w: tw, h: th });
      }
      return slots;
    }
    default:
      return layoutMosaic(photos, W, H, g);
  }
}

export function previewSize(state, maxW, maxH) {
  const ratio = RATIOS[state.ratio] || 1;
  let w, h;
  if (ratio >= 1) {
    w = Math.max(240, Math.floor(Math.min(maxW, maxH * ratio)));
    h = Math.floor(w / ratio);
  } else {
    h = Math.max(240, Math.floor(Math.min(maxH, maxW / ratio)));
    w = Math.floor(h * ratio);
  }
  return { w: Math.round(w), h: Math.round(h) };
}
