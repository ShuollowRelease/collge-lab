import {
  THEMES,
  FONTS,
  SIG_FONTS,
  RATIOS,
  IG_CHROME,
  PLAYER_CHROME,
  PLAYER_ACCENT,
  PLAYER_MINOR_ICON_RATIO,
  SIG_ANCHORS,
  SIG_DEFAULT_FREE_POINT,
  SIGNATURE_IMAGE_HEIGHT_RATIO,
  DEFAULT_IG_STATS,
  DEFAULT_PLAYER_META,
  DEFAULT_PLAYER_PROGRESS,
  DEFAULT_PLAYER_BUFFERED,
  DEFAULT_VIDEO_PROGRESS,
  normalizeProgressTrackWidth,
  YT_LONG_CHROME,
  YT_SHORT_CHROME,
  YT_ACCENT,
} from "./constants.js";
import { computeSlots, gapPx, radiusPx, hashRand } from "./layouts.js";
import { pathShape, hasShape } from "./shapes.js";
import { freeformInsetPolygon } from "./freeform.js";
import { ICON_FILL, ICON_STROKE, drawIcon24 } from "./icons.js";
import { resolveLayoutCapabilities } from "./presets.js";

export function themeOf(state) {
  return THEMES[state.theme] || THEMES.dark;
}

export function fontStack(key) {
  return FONTS[key]?.display || FONTS.gothic.display;
}

export function fontWeight(key) {
  return FONTS[key]?.weight || "600";
}

/** 将独立的轨道宽度设置转换为 0–1 比例；播放进度与缓冲进度不参与计算。 */
function progressTrackRatio(state, fallbackRatio) {
  const configured = Number(state.ui?.progressTrackWidth);
  if (!Number.isFinite(configured)) return fallbackRatio;
  return normalizeProgressTrackWidth(configured) / 100;
}

function capabilitiesOf(state) {
  return resolveLayoutCapabilities(state);
}

function hasPlayerDuration(state) {
  return String(state.playerMeta?.timeRight ?? "").trim().length > 0;
}

export function roundedPath(c, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath();
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}

/**
 * 把图片按「填满」或「完整显示」画进目标矩形。
 * @param {"cover"|"contain"} [fit] cover 裁切填满；contain 等比缩放到完整可见
 */
export function drawCover(c, state, img, x, y, w, h, r, crop, fit = "cover") {
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
  if (fit === "contain") {
    // 完整显示：取较小缩放比，另一方向留白
    if (ir > tr) {
      dw = w;
      dh = w / ir;
    } else {
      dh = h;
      dw = h * ir;
    }
  } else if (ir > tr) {
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

function drawCoverCircle(c, state, img, cx, cy, radius, crop) {
  c.save();
  c.beginPath();
  c.arc(cx, cy, radius, 0, Math.PI * 2);
  c.clip();
  drawCover(c, state, img, cx - radius, cy - radius, radius * 2, radius * 2, 0, crop);
  c.restore();
}

function hexToRgba(hex, alpha) {
  const h = String(hex || "").replace("#", "");
  const full = h.length === 3 ? h.split("").map((ch) => ch + ch).join("") : h;
  const n = parseInt(full || "000000", 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function makeGrain() {
  const cv = document.createElement("canvas");
  cv.width = 128;
  cv.height = 128;
  const g = cv.getContext("2d");
  const img = g.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 28;
  }
  g.putImageData(img, 0, 0);
  return cv;
}

function makePaper() {
  const cv = document.createElement("canvas");
  cv.width = 128;
  cv.height = 128;
  const p = cv.getContext("2d");
  p.fillStyle = "#c4b89a";
  p.fillRect(0, 0, 128, 128);
  p.globalAlpha = 0.12;
  for (let i = 0; i < 1200; i++) {
    p.fillStyle = Math.random() > 0.5 ? "#8a7a5c" : "#e8dcc0";
    p.fillRect(Math.random() * 128, Math.random() * 128, 1.5, 1.5);
  }
  return cv;
}

let grainCanvas = null;
let paperCanvas = null;

function applyTexture(c, state, W, H) {
  if (!capabilitiesOf(state).texture) return;
  const mode = state.grain;
  if (mode === "none") return;
  if (!grainCanvas) grainCanvas = makeGrain();
  if (!paperCanvas) paperCanvas = makePaper();
  if (mode === "grain" || mode === "both") {
    const pat = c.createPattern(grainCanvas, "repeat");
    if (pat) {
      c.save();
      c.globalAlpha = mode === "both" ? 0.35 : 0.5;
      c.fillStyle = pat;
      c.fillRect(0, 0, W, H);
      c.restore();
    }
  }
  if (mode === "paper" || mode === "both") {
    const pat = c.createPattern(paperCanvas, "repeat");
    if (pat) {
      c.save();
      c.globalAlpha = mode === "both" ? 0.12 : 0.18;
      c.globalCompositeOperation = "multiply";
      c.fillStyle = pat;
      c.fillRect(0, 0, W, H);
      c.restore();
    }
  }
}

function applyLight(c, state, W, H, th) {
  if (!capabilitiesOf(state).light) return;
  const kind = state.light;
  if (!kind || kind === "none") return;
  const a = Math.max(0, Math.min(1, state.lightStrength ?? 0.45));
  const color = state.lightColor || "#fff5e0";
  if (kind === "warm") {
    const g = c.createRadialGradient(W * 0.35, H * 0.25, 10, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
    g.addColorStop(0, hexToRgba(color, 0.28 * a + 0.08));
    g.addColorStop(1, hexToRgba("#000000", 0));
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  } else if (kind === "cool") {
    const g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, hexToRgba("#6b9fd4", 0.2 * a + 0.05));
    g.addColorStop(1, hexToRgba(th.bg, 0.15));
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  } else if (kind === "vignette") {
    const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.72);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, `rgba(0,0,0,${0.35 + a * 0.35})`);
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  } else if (kind === "softbox") {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, hexToRgba(color, 0.18 * a + 0.04));
    g.addColorStop(0.45, "rgba(255,255,255,0)");
    g.addColorStop(1, "rgba(0,0,0,0.18)");
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  }
}

