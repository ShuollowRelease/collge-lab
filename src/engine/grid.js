/**
 * 自定义网格 · 几何内核。
 *
 * 数据源是 state.customGrid（全部 0–1 归一化），本模块负责：
 *   1. 把归一化分隔线 + 节点偏移解析成每个格子的四角；
 *   2. 按「格间距 / 外边框」内缩出可见格；
 *   3. 给出编辑层命中测试所需的分隔线与交叉点（CSS 像素）。
 *
 * 归一化是硬约束：导出走 resolveExportSize() 换尺寸重画，
 * 任何以像素存储的几何都会导致预览与导出不一致。
 */

import {
  CELL_MIN_PX,
  DIVIDER_SPLIT_RATIO,
  DRAG_ACTIVE_PX,
  HANDLE_HIT_PX,
  defaultCustomGrid,
  nodeKey,
} from "./constants.js";
import { normalizeFreeform } from "./freeform.js";

const EPS = 1e-4;

/** 归一化坐标 → CSS 像素（外边框内缩）。 */
function normToPx(v, pad, span) {
  return pad + v * span;
}

/** CSS 像素 → 归一化坐标（外边框内缩的逆运算）。 */
export function pxToNorm(v, pad, span) {
  if (span <= 0) return 0;
  return (v - pad) / span;
}

/** 单格最小边长换算成归一化值：同一像素下限在不同画布尺寸下自动等效。 */
function minUnit(span) {
  if (!span || span <= 0) return 0;
  return Math.min(0.45, CELL_MIN_PX / span);
}

/**
 * 分隔线取值区间，保证两侧格子都不小于最小尺寸。
 */
export function dividerBounds(arr, i, minU) {
  const lo = (i > 0 ? arr[i - 1] : 0) + minU;
  const hi = (i < arr.length - 1 ? arr[i + 1] : 1) - minU;
  return { lo, hi: Math.max(lo, hi) };
}

export function clampDivider(arr, i, value, minU) {
  const { lo, hi } = dividerBounds(arr, i, minU);
  return Math.max(lo, Math.min(hi, value));
}

/**
 * 已含节点偏移的分隔线：整条线上每个交叉点的实际位置。
 * 首尾位置恒为 0 / 1 —— 画布边缘没有交叉点可拖，但整条线平移时端点必须跟着走，
 * 否则线会与格子脱节。
 *
 * @param {number[]} arr 基准分隔线（0–1，首尾 0/1）
 * @param {(i:number)=>number} offsetOf 该下标的节点偏移
 * @param {number} axisMin 单格最小边长（归一化）
 * @returns {number[]} 长度同 arr 的实际位置
 */
export function resolvedDividers(arr, offsetOf, axisMin) {
  const n = arr.length;
  const raw = arr.map((v, i) => (i === 0 || i === n - 1 ? v : v + (offsetOf?.(i) || 0)));
  return raw.map((v, i) => {
    if (i === 0) return 0;
    if (i === n - 1) return 1;
    return clampDivider(raw, i, v, axisMin || 0);
  });
}

/** 等分网格的归一化分隔线；count 至少为 1。 */
export function evenDividers(count) {
  const n = Math.max(1, Math.round(count));
  return Array.from({ length: n + 1 }, (_, i) => i / n);
}

/**
 * 把已有分隔线重采样到新的份数，原分隔线位置尽量保留。
 * 只在插入/删除行列时调用。
 * @param {number[]} arr 旧分隔线（0–1，首尾为 0/1）
 * @param {number} count 新份数
 * @param {"insert"|"remove"} mode
 * @param {number} at 插入/删除的间隔下标（0-based，指旧数组下标）
 */
export function respaceDividers(arr, count, mode, at) {
  const n = Math.max(1, Math.round(count));
  if (mode === "insert" && arr.length === n) {
    const i = Math.max(1, Math.min(n - 1, at));
    const lo = arr[i - 1];
    const hi = arr[i];
    return [...arr.slice(0, i), lo + (hi - lo) * DIVIDER_SPLIT_RATIO, ...arr.slice(i)];
  }
  if (mode === "remove" && arr.length === n + 2) {
    const i = Math.max(1, Math.min(n, at));
    return [...arr.slice(0, i), ...arr.slice(i + 1)];
  }
  return evenDividers(n);
}

