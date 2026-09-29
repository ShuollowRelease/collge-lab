import { THEMES, FONTS, SIG_FONTS, RATIOS } from "./constants.js";
import { computeSlots, gapPx, radiusPx, hashRand } from "./layouts.js";

export function themeOf(state) {
  return THEMES[state.theme] || THEMES.dark;
}

export function fontStack(key) {
  return FONTS[key]?.display || FONTS.gothic.display;
}

export function fontWeight(key) {
  return FONTS[key]?.weight || "600";
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

export function drawCover(c, state, img, x, y, w, h, r, crop) {
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
    } else if (slot.poly) {
      c.beginPath();
      slot.poly.forEach(([x, y], idx) => (idx ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.closePath();
      c.clip();
      drawCover(c, state, photo.img, slot.x, slot.y, slot.w, slot.h, 0, photo.crop);
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

function drawSignature(c, state, W, H, th) {
  const sig = state.signature;
  if (!sig?.enabled || !sig.text) return;
  const base = Math.min(W, H);
  const size = Math.max(12, base * (sig.size ?? 0.08));
  const font = SIG_FONTS[sig.font] || SIG_FONTS.script;
  const opacity = sig.opacity ?? 0.72;
  const rotate = ((sig.rotate ?? -6) * Math.PI) / 180;

  let x = W * 0.88;
  let y = H * 0.9;
  if (sig.pos === "bl") {
    x = W * 0.12;
    y = H * 0.9;
  } else if (sig.pos === "tr") {
    x = W * 0.88;
    y = H * 0.12;
  } else if (sig.pos === "tl") {
    x = W * 0.12;
    y = H * 0.12;
  } else if (sig.pos === "c") {
    x = W * 0.5;
    y = H * 0.56;
  }

  c.save();
  c.translate(x, y);
  c.rotate(rotate);
  c.globalAlpha = opacity;
  c.font = `${font.weight} ${size}px ${font.display}`;
  c.fillStyle = sig.effect === "ink" ? th.accent : th.ink;
  if (sig.effect === "soft") {
    c.shadowColor = "rgba(0,0,0,0.35)";
    c.shadowBlur = size * 0.18;
  } else if (sig.effect === "glow") {
    c.shadowColor = hexToRgba(th.accent, 0.75);
    c.shadowBlur = size * 0.28;
  }
  c.textAlign = sig.pos === "bl" || sig.pos === "tl" ? "left" : sig.pos === "c" ? "center" : "right";
  c.textBaseline = "middle";
  c.fillText(sig.text, 0, 0);
  c.restore();
}

function drawIgChrome(c, state, W, H, th) {
  const pad = W * 0.06;
  c.save();
  c.fillStyle = th.card;
  roundedPath(c, W * 0.05, H * 0.06, W * 0.9, H * 0.88, 18);
  c.fill();

  c.fillStyle = th.ink;
  c.font = `600 ${Math.max(12, W * 0.032)}px "Segoe UI", "PingFang SC", sans-serif`;
  c.textAlign = "left";
  c.textBaseline = "middle";
  c.fillText(state.igBrand || "photo-cut", pad + W * 0.02, H * 0.105);

  c.fillStyle = th.sub;
  c.font = `400 ${Math.max(11, W * 0.026)}px "Segoe UI", "PingFang SC", sans-serif`;
  const caption = state.igCaption || "Through the Lens";
  c.fillText(caption.slice(0, 42), pad, H * 0.82);

  const stats = state.igStats || {};
  const line = `♥ ${stats.likes || "128"}   💬 ${stats.comments || "12"}   ↗ ${stats.shares || "4"}`;
  c.fillText(line, pad, H * 0.87);
  c.restore();
}

function drawPlayerChrome(c, state, W, H, th) {
  const meta = state.playerMeta || {};
  const accent = state.playerColor || "#7c3aed";
  c.save();
  const cover = Math.min(W, H) * 0.42;
  const cx = W / 2;
  const cy = H * 0.42;
  if (state.photos[0]?.img) {
    c.save();
    c.beginPath();
    c.arc(cx, cy, cover / 2, 0, Math.PI * 2);
    c.clip();
    drawCover(c, state, state.photos[0].img, cx - cover / 2, cy - cover / 2, cover, cover, 0, state.photos[0].crop);
    c.restore();
    c.strokeStyle = hexToRgba(accent, 0.55);
    c.lineWidth = Math.max(2, W * 0.006);
    c.beginPath();
    c.arc(cx, cy, cover / 2, 0, Math.PI * 2);
    c.stroke();
  }
  c.fillStyle = th.ink;
  c.textAlign = "center";
  c.font = `600 ${Math.max(14, W * 0.036)}px "Segoe UI", "PingFang SC", sans-serif`;
  c.fillText(meta.track || "Now Playing", cx, H * 0.7);
  c.fillStyle = th.sub;
  c.font = `400 ${Math.max(12, W * 0.028)}px "Segoe UI", "PingFang SC", sans-serif`;
  c.fillText(meta.artist || "photo-cut", cx, H * 0.75);
  c.font = `400 ${Math.max(11, W * 0.024)}px Consolas, monospace`;
  c.fillText(`${meta.timeLeft || "1:24"}  —  ${meta.timeRight || "3:42"}`, cx, H * 0.82);

  // progress
  const barW = W * 0.7;
  const barY = H * 0.87;
  c.fillStyle = hexToRgba(th.sub, 0.35);
  roundedPath(c, cx - barW / 2, barY, barW, 6, 3);
  c.fill();
  c.fillStyle = accent;
  roundedPath(c, cx - barW / 2, barY, barW * 0.38, 6, 3);
  c.fill();
  c.restore();
}

function drawYtChrome(c, state, W, H, th, vertical) {
  const pad = W * 0.05;
  c.save();
  c.fillStyle = "rgba(0,0,0,0.35)";
  if (vertical) {
    const barX = W * 0.82;
    c.fillRect(barX, H * 0.35, W * 0.12, H * 0.35);
    c.fillStyle = th.ink;
    c.font = `600 ${Math.max(11, W * 0.03)}px "Segoe UI", sans-serif`;
    c.textAlign = "center";
    const stats = state.ytStats || {};
    const items = [
      state.ui?.liked ? "♥" : "♡",
      state.ui?.showCounts ? stats.likes || "1.2k" : "",
      "💬",
      state.ui?.showCounts ? stats.comments || "88" : "",
      "↗",
    ].filter(Boolean);
    items.forEach((t, i) => c.fillText(t, barX + W * 0.06, H * 0.4 + i * H * 0.055));
  } else {
    c.fillRect(0, H * 0.78, W, H * 0.22);
    c.fillStyle = th.ink;
    c.font = `600 ${Math.max(12, W * 0.03)}px "Segoe UI", "PingFang SC", sans-serif`;
    c.textAlign = "left";
    c.fillText(state.title || "Video", pad, H * 0.84);
    c.fillStyle = th.sub;
    c.font = `400 ${Math.max(11, W * 0.024)}px "Segoe UI", sans-serif`;
    c.fillText(state.subtitle || "photo-cut studio", pad, H * 0.9);
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

  if (state.layout === "player") {
    paintSlots(c, state, W, H, photos, slots, th, 0);
    drawPlayerChrome(c, state, W, H, th);
  } else if (state.layout === "ig-post") {
    c.save();
    c.fillStyle = th.card;
    roundedPath(c, W * 0.05, H * 0.06, W * 0.9, H * 0.88, 18);
    c.fill();
    c.restore();
    const inner = slots.map((s) => ({ ...s, polaroid: s.polaroid ?? true }));
    paintSlots(c, state, W, H, photos, inner, th, r);
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

  drawSignature(c, state, W, H, th);
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

export async function exportImage(state, previewW, previewH) {
  const dim = resolveExportSize(state, previewW, previewH);
  const off = document.createElement("canvas");
  off.width = dim.w;
  off.height = dim.h;
  const ctx = off.getContext("2d");
  paintCollage(ctx, state, dim.w, dim.h);
  const format = state.exportFormat === "png" ? "image/png" : "image/jpeg";
  const quality = format === "image/png" ? undefined : Math.min(0.95, Math.max(0.7, 1 - (state.maxMB || 2) * 0.02));
  const blob = await new Promise((resolve) => off.toBlob(resolve, format, quality));
  return { blob, width: dim.w, height: dim.h };
}