function drawBackground(c, state, W, H, th) {
  if (state.bgMode === "photo" && state.photos.length) {
    const img = state.photos[0].img;
    if (img) {
      c.save();
      c.globalAlpha = 0.22 + (state.ghost ?? 0.35) * 0.35;
      drawCover(c, state, img, 0, 0, W, H, 0, state.photos[0].crop);
      c.restore();
      c.fillStyle = hexToRgba(th.bg, 0.55);
      c.fillRect(0, 0, W, H);
      return;
    }
  }
  if (state.bgMode === "gradient") {
    const g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, th.bg);
    g.addColorStop(1, th.card);
    c.fillStyle = g;
  } else {
    c.fillStyle = th.bg;
  }
  c.fillRect(0, 0, W, H);
}

function drawPolaroidFrame(c, th, slot) {
  const pad = Math.min(slot.w, slot.h) * 0.06;
  const bottom = pad * 2.1;
  c.save();
  if (slot.rot) {
    const cx = slot.x + slot.w / 2;
    const cy = slot.y + slot.h / 2;
    c.translate(cx, cy);
    c.rotate(slot.rot);
    c.translate(-cx, -cy);
  }
  c.fillStyle = th.card === "#ffffff" ? "#f7f4ec" : "#f4efe4";
  c.shadowColor = "rgba(0,0,0,0.28)";
  c.shadowBlur = 18;
  c.shadowOffsetY = 8;
  roundedPath(c, slot.x, slot.y, slot.w, slot.h + bottom, 4);
  c.fill();
  c.restore();
}