/** 最宽间隙的 0-based 下标，用于「加行/加列」的插入位置。 */
export function widestGapIndex(arr) {
  let best = 1;
  let bestW = -1;
  for (let i = 1; i < arr.length; i++) {
    const w = arr[i] - arr[i - 1];
    if (w > bestW) {
      bestW = w;
      best = i;
    }
  }
  return best;
}

/** 最窄间隙的 0-based 下标，用于「减行/减列」——优先去掉最小的一格。 */
export function narrowestGapIndex(arr) {
  let best = 1;
  let bestW = Infinity;
  for (let i = 1; i < arr.length; i++) {
    const w = arr[i] - arr[i - 1];
    if (w < bestW) {
      bestW = w;
      best = i;
    }
  }
  return best;
}

/**
 * 格局变化后重排形状归属：按旧格子中心的归一化坐标定位到新格子。
 * @param {Record<string,string>} shapes 旧映射（键为 slot 下标）
 */
export function remapShapes(shapes, colsX, rowsY, nextColsX, nextRowsY) {
  const out = {};
  const locate = (v, arr) => {
    for (let i = 0; i < arr.length - 1; i++) {
      if (v >= arr[i] && v <= arr[i + 1]) return i;
    }
    return Math.max(0, arr.length - 2);
  };
  Object.entries(shapes || {}).forEach(([key, shape]) => {
    const idx = Number(key);
    if (!Number.isFinite(idx)) return;
    const cols = Math.max(1, colsX.length - 1);
    const c = idx % cols;
    const r = Math.floor(idx / cols);
    const cx = (colsX[c] + colsX[c + 1]) / 2;
    const cy = (rowsY[r] + rowsY[r + 1]) / 2;
    const nc = locate(cx, nextColsX);
    const nr = locate(cy, nextRowsY);
    const nextCols = Math.max(1, nextColsX.length - 1);
    out[nr * nextCols + nc] = shape;
  });
  return out;
}

/** 节点偏移，键为 "c,r"；值 { dx, dy } 归一化。 */
export function nodeOffset(grid, c, r) {
  const n = grid.nodes?.[nodeKey(c, r)];
  return { dx: n?.dx || 0, dy: n?.dy || 0 };
}

/** 判断某个交叉点是否可拖动（纯内部点）。 */
export function isMovableNode(grid, c, r) {
  return c >= 1 && c <= grid.cols - 1 && r >= 1 && r <= grid.rows - 1;
}

/** 行列增减后清理越界节点。 */
export function pruneNodes(grid, cols, rows) {
  const out = {};
  Object.entries(grid.nodes || {}).forEach(([key, val]) => {
    const [c, r] = key.split(",").map(Number);
    if (!Number.isFinite(c) || !Number.isFinite(r)) return;
    if (c >= 1 && c <= cols - 1 && r >= 1 && r <= rows - 1) out[key] = val;
  });
  return out;
}

/** 归一化网格定义（补齐缺省字段，兼容旧设置）。 */
export function normalizeGrid(raw) {
  const base = defaultCustomGrid();
  const grid = { ...base, ...(raw || {}) };
  grid.mode = grid.mode === "freeform" ? "freeform" : "grid";
  grid.rows = Math.max(1, Math.round(grid.rows || base.rows));
  grid.cols = Math.max(1, Math.round(grid.cols || base.cols));
  if (!Array.isArray(grid.colsX) || grid.colsX.length !== grid.cols + 1) {
    grid.colsX = evenDividers(grid.cols);
  }
  if (!Array.isArray(grid.rowsY) || grid.rowsY.length !== grid.rows + 1) {
    grid.rowsY = evenDividers(grid.rows);
  }
  grid.colsX = grid.colsX.map((v, i) => (i === 0 ? 0 : i === grid.cols ? 1 : v));
  grid.rowsY = grid.rowsY.map((v, i) => (i === 0 ? 0 : i === grid.rows ? 1 : v));
  grid.nodes = { ...(grid.nodes || {}) };
  grid.shapes = { ...(grid.shapes || {}) };
  grid.fits = { ...(grid.fits || {}) };
  grid.freeform = normalizeFreeform(grid.freeform);
  return grid;
}

/** 轴对齐矩形判断（带容差）。 */
function isAxisAligned(pts) {
  const [a, b, c, d] = pts;
  const near = (p, q) => Math.abs(p - q) < 0.01;
  return near(a[1], b[1]) && near(c[1], d[1]) && near(a[0], d[0]) && near(b[0], c[0]);
}

