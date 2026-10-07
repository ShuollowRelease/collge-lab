/**
 * 社交 UI 图标路径（viewBox 0 0 24 24）。
 * Canvas 用 Path2D 直接吃同一套 d；Web/React 也可引用，禁止再写一份字面量。
 * 颜色一律由调用方 currentColor / fillStyle 控制。
 */

/** 描边图标：返回 Path2D，调用方自行 stroke/fill。 */
export function iconPath(d) {
  return new Path2D(d);
}

/** 线性（stroke）图标：使用 stroke 绘制。 */
export const ICON_STROKE = {
  heart: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z",
  comment:
    "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z",
  share: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z",
  bookmark: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z",
  more: "M12 5.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zm0 5.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zm0 5.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5z",
  volume: "M11 5 6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M18.07 5.93a9 9 0 0 1 0 12.14",
  muted: "M11 5 6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6",
  play: "M8 5v14l11-7L8 5z",
  pause: "M6 5h4v14H6V5zm8 0h4v14h-4V5z",
  prev: "M17.97 4.28A2 2 0 0 1 21 6v12a2 2 0 0 1-3.03 1.72l-9.99-6a2 2 0 0 1 0-3.44l9.99-6zM4 5v14",
  next: "M6.03 4.28A2 2 0 0 0 3 6v12a2 2 0 0 0 3.03 1.72l9.99-6a2 2 0 0 0 0-3.44l-9.99-6zM20 5v14",
  shuffle:
    "M18 14l4 4-4 4M18 2l4 4-4 4M2 18h1.97a4 4 0 0 0 3.3-1.7l5.45-8.6A4 4 0 0 1 16 6h6M2 6h1.97a4 4 0 0 1 3.6 2.2M22 18h-6.04a4 4 0 0 1-3.3-1.8l-.36-.45",
  repeat: "M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3",
  lyrics:
    "M4 6h10M4 12h16M4 18h8M16 16.5c0-1.5 1.2-2.5 2.8-2.5 1.3 0 2.2.6 2.2 1.7 0 2.1-5 1.4-5 4.3 0 1.2 1 2 2.3 2 1.4 0 2.5-.8 2.7-2",
  queue: "M4 6h12M4 12h12M4 18h12M18 9v8M18 9l3 2M18 9l-3 2",
  captions:
    "M3 5h18v14H3zM7 12h3M14 12h3M7 15h10",
  settings:
    "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.88 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.88.34h.09a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.88v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z",
  miniplayer:
    "M3 5h18v14H3zM14 13h5v4h-5z",
  theater:
    "M3 6h18v12H3zM6 9h4v6H6zM14 9h4v6h-4z",
  nextTrack:
    "M6.03 4.28A2 2 0 0 0 3 6v12a2 2 0 0 0 3.03 1.72l9.99-6a2 2 0 0 0 0-3.44l-9.99-6zM20 5v14",
  check: "M5 12l5 5L20 7",
  fullscreen:
    "M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3",
  exitFullscreen: "M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3",
};

/** 实心（fill）图标变体。 */
export const ICON_FILL = {
  heart: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z",
  bookmark: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z",
  play: "M8 5v14l11-7L8 5z",
  pause: "M6 5h4v14H6V5zm8 0h4v14h-4V5z",
  prev: "M17.97 4.28A2 2 0 0 1 21 6v12a2 2 0 0 1-3.03 1.72l-9.99-6a2 2 0 0 1 0-3.44l9.99-6zM4 5v14",
  next: "M6.03 4.28A2 2 0 0 0 3 6v12a2 2 0 0 0 3.03 1.72l9.99-6a2 2 0 0 0 0-3.44l-9.99-6zM20 5v14",
};

/**
 * 在 24 网格里描图标并落到 (x,y) 的 size 方框中心。
 * @param {CanvasRenderingContext2D} c
 * @param {string} d 路径
 * @param {number} x 左上角
 * @param {number} y 左上角
 * @param {number} size 边长
 * @param {object} opts { fill?: boolean, lineWidth?: number }
 */
export function drawIcon24(c, d, x, y, size, opts = {}) {
  if (!d || size <= 0) return;
  const s = size / 24;
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  const p = iconPath(d);
  if (opts.fill) {
    c.fill(p);
  } else {
    c.lineWidth = opts.lineWidth ?? 1.8;
    c.lineJoin = "round";
    c.lineCap = "round";
    c.stroke(p);
  }
  c.restore();
}