function paintSlots(c, state, W, H, photos, slots, th, r) {
  photos.forEach((photo, i) => {
    const slot = slots[i];
    if (!slot || !photo?.img) return;
    if (slot.polaroid) drawPolaroidFrame(c, th, slot);

    c.save();
    if (slot.rot) {
      const cx = slot.x + slot.w / 2;
      const cy = slot.y + slot.h / 2;
      c.translate(cx, cy);
      c.rotate(slot.rot);
      c.translate(-cx, -cy);
    }

    if (slot.clip === "circle") {
      drawCoverCircle(c, state, photo.img, slot.cx, slot.cy, slot.radius, photo.crop);
    } else if (hasShape(slot.shape)) {
      // 形状蒙版：形状圈定可见区域，图片按 rect 填满或完整显示
      c.save();
      c.beginPath();
      if (pathShape(c, slot.shape, { x: slot.x, y: slot.y, w: slot.w, h: slot.h })) {
        c.clip();
        drawCover(c, state, photo.img, slot.x, slot.y, slot.w, slot.h, 0, photo.crop, slot.fit);
      }
      c.restore();
    } else if (slot.poly) {
      c.beginPath();
      slot.poly.forEach(([x, y], idx) => (idx ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.closePath();
      c.clip();
      drawCover(c, state, photo.img, slot.x, slot.y, slot.w, slot.h, 0, photo.crop, slot.fit);
    } else {
      const rr = slot.polaroid ? Math.min(4, r * 0.35) : r;
      const pad = slot.polaroid ? Math.min(slot.w, slot.h) * 0.06 : 0;
      const bottom = slot.polaroid ? pad * 2.1 : 0;
      drawCover(
        c,
        state,
        photo.img,
        slot.x + pad,
        slot.y + pad,
        slot.w - pad * 2,
        slot.h + bottom - pad * 2 - (slot.polaroid ? bottom * 0.35 : 0),
        rr,
        photo.crop
      );
    }

    if (state.activeId && photo.id === state.activeId) {
      c.restore();
      return;
    }
    c.restore();
  });
}

function drawText(c, state, W, H, th) {
  if (!capabilitiesOf(state).text) return;
  const style = state.textStyle;
  const ff = fontStack(state.font);
  const fw = fontWeight(state.font);
  const fs = Math.max(14, Math.min(W, H) * 0.045);
  const title = state.title || "";
  const subtitle = state.subtitle || "";
  const footer = state.footer || "";
  const subfooter = state.subfooter || "";

  const paint = (text, x, y, size, color, align = "left", family = ff, weight = fw, glow = false) => {
    if (!text) return;
    c.save();
    c.font = `${weight} ${size}px ${family}`;
    c.textAlign = align;
    c.textBaseline = "alphabetic";
    if (glow || state.glow) {
      c.shadowColor = hexToRgba(th.accent, 0.55);
      c.shadowBlur = size * 0.22;
    }
    c.fillStyle = color;
    const lines = String(text).split("\n").slice(0, 3);
    lines.forEach((line, i) => c.fillText(line, x, y + i * size * 1.12));
    c.restore();
  };

  if (style === "center") {
    paint(title, W / 2, H * 0.52, fs * 1.35, th.ink, "center", fontStack(state.font), fontWeight(state.font), true);
  } else if (style === "top") {
    paint(title, W * 0.08, H * 0.14, fs * 1.15, th.ink);
    paint(subtitle, W * 0.92, H * 0.12, fs * 0.72, th.sub, "right", fontStack(state.fontSub));
  } else if (style === "edition") {
    paint(title, W * 0.08, H * 0.12, fs * 1.2, th.ink);
    paint(subtitle, W * 0.08, H * 0.12 + fs * 0.95, fs * 0.7, th.sub, "left", fontStack(state.fontSub));
    paint(footer, W * 0.08, H * 0.92, fs * 0.72, th.sub, "left", fontStack(state.fontSub));
    paint(subfooter, W * 0.92, H * 0.92, fs * 0.65, th.sub, "right", fontStack(state.fontSub));
  } else {
    // head-footer
    paint(title, W * 0.08, H * 0.12, fs * 1.15, th.ink);
    paint(subtitle, W * 0.92, H * 0.12, fs * 0.7, th.sub, "right", fontStack(state.fontSub));
    paint(footer, W * 0.08, H * 0.93, fs * 0.75, th.sub, "left", fontStack(state.fontSub));
    paint(subfooter, W * 0.92, H * 0.93, fs * 0.68, th.sub, "right", fontStack(state.fontSub));
  }
}

function drawSignature(c, state, W, H, th, image = null) {
  const sig = state.signature;
  if (!capabilitiesOf(state).signature || !sig?.enabled || (!sig.text && !sig.imageData && !sig.imageAsset)) return;
  const base = Math.min(W, H);
  const size = Math.max(12, base * (sig.size ?? 0.08));
  const customFont = sig.customFont?.family ? { display: `"${sig.customFont.family}", cursive`, weight: "400" } : null;
  const font = customFont || SIG_FONTS[sig.font] || SIG_FONTS.script;
  const opacity = sig.opacity ?? 0.72;
  const rotate = ((sig.rotate ?? -6) * Math.PI) / 180;

  const anchor = SIG_ANCHORS[sig.pos];
  let x = anchor ? W * anchor[0] : W * (sig.x ?? SIG_DEFAULT_FREE_POINT[0]);
  let y = anchor ? H * anchor[1] : H * (sig.y ?? SIG_DEFAULT_FREE_POINT[1]);

  c.save();
  c.translate(x, y);
  c.rotate(rotate);
  c.globalAlpha = opacity;
  c.font = `${font.weight} ${size}px ${font.display}`;
  c.fillStyle = sig.color === "accent" || sig.effect === "ink" ? th.accent : th.ink;
  if (sig.effect === "soft") {
    c.shadowColor = "rgba(0,0,0,0.35)";
    c.shadowBlur = size * 0.18;
  } else if (sig.effect === "glow") {
    c.shadowColor = hexToRgba(th.accent, 0.75);
    c.shadowBlur = size * 0.28;
  }
  c.textAlign = ["bl", "ml", "tl"].includes(sig.pos)
    ? "left"
    : ["bc", "tc", "c"].includes(sig.pos)
      ? "center"
      : "right";
  c.textBaseline = "middle";
  if (image?.complete && image.naturalWidth) {
    const imageHeight = size * SIGNATURE_IMAGE_HEIGHT_RATIO;
    const imageWidth = imageHeight * (image.naturalWidth / Math.max(1, image.naturalHeight));
    c.drawImage(image, -imageWidth / 2, -imageHeight / 2, imageWidth, imageHeight);
  } else if (sig.text) {
    c.fillText(sig.text, 0, 0);
  }
  c.restore();
}

const FREEFORM_STITCH_DASH = {
  solid: [],
  dashed: [10, 7],
  dotted: [2, 6],
};

function freeformPolygonPath(c, points) {
  if (!Array.isArray(points) || points.length < 3) return false;
  c.beginPath();
  points.forEach(([x, y], index) => (index ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  return true;
}

function freeformSeamColor(th, token) {
  return {
    background: th.bg,
    foreground: th.ink,
    accent: th.accent,
    card: th.card,
    muted: th.sub,
  }[token] || th.bg;
}

function paintFreeformSlots(c, state, W, H, photos, slots, th) {
  const graph = state.customGrid?.freeform || {};
  const seam = graph.seam || {};
  const gapInset = seam.mode === "gap" ? Math.max(0, Number(seam.width || 0) * Math.min(W, H) * 0.5) : 0;
  slots.forEach((slot, index) => {
    if (!slot?.freeform || !slot.poly?.length) return;
    const photo = photos.find((item) => item.id === (slot.sourceId || slot.photoId)) || photos[index] || photos[0];
    if (!photo?.img) return;
    const polygon = gapInset ? freeformInsetPolygon(slot.poly, gapInset) : slot.poly;
    c.save();
    if (!freeformPolygonPath(c, polygon)) {
      c.restore();
      return;
    }
    c.clip();
    if (slot.imageMode === "shared") {
      drawCover(c, state, photo.img, 0, 0, W, H, 0, slot.crop || photo.crop, slot.fit || "cover");
    } else {
      drawCover(c, state, photo.img, slot.x, slot.y, slot.w, slot.h, 0, slot.crop || photo.crop, slot.fit || "cover");
    }
    c.restore();
  });
}

function paintFreeformSeams(c, state, W, H, th, slots) {
  const graph = state.customGrid?.freeform || {};
  const seam = graph.seam || {};
  if (seam.mode !== "stitch") return;
  const geo = slots.find((slot) => slot?.freeformGeometry)?.freeformGeometry;
  if (!geo?.sharedEdges?.length) return;
  c.save();
  c.strokeStyle = freeformSeamColor(th, seam.color);
  c.globalAlpha = Math.max(0, Math.min(1, Number(seam.opacity ?? 1)));
  c.lineWidth = Math.max(1, Number(seam.width || 0.012) * Math.min(W, H));
  c.lineCap = seam.style === "dotted" ? "round" : "butt";
  c.setLineDash(FREEFORM_STITCH_DASH[seam.style] || FREEFORM_STITCH_DASH.solid);
  geo.sharedEdges.forEach((edge) => {
    c.beginPath();
    c.moveTo(edge.a[0], edge.a[1]);
    c.lineTo(edge.b[0], edge.b[1]);
    c.stroke();
  });
  c.restore();
}

export function signatureAnchor(state, W, H) {
  const sig = state.signature || {};
  const anchor = SIG_ANCHORS[sig.pos];
  return {
    x: W * (anchor ? anchor[0] : sig.x ?? SIG_DEFAULT_FREE_POINT[0]),
    y: H * (anchor ? anchor[1] : sig.y ?? SIG_DEFAULT_FREE_POINT[1]),
  };
}

/**
 * IG 发帖卡片 chrome（信息层）。
 * 卡片底由 paintCollage 先画好，这里只叠 UI：头像、用户名、操作栏、点赞/文案。
 * 图标走 icons.js 路径，禁止 emoji / Unicode 字符。
 */
function drawIgChrome(c, state, W, H, th) {
  const card = IG_CHROME.card;
  const x = W * card.x;
  const y = H * card.y;
  const w = W * card.w;
  const h = H * card.h;
  const padX = w * IG_CHROME.padRatio;
  const icon = Math.max(12, W * IG_CHROME.iconRatio);
  const avatar = Math.max(16, W * IG_CHROME.avatarRatio);
  const textMain = Math.max(11, W * IG_CHROME.textMainRatio);
  const textSub = Math.max(10, W * IG_CHROME.textSubRatio);

  // 内容区（照片）底边：layoutIgPost 从 H*0.12 到 H*0.74
  const mediaBottom = H * IG_CHROME.mediaBottomRatio;
  const actionY = mediaBottom + h * 0.035;
  const likeY = actionY + icon + h * 0.02;
  const captionY = likeY + textMain * 1.55;
  const footerY = captionY + textSub * 1.9;

  c.save();
  c.textBaseline = "middle";

  // 头像占位圆
  const ax = x + padX + avatar / 2;
  const ay = y + h * IG_CHROME.headerYRatio;
  c.fillStyle = hexToRgba(th.accent, 0.28);
  c.beginPath();
  c.arc(ax, ay, avatar / 2, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = hexToRgba(th.accent, 0.55);
  c.lineWidth = Math.max(1, W * 0.002);
  c.stroke();

  // 用户名（品牌）
  c.fillStyle = th.ink;
  c.font = `600 ${textMain}px "Segoe UI", "PingFang SC", sans-serif`;
  c.textAlign = "left";
  c.fillText(state.igBrand || "photo-cut", x + padX + avatar + w * 0.02, ay);

  // 右上更多点（三点竖排，线性图标）
  drawIcon24(c, ICON_STROKE.more, x + w - padX - icon, ay - icon / 2, icon, {
    fill: true,
  });

  // 操作栏：喜欢 / 评论 / 分享 · 右侧收藏
  const liked = !!state.ui?.liked;
  const saved = !!state.ui?.bookmarked;
  let ix = x + padX;
  const iy = actionY;
  drawIcon24(c, liked ? ICON_FILL.heart : ICON_STROKE.heart, ix, iy, icon, {
    fill: liked,
  });
  ix += icon * 1.55;
  drawIcon24(c, ICON_STROKE.comment, ix, iy, icon);
  ix += icon * 1.55;
  drawIcon24(c, ICON_STROKE.share, ix, iy, icon);

  drawIcon24(
    c,
    saved ? ICON_FILL.bookmark : ICON_STROKE.bookmark,
    x + w - padX - icon,
    iy,
    icon,
    { fill: saved }
  );

  // 点赞数
  const stats = { ...DEFAULT_IG_STATS, ...(state.igStats || {}) };
  c.fillStyle = th.ink;
  c.font = `600 ${textSub}px "Segoe UI", "PingFang SC", sans-serif`;
  c.fillText(`${stats.likes || DEFAULT_IG_STATS.likes} 次赞`, x + padX, likeY);

  // 文案：用户名加粗 + 正文
  const user = state.igBrand || "photo-cut";
  const caption = state.igCaption || "Through the Lens";
  c.font = `600 ${textSub}px "Segoe UI", "PingFang SC", sans-serif`;
  c.fillStyle = th.ink;
  const userW = c.measureText(user).width;
  c.fillText(user, x + padX, captionY);
  c.font = `400 ${textSub}px "Segoe UI", "PingFang SC", sans-serif`;
  c.fillStyle = th.sub;
  c.fillText(caption.slice(0, 48), x + padX + userW + w * 0.012, captionY);

  // 次要信息：评论 / 分享计数（不使用 emoji）
  const meta = `共 ${stats.comments || DEFAULT_IG_STATS.comments} 条评论 · 转发 ${stats.shares || stats.reposts || DEFAULT_IG_STATS.shares}`;
  c.fillStyle = hexToRgba(th.sub, 0.9);
  c.fillText(meta, x + padX, footerY);

  c.restore();
}

/**
 * 音乐播放器 chrome（Apple Music Now Playing）。
 * 方形大封面 + 曲名/艺人 + 进度条 + 上一首/播放/下一首。
 * 图标走 icons.js，禁止 emoji / Unicode 字符。
 */
function drawPlayerChrome(c, state, W, H, th) {
  if (!capabilitiesOf(state).player || !state.photos?.length) return;
  const meta = { ...DEFAULT_PLAYER_META, ...(state.playerMeta || {}) };
  const accent = state.playerColor || PLAYER_ACCENT;
  const P = PLAYER_CHROME;
  const art = Math.min(W, H) * P.artRatio;
  const cx = W / 2;
  const artTop = H * P.artTopRatio;
  const artX = cx - art / 2;
  const icon = Math.max(18, W * P.iconRatio);
  const playSize = Math.max(28, W * P.playRatio);
  const trackRatio = progressTrackRatio(state, P.progressWRatio);
  const barW = W * trackRatio;
  const padX = barW / 2;

  c.save();

  // 封面：圆角方图（Apple Music 主视觉），阴影轻
  if (state.photos[0]?.img) {
    c.save();
    const rr = Math.min(W, H) * P.artRadiusRatio;
    c.shadowColor = "rgba(0,0,0,0.35)";
    c.shadowBlur = Math.max(12, W * 0.04);
    c.shadowOffsetY = Math.max(4, W * 0.012);
    roundedPath(c, artX, artTop, art, art, rr);
    c.fill();
    c.restore();
    c.save();
    roundedPath(c, artX, artTop, art, art, rr);
    c.clip();
    drawCover(c, state, state.photos[0].img, artX, artTop, art, art, 0, state.photos[0].crop);
    c.restore();
  } else {
    const rr = Math.min(W, H) * P.artRadiusRatio;
    c.fillStyle = hexToRgba(accent, 0.18);
    roundedPath(c, artX, artTop, art, art, rr);
    c.fill();
  }

  // 曲名 / 艺人（左对齐，贴近 Apple Music）
  const left = W / 2 - padX;
  c.textAlign = "left";
  c.textBaseline = "middle";
  c.fillStyle = th.ink;
  c.font = `600 ${Math.max(15, W * 0.042)}px "Segoe UI", "PingFang SC", sans-serif`;
  c.fillText(meta.track || "Now Playing", left, H * P.titleTopRatio);
  c.fillStyle = accent;
  c.font = `500 ${Math.max(12, W * 0.03)}px "Segoe UI", "PingFang SC", sans-serif`;
  c.fillText(meta.artist || "photo-cut", left, H * P.artistTopRatio);

  // 底部信息垫底：深色渐变，避免进度/时间在亮图上「消失」
  const scrimTop = H * (P.progressYRatio - 0.06);
  const scrim = c.createLinearGradient(0, scrimTop, 0, H);
  scrim.addColorStop(0, "rgba(0,0,0,0)");
  scrim.addColorStop(1, "rgba(0,0,0,0.55)");
  c.fillStyle = scrim;
  c.fillRect(0, scrimTop, W, H - scrimTop);

  // 进度条：轨道 + 已播（强调色）+ 时间 —— 提高对比，保证导出可见
  const barH = Math.max(6, H * P.progressHRatio * 1.6);
  const barY = H * P.progressYRatio;
  const played = Math.min(1, Math.max(0, Number(state.ui?.playerProgress ?? DEFAULT_PLAYER_PROGRESS)));
  c.fillStyle = hexToRgba(th.ink, 0.28);
  roundedPath(c, left, barY, barW, barH, barH / 2);
  c.fill();
  c.fillStyle = accent;
  roundedPath(c, left, barY, barW * played, barH, barH / 2);
  c.fill();
  // 滑块
  c.beginPath();
  c.fillStyle = th.ink;
  c.arc(left + barW * played, barY + barH / 2, Math.max(6, W * 0.014), 0, Math.PI * 2);
  c.fill();

  c.font = `500 ${Math.max(11, W * 0.026)}px "Segoe UI", sans-serif`;
  c.fillStyle = hexToRgba(th.ink, 0.82);
  c.textAlign = "left";
  if (hasPlayerDuration(state)) c.fillText(meta.timeLeft || "1:24", left, H * P.timeTopRatio);
  c.textAlign = "right";
  if (hasPlayerDuration(state)) c.fillText(meta.timeRight, left + barW, H * P.timeTopRatio);

  // 控制条：上一首 · 播放/暂停 · 下一首（居中对称）
  const tY = H * P.transportYRatio;
  const gap = W * P.sideGapRatio;
  const playing = state.ui?.playing !== false;

  // 描边/填充统一用前景色（否则爱心会落到默认黑色，深色底上看不见）
  c.fillStyle = th.ink;
  c.strokeStyle = th.ink;
  drawIcon24(c, ICON_STROKE.prev, cx - gap - icon / 2, tY - icon / 2, icon, { fill: true });
  drawIcon24(c, ICON_STROKE.next, cx + gap - icon / 2, tY - icon / 2, icon, { fill: true });
  const minorIcon = icon * PLAYER_MINOR_ICON_RATIO;
  drawIcon24(c, ICON_STROKE.shuffle, cx - gap * 1.72 - minorIcon / 2, tY - minorIcon / 2, minorIcon, {
    fill: true,
  });
  drawIcon24(c, ICON_STROKE.repeat, cx + gap * 1.72 - minorIcon / 2, tY - minorIcon / 2, minorIcon, {
    fill: true,
  });

  // 播放键：实心圆底 + 反白图标（Apple Music）
  c.beginPath();
  c.fillStyle = hexToRgba(th.ink, 0.1);
  c.arc(cx, tY, playSize / 2, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.fillStyle = accent;
  c.arc(cx, tY, playSize / 2, 0, Math.PI * 2);
  c.fill();
  const playIcon = playing ? ICON_FILL.pause : ICON_FILL.play;
  c.fillStyle = "#ffffff";
  drawIcon24(c, playIcon, cx - playSize * 0.28, tY - playSize * 0.28, playSize * 0.56, {
    fill: true,
  });

  // 次要：爱心（红心 / 前景色空心）
  const heartX = left;
  const heartY = tY;
  c.fillStyle = state.ui?.liked ? accent : th.ink;
  c.strokeStyle = th.ink;
  drawIcon24(
    c,
    state.ui?.liked ? ICON_FILL.heart : ICON_STROKE.heart,
    heartX,
    heartY - icon / 2,
    icon,
    {
      fill: !!state.ui?.liked,
      lineWidth: Math.max(1.6, W * 0.0035),
    }
  );
  drawIcon24(c, ICON_STROKE.lyrics, left + icon * 1.55, heartY - minorIcon / 2, minorIcon, { fill: true });
  drawIcon24(c, ICON_STROKE.queue, left + icon * 2.5, heartY - minorIcon / 2, minorIcon, { fill: true });

  c.restore();
}

/**
 * YouTube chrome：竖屏走 Shorts 侧栏；横屏走长视频播放器控制条。
 * 图标一律 icons.js 路径，禁止 emoji / Unicode 字符。
 */
function drawYtChrome(c, state, W, H, th, vertical) {
  if (!capabilitiesOf(state).player || !state.photos?.length) return;
  const pad = W * 0.05;
  c.save();
  if (vertical) {
    // Shorts 侧栏：互动数据缺失时不绘制对应项目，网页覆盖层使用同一组判断。
    const short = YT_SHORT_CHROME;
    const barX = W * short.railXRatio;
    const icon = Math.max(16, W * short.iconRatio);
    c.fillStyle = "rgba(0,0,0,0.35)";
    c.fillRect(barX, H * (short.railTopRatio - 0.06), W * short.railWidthRatio, H * (short.railBottomRatio - short.railTopRatio + 0.08));
    c.fillStyle = th.ink;
    c.strokeStyle = th.ink;
    c.textAlign = "center";
    c.textBaseline = "middle";
    const stats = state.ytStats || {};
    const count = (value) => String(value ?? "").trim();
    const items = [
      count(stats.likes) ? { icon: state.ui?.liked ? ICON_FILL.heart : ICON_STROKE.heart, fill: !!state.ui?.liked, active: !!state.ui?.liked, value: stats.likes } : null,
      count(stats.comments) ? { icon: ICON_STROKE.comment, active: !!state.ui?.ytCommented, value: stats.comments } : null,
      count(stats.shares || stats.reposts) ? { icon: ICON_STROKE.share, active: !!state.ui?.ytShared, value: stats.shares || stats.reposts } : null,
      { icon: state.ui?.bookmarked ? ICON_FILL.bookmark : ICON_STROKE.bookmark, fill: !!state.ui?.bookmarked, active: !!state.ui?.bookmarked },
    ].filter(Boolean);
    const step = H * short.itemStepRatio;
    const countOffset = H * short.countOffsetRatio;
    let iy = H * short.railTopRatio;
    items.forEach((item) => {
      c.fillStyle = item.active ? th.accent : th.ink;
      c.strokeStyle = item.active ? th.accent : th.ink;
      drawIcon24(c, item.icon, barX + W * 0.03, iy, icon, { fill: !!item.fill });
      if (state.ui?.showCounts && count(item.value)) {
        c.font = `600 ${Math.max(10, W * 0.028)}px "Segoe UI", sans-serif`;
        c.fillText(item.value, barX + W * 0.06, iy + countOffset);
      }
      iy += step;
    });
  } else {
    drawYtLongChrome(c, state, W, H, th);
  }
  c.restore();
}

/** YouTube 长视频：底栏渐变 + 红进度 + 播放/下一/音量/时间 + 右侧工具。 */
function drawYtLongChrome(c, state, W, H, th) {
  const Y = YT_LONG_CHROME;
  const accent = YT_ACCENT;
  const padX = W * Y.padRatio;
  const icon = Math.max(16, W * Y.btnRatio);
  // 控制条叠在主视频区底部；标题在视频区之外
  const videoH = Math.min(H * 0.7, (W * 9) / 16);
  const barH = videoH * Y.controlsHRatio * 1.8;
  const barTop = videoH - barH;

  c.save();

  // 控制条渐变垫底（只铺主视频区）
  const scrim = c.createLinearGradient(0, barTop - videoH * 0.06, 0, videoH);
  scrim.addColorStop(0, "rgba(0,0,0,0)");
  scrim.addColorStop(1, "rgba(0,0,0,0.72)");
  c.fillStyle = scrim;
  c.fillRect(0, barTop - videoH * 0.06, W, videoH - barTop + videoH * 0.06);

  // 进度条：未播 / 缓冲 / 已播（红）
  const barW = W * progressTrackRatio(state, Y.progressWRatio);
  const barX = (W - barW) / 2;
  const barY = barTop + barH * 0.22;
  const barH2 = Math.max(5, videoH * Y.progressHRatio * 1.4);
  const played = Math.min(1, Math.max(0, Number(state.ui?.playerProgress ?? DEFAULT_VIDEO_PROGRESS)));
  const buffered = Math.min(1, Math.max(played, Number(state.ui?.playerBuffered ?? DEFAULT_PLAYER_BUFFERED)));
  c.fillStyle = hexToRgba(th.ink, 0.22);
  roundedPath(c, barX, barY, barW, barH2, barH2 / 2);
  c.fill();
  c.fillStyle = hexToRgba(th.ink, 0.38);
  roundedPath(c, barX, barY, barW * buffered, barH2, barH2 / 2);
  c.fill();
  c.fillStyle = accent;
  roundedPath(c, barX, barY, barW * played, barH2, barH2 / 2);
  c.fill();
  c.beginPath();
  c.fillStyle = accent;
  c.arc(barX + barW * played, barY + barH2 / 2, Math.max(6, W * 0.012), 0, Math.PI * 2);
  c.fill();

  // 左：播放 / 下一首 / 音量 · 时间
  const cy = barY + barH2 + (barH - (barY - barTop) - barH2) * 0.55;
  let ix = padX;
  c.fillStyle = th.ink;
  c.strokeStyle = th.ink;
  const playing = state.ui?.playing !== false;
  drawIcon24(c, playing ? ICON_FILL.pause : ICON_FILL.play, ix, cy - icon / 2, icon, { fill: true });
  ix += icon * 1.7;
  drawIcon24(c, ICON_STROKE.nextTrack, ix, cy - icon / 2, icon, { fill: true });
  ix += icon * 1.7;
  drawIcon24(c, state.ui?.muted ? ICON_STROKE.muted : ICON_STROKE.volume, ix, cy - icon / 2, icon, {
    fill: true,
  });
  ix += icon * 1.9;

  const meta = { ...DEFAULT_PLAYER_META, ...(state.playerMeta || {}) };
  const cur = meta.timeLeft || "1:24";
  const dur = meta.timeRight || "3:42";
  c.font = `500 ${Math.max(11, W * 0.024)}px "Segoe UI", sans-serif`;
  c.textAlign = "left";
  c.textBaseline = "middle";
  if (hasPlayerDuration(state)) c.fillText(`${cur} / ${dur}`, ix, cy);

  // 右：字幕 / 设置 / 画中画 / 剧场 / 全屏
  let rx = W - padX;
  const rightIcons = [
    ICON_STROKE.captions,
    ICON_STROKE.settings,
    ICON_STROKE.miniplayer,
    ICON_STROKE.theater,
    ICON_STROKE.fullscreen,
  ];
  rightIcons.forEach((d) => {
    rx -= icon * 1.35;
    drawIcon24(c, d, rx, cy - icon / 2, icon, { fill: true, lineWidth: 1.5 });
    rx -= icon * 0.15;
  });

  // 标题 / 频道（主视频区下方）
  const titleY = videoH + (H - videoH) * 0.28;
  const chY = videoH + (H - videoH) * 0.58;
  if (titleY < H * 0.98) {
    c.fillStyle = th.ink;
    c.font = `600 ${Math.max(13, W * 0.032)}px "Segoe UI", "PingFang SC", sans-serif`;
    c.textAlign = "left";
    c.textBaseline = "middle";
    c.fillText(state.title || "Video", padX, titleY);
    c.fillStyle = th.sub;
    c.font = `500 ${Math.max(11, W * 0.024)}px "Segoe UI", sans-serif`;
    c.fillText(state.subtitle || "photo-cut studio", padX, chY);
  }

  c.restore();
}

export function paintCollage(c, state, W, H, options = {}) {
  const th = themeOf(state);
  const g = gapPx(state, W, H);
  const r = radiusPx(state, W, H);
  const photos = options.photos || state.photos;

  drawBackground(c, state, W, H, th);

  const slots = computeSlots(state, photos, W, H, g);
  const isFreeform = state.layout === "custom" && state.customGrid?.mode === "freeform";

  if (isFreeform) {
    paintFreeformSlots(c, state, W, H, photos, slots, th);
    paintFreeformSeams(c, state, W, H, th, slots);
  }

  if (isFreeform) {
    drawText(c, state, W, H, th);
  } else if (state.layout === "player") {
    paintSlots(c, state, W, H, photos, slots, th, 0);
    drawPlayerChrome(c, state, W, H, th);
  } else if (state.layout === "ig-post") {
    // 卡片底只在这里填一次；照片按 IG 干净矩形铺（不默认宝丽来白边）
    c.save();
    c.fillStyle = th.card;
    const cardBox = IG_CHROME.card;
    roundedPath(
      c,
      W * cardBox.x,
      H * cardBox.y,
      W * cardBox.w,
      H * cardBox.h,
      IG_CHROME.cardRadiusRatio * Math.min(W, H)
    );
    c.fill();
    // 右侧保存键是图标，主题描边色避免压在照片上
    c.strokeStyle = hexToRgba(th.sub, 0.35);
    c.lineWidth = Math.max(1, W * 0.0015);
    roundedPath(
      c,
      W * cardBox.x,
      H * cardBox.y,
      W * cardBox.w,
      H * cardBox.h,
      IG_CHROME.cardRadiusRatio * Math.min(W, H)
    );
    c.stroke();
    c.restore();
    paintSlots(c, state, W, H, photos, slots, th, r);
    drawIgChrome(c, state, W, H, th);
  } else if (state.layout === "type") {
    if (photos[0]?.img) drawCover(c, state, photos[0].img, 0, 0, W, H, 0, photos[0].crop);
    drawText(c, state, W, H, th);
  } else {
    paintSlots(c, state, W, H, photos, slots, th, r);
    if (state.layout === "yt-short") drawYtChrome(c, state, W, H, th, true);
    else if (state.layout === "yt-panel") drawYtChrome(c, state, W, H, th, false);
    else drawText(c, state, W, H, th);
  }

  drawSignature(c, state, W, H, th, options.signatureImage);
  applyLight(c, state, W, H, th);
  applyTexture(c, state, W, H);
  return slots;
}

export function resolveExportSize(state, previewW, previewH) {
  const ratioV = RATIOS[state.ratio] || 1;
  let w = previewW;
  let h = previewH;
  if (state.exportSize === "ig") {
    if (ratioV >= 1) {
      w = 1080;
      h = Math.round(1080 / ratioV);
    } else {
      w = Math.round(1080 * ratioV);
      h = 1080;
    }
  } else if (state.exportSize === "x") {
    const long = 2160;
    if (ratioV >= 1) {
      w = long;
      h = Math.round(long / ratioV);
    } else {
      w = Math.round(long * ratioV);
      h = long;
    }
  } else {
    const scale = 2;
    w = Math.min(2048, Math.max(1080, Math.round(previewW * scale)));
    h = Math.max(1, Math.round(w / ratioV));
  }
  return { w: Math.max(1, w), h: Math.max(1, h) };
}

export async function exportImage(state, previewW, previewH, options = {}) {
  const dim = resolveExportSize(state, previewW, previewH);
  const off = document.createElement("canvas");
  off.width = dim.w;
  off.height = dim.h;
  const ctx = off.getContext("2d");
  let signatureImage = options.signatureImage || null;
  if (!signatureImage && state.signature?.enabled && capabilitiesOf(state).signature && state.signature?.imageData) {
    signatureImage = await new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = state.signature.imageData;
    });
  }
  paintCollage(ctx, state, dim.w, dim.h, { signatureImage });
  const format = state.exportFormat === "png" ? "image/png" : "image/jpeg";
  const quality = format === "image/png" ? undefined : Math.min(0.95, Math.max(0.7, 1 - (state.maxMB || 2) * 0.02));
  const blob = await new Promise((resolve) => off.toBlob(resolve, format, quality));
  return { blob, width: dim.w, height: dim.h };
}