/**
 * 把每条边沿自己的内法线平移 inset 距离，再求相邻边的交点作为新顶点。
 * 这是真正的「等距内缩」：无论矩形还是被拖成不规则四边形，
 * 每条边都恰好内移 inset，相邻格之间的可见缝隙因此恒等于 inset。
 * （按形心比例缩放做不到这点：非正方形格子两个方向的内缩量会不等。）
 */
function insetQuad(pts, inset) {
  if (inset <= 0) return pts;
  const n = pts.length;
  const cx = pts.reduce((s, p) => s + p[0], 0) / n;
  const cy = pts.reduce((s, p) => s + p[1], 0) / n;
  const lines = pts.map((p, i) => {
    const q = pts[(i + 1) % n];
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const len = Math.hypot(dx, dy) || 1;
    // 内法线：取指向形心的一侧
    let nx = -dy / len;
    let ny = dx / len;
    const mx = (p[0] + q[0]) / 2;
    const my = (p[1] + q[1]) / 2;
    if ((cx - mx) * nx + (cy - my) * ny < 0) {
      nx = -nx;
      ny = -ny;
    }
    return { px: p[0] + nx * inset, py: p[1] + ny * inset, dx, dy };
  });
  const out = [];
  for (let i = 0; i < n; i++) {
    const l1 = lines[(i - 1 + n) % n];
    const l2 = lines[i];
    const den = l1.dx * l2.dy - l1.dy * l2.dx;
    if (Math.abs(den) < 1e-9) {
      out.push(pts[i]);
      continue;
    }
    const t = ((l2.px - l1.px) * l2.dy - (l2.py - l1.py) * l2.dx) / den;
    out.push([l1.px + l1.dx * t, l1.py + l1.dy * t]);
  }
  return out;
}

/**
 * 构造自定义网格几何。
 *
 * @param {object} grid state.customGrid
 * @param {number} W 画布宽（CSS 像素）
 * @param {number} H 画布高（CSS 像素）
 * @param {object} opts { gap, pad } 均为 CSS 像素；缺省读 grid 自带值
 * @returns {{
 *   cells: Array<{index:number,c:number,r:number,pts:number[][],rect:{x:number,y:number,w:number,h:number},plain:boolean,shape:string|null,fit:string}>,
 *   dividers: Array<{axis:"x"|"y",i:number,a:number[],b:number[]}>,
 *   nodes: Array<{c:number,r:number,x:number,y:number}>,
 *   pointNorm: (c:number,r:number)=>[number,number],
 *   colsX:number[], rowsY:number[], cols:number, rows:number, hasShapes:boolean, geom:{pad:number,spanX:number,spanY:number}
 * }}
 */
export function buildCustomGrid(grid, W, H, opts = {}) {
  const g = normalizeGrid(grid);
  const pad = Math.max(0, opts.pad ?? g.outerPad ?? 0);
  const gap = Math.max(0, opts.gap ?? g.cellGap ?? 0);
  const spanX = Math.max(1, W - pad * 2);
  const spanY = Math.max(1, H - pad * 2);
  const ux = minUnit(spanX);
  const uy = minUnit(spanY);

  const cols = g.cols;
  const rows = g.rows;

  // 基准分隔线先做一次整体夹取，保证基础几何可用
  const baseX = g.colsX.map((v, i) => (i === 0 ? 0 : i === cols ? 1 : clampDivider(g.colsX, i, v, ux)));
  const baseY = g.rowsY.map((v, i) => (i === 0 ? 0 : i === rows ? 1 : clampDivider(g.rowsY, i, v, uy)));

  const dxOf = (c, r) => nodeOffset(g, c, r).dx;
  const dyOf = (c, r) => nodeOffset(g, c, r).dy;

  // 每条线按「自己的行 / 列」展开：某一行的节点偏移不影响其它行，
  // 这正是不规则变形的来源（同一交叉点被四格共享，因此形变连贯）。
  //
  // 首尾位置恒为 0 / 1：画布边缘的角没有可拖动的交叉点，
  // 所以整条线平移时端点留在边缘，线在内侧交点之间过渡（与美图一致）。
  const lineX = Array.from({ length: rows + 1 }, (_, r) => resolvedDividers(baseX, (c) => dxOf(c, r), ux));
  const lineY = Array.from({ length: cols + 1 }, (_, c) => resolvedDividers(baseY, (r) => dyOf(c, r), uy));

  const px = (v, axis) => normToPx(v, pad, axis === "x" ? spanX : spanY);

  /** 该交叉点的最终归一化位置。 */
  const pointNorm = (c, r) => [lineX[r][c], lineY[c][r]];

  const pointAt = (c, r) => {
    const [vx, vy] = pointNorm(c, r);
    return [px(vx, "x"), px(vy, "y")];
  };

  const cells = [];
  let hasShapes = false;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const index = r * cols + c;
      const corners = [pointAt(c, r), pointAt(c + 1, r), pointAt(c + 1, r + 1), pointAt(c, r + 1)];
      const plain = isAxisAligned(corners);
      const pts = insetQuad(corners, gap / 2);
      const bxs = pts.map((p) => p[0]);
      const bys = pts.map((p) => p[1]);
      const x = Math.min(...bxs);
      const y = Math.min(...bys);
      const w = Math.max(1, Math.max(...bxs) - x);
      const h = Math.max(1, Math.max(...bys) - y);
      const shape = g.shapes[index] || null;
      const fit = g.fits[index] || "cover";
      if (shape) hasShapes = true;
      cells.push({ index, c, r, pts, rect: { x, y, w, h }, plain, shape, fit });
    }
  }

  // 分隔线端点取该线在两端边缘处的实测位置：整条线平移时端点跟着走，
  // 否则线会与格子边缘脱节（格子本身按四角多边形绘制）。
  const dividers = [];
  for (let i = 1; i < cols; i++) {
    dividers.push({
      axis: "x",
      i,
      a: [px(lineX[0][i], "x"), px(lineY[0][0], "y")],
      b: [px(lineX[rows][i], "x"), px(lineY[cols][rows], "y")],
    });
  }
  for (let j = 1; j < rows; j++) {
    dividers.push({
      axis: "y",
      i: j,
      a: [px(lineX[j][0], "x"), px(lineY[0][j], "y")],
      b: [px(lineX[j][cols], "x"), px(lineY[cols][j], "y")],
    });
  }

  const nodes = [];
  for (let r = 1; r < rows; r++) {
    for (let c = 1; c < cols; c++) {
      const [x, y] = pointAt(c, r);
      nodes.push({ c, r, x, y });
    }
  }

  return {
    cells,
    dividers,
    nodes,
    pointNorm,
    colsX: baseX,
    rowsY: baseY,
    cols,
    rows,
    hasShapes,
    geom: { pad, gap, spanX, spanY, ux, uy },
  };
}

/** 点到线段距离。 */
function distToSegment(p, a, b) {
  const vx = b[0] - a[0];
  const vy = b[1] - a[1];
  const len2 = vx * vx + vy * vy;
  if (len2 < EPS) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  let t = ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + vx * t), p[1] - (a[1] + vy * t));
}

/** 点是否在四边形内（射线法）。 */
export function pointInQuad(p, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    const hit = yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi || EPS) + xi;
    if (hit) inside = !inside;
  }
  return inside;
}

/**
 * 命中测试：交叉点 > 分隔线 > 格子。
 * @param {ReturnType<typeof buildCustomGrid>} geo
 * @param {[number,number]} p 画布局部坐标（CSS 像素）
 */
export function hitTest(geo, p, tolerance = HANDLE_HIT_PX) {
  for (const n of geo.nodes) {
    if (Math.hypot(p[0] - n.x, p[1] - n.y) <= tolerance) {
      return { kind: "node", c: n.c, r: n.r };
    }
  }
  let best = null;
  for (const d of geo.dividers) {
    const dist = distToSegment(p, d.a, d.b);
    if (dist <= tolerance && (!best || dist < best.dist)) {
      best = { kind: "divider", axis: d.axis, i: d.i, dist };
    }
  }
  if (best) return { kind: "divider", axis: best.axis, i: best.i };
  for (const cell of geo.cells) {
    if (pointInQuad(p, cell.pts)) return { kind: "cell", index: cell.index, c: cell.c, r: cell.r };
  }
  return null;
}

/** 拖动位移是否已达到「几何编辑」阈值（用于区分点击选择）。 */
export function isDragActive(dx, dy) {
  return Math.hypot(dx, dy) >= DRAG_ACTIVE_PX;
}
