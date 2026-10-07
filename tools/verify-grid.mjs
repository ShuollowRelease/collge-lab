/**
 * 自定义网格 · 高级编辑自检
 *
 * 覆盖：几何自洽性、节点共享形变、行列增删、形状蒙版裁剪、
 * 以及最关键的一条 —— 预览与导出（不同像素尺寸）几何一致。
 *
 * 运行：node tools/verify-grid.mjs
 * 不依赖浏览器：draw.js 用记录型假 canvas 驱动，document 仅提供 createElement 桩。
 */

import {
  defaultState,
  DEFAULT_SHAPE_ID,
  GRID_LIMIT,
  GRID_PAD_BASE,
  SHAPE_GROUPS,
  SHAPES,
} from "../src/engine/constants.js";
import {
  buildCustomGrid,
  evenDividers,
  hitTest,
  normalizeGrid,
  pointInQuad,
  pruneNodes,
  remapShapes,
  respaceDividers,
  widestGapIndex,
} from "../src/engine/grid.js";
import { hasShape, shapeThumbPoints } from "../src/engine/shapes.js";
import { computeSlots, customGridGeometry, previewSize } from "../src/engine/layouts.js";
import { paintCollage } from "../src/engine/draw.js";

const PREVIEW = { w: 640, h: 640 };
const EXPORT = { w: 1080, h: 1080 };

let failures = 0;
const results = [];

function check(name, fn) {
  try {
    const detail = fn();
    results.push({ ok: true, name, detail });
  } catch (e) {
    failures++;
    results.push({ ok: false, name, detail: e.message });
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "断言失败");
}

function close(a, b, tol = 0.75) {
  return Math.abs(a - b) <= tol;
}

/**
 * 两个凸四边形的重叠面积（Sutherland–Hodgman 裁剪）。
 * 相邻格共享边时结果为 0，真正穿插才会大于 0 —— 比射线法可靠，
 * 射线法在点恰好落在边上时结果不确定。
 */
function overlapArea(subject, clip) {
  const area = (p) => {
    let s = 0;
    for (let i = 0; i < p.length; i++) {
      const q = p[(i + 1) % p.length];
      s += p[i][0] * q[1] - q[0] * p[i][1];
    }
    return Math.abs(s) / 2;
  };
  const side = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  let output = subject;
  for (let i = 0; i < clip.length && output.length; i++) {
    const a = clip[i];
    const b = clip[(i + 1) % clip.length];
    const input = output;
    output = [];
    for (let j = 0; j < input.length; j++) {
      const cur = input[j];
      const prev = input[(j - 1 + input.length) % input.length];
      const curIn = side(a, b, cur) >= 0;
      const prevIn = side(a, b, prev) >= 0;
      if (curIn) {
        if (!prevIn) {
          const t = side(a, b, prev) / (side(a, b, prev) - side(a, b, cur));
          output.push([prev[0] + (cur[0] - prev[0]) * t, prev[1] + (cur[1] - prev[1]) * t]);
        }
        output.push(cur);
      } else if (prevIn) {
        const t = side(a, b, prev) / (side(a, b, prev) - side(a, b, cur));
        output.push([prev[0] + (cur[0] - prev[0]) * t, prev[1] + (cur[1] - prev[1]) * t]);
      }
    }
  }
  return output.length >= 3 ? area(output) : 0;
}

/** 记录型 canvas：只关心路径与图片落点，用于验证裁剪是否按预期发生。 */
function makeFakeCtx() {
  const record = { draws: [], clips: [], fills: 0, path: [] };
  let current = [];
  const push = (op, args) => current.push([op, args]);
  const ctx = {
    __record: record,
    canvas: { width: PREVIEW.w, height: PREVIEW.h },
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    fillStyle: "#000",
    strokeStyle: "#000",
    lineWidth: 1,
    font: "",
    textAlign: "left",
    textBaseline: "alphabetic",
    shadowColor: "",
    shadowBlur: 0,
    shadowOffsetY: 0,
    save() {},
    restore() {},
    beginPath() {
      current = [];
      record.path.push(current);
    },
    closePath() {
      push("close", []);
    },
    moveTo: (...a) => push("moveTo", a),
    lineTo: (...a) => push("lineTo", a),
    rect: (...a) => push("rect", a),
    arc: (...a) => push("arc", a),
    arcTo: (...a) => push("arcTo", a),
    ellipse: (...a) => push("ellipse", a),
    clip() {
      record.clips.push(current.slice());
    },
    fill() {
      record.fills++;
      current = [];
    },
    fillRect() {
      record.fills++;
    },
    stroke() {},
    fillText() {},
    translate() {},
    rotate() {},
    scale() {},
    drawImage(img, x, y, w, h) {
      record.draws.push({ x, y, w, h, src: img?.__name || "?" });
    },
    createPattern() {
      return null;
    },
    createLinearGradient() {
      return { addColorStop() {} };
    },
    createRadialGradient() {
      return { addColorStop() {} };
    },
    createImageData(w, h) {
      return { data: new Uint8ClampedArray(w * h * 4) };
    },
    getImageData(x, y, w, h) {
      return { data: new Uint8ClampedArray(w * h * 4) };
    },
    putImageData() {},
  };
  return ctx;
}

// draw.js 的颗粒/纸纹依赖 document.createElement('canvas')
globalThis.document = {
  createElement(tag) {
    if (tag !== "canvas") return {};
    const ctx = makeFakeCtx();
    return { width: 0, height: 0, getContext: () => ctx };
  },
};

const photo = (name) => ({ id: name, name, img: { width: 1200, height: 800, __name: name }, crop: { zoom: 1, ox: 0, oy: 0 } });

const baseState = (patch = {}) => ({
  ...defaultState(),
  photos: [photo("a"), photo("b"), photo("c"), photo("d"), photo("e"), photo("f")],
  layout: "custom",
  ...patch,
  customGrid: { ...normalizeGrid(defaultState().customGrid), on: true, ...(patch.customGrid || {}) },
});

/* ------------------------------------------------------------------ */

check("等分 3×2 网格：格子尺寸一致、间距等于按 800 基准缩放后的 cellGap", () => {
  // 外边框 / 格间距以 800 短边为设计基准，与 GAP / RADIUS 同规则
  const scale = Math.min(PREVIEW.w, PREVIEW.h) / GRID_PAD_BASE;
  const designPad = 12;
  const designGap = 10;
  const pad = Math.round(designPad * scale);
  const gap = Math.round(designGap * scale);
  const state = baseState({ customGrid: { cols: 3, rows: 2, cellGap: designGap, outerPad: designPad } });
  const geo = customGridGeometry(state, PREVIEW.w, PREVIEW.h);
  assert(geo.cells.length === 6, `期望 6 格，实际 ${geo.cells.length}`);
  const widths = geo.cells.map((c) => c.rect.w);
  assert(widths.every((w) => close(w, widths[0], 0.01)), "所有格子宽度应一致");
  const hGap = geo.cells[1].rect.x - (geo.cells[0].rect.x + geo.cells[0].rect.w);
  const vGap = geo.cells[3].rect.y - (geo.cells[0].rect.y + geo.cells[0].rect.h);
  assert(close(hGap, gap, 0.5), `水平间距应为 ${gap}，实际 ${hGap.toFixed(2)}`);
  assert(close(vGap, gap, 0.5), `垂直间距应为 ${gap}，实际 ${vGap.toFixed(2)}`);
  const edge = geo.cells[0].rect.x;
  assert(close(edge, pad + gap / 2, 0.5), `左边距应约 ${pad + gap / 2}，实际 ${edge.toFixed(2)}`);
  // 再验证导出：设计基准下相对占比应完全一致
  const ex = customGridGeometry(state, EXPORT.w, EXPORT.h);
  const exGap = ex.cells[1].rect.x - (ex.cells[0].rect.x + ex.cells[0].rect.w);
  const exGapPx = Math.round(designGap * (EXPORT.w / GRID_PAD_BASE));
  assert(close(exGap, exGapPx, 1), `导出间距应为 ${exGapPx}，实际 ${exGap.toFixed(2)}`);
  return `格宽 ${widths[0].toFixed(1)} 间距 ${hGap.toFixed(1)}/${gap}(设计 ${designGap}) 导出间距 ${exGap.toFixed(1)}/${exGapPx}`;
});

check("预览与导出：归一化几何按比例缩放一致（分辨率无关）", () => {
  const grid = { cols: 3, rows: 2, colsX: [0, 0.42, 0.7, 1], rowsY: [0, 0.35, 1] };
  const state = baseState({ customGrid: grid });
  const p = customGridGeometry(state, PREVIEW.w, PREVIEW.h);
  const e = customGridGeometry(state, EXPORT.w, EXPORT.h);
  assert(p.cells.length === e.cells.length, "格数应一致");
  p.cells.forEach((cell, i) => {
    const rel = e.cells[i];
    assert(close(cell.rect.x / PREVIEW.w, rel.rect.x / EXPORT.w, 0.002), `格 ${i} 横向位置不一致`);
    assert(close(cell.rect.y / PREVIEW.h, rel.rect.y / EXPORT.h, 0.002), `格 ${i} 纵向位置不一致`);
    assert(close(cell.rect.w / PREVIEW.w, rel.rect.w / EXPORT.w, 0.002), `格 ${i} 宽度不一致`);
    assert(close(cell.rect.h / PREVIEW.h, rel.rect.h / EXPORT.h, 0.002), `格 ${i} 高度不一致`);
  });
  return `${p.cells.length} 格在 ${PREVIEW.w}→${EXPORT.w} 下相对位置误差 < 0.2%`;
});

check("节点共享形变：拖动交叉点后相邻四格同步变形且互不重叠", () => {
  const grid = {
    cols: 3,
    rows: 3,
    colsX: evenDividers(3),
    rowsY: evenDividers(3),
    nodes: { "1,1": { dx: 0.06, dy: -0.05 } },
  };
  const geo = buildCustomGrid(grid, 640, 640, { pad: 0, gap: 0 });
  const affected = [0, 1, 3, 4].map((i) => geo.cells[i]);
  const shared = geo.pointNorm(1, 1);
  affected.forEach((cell) => {
    const hit = cell.pts.some((p) => close(p[0] / 640, shared[0], 0.001) && close(p[1] / 640, shared[1], 0.001));
    assert(hit, `格 ${cell.index} 应包含被拖动的共享点`);
  });
  const [c0, c1, c3, c4] = affected;
  // 共享点被拖斜后相邻格变成不规则四边形：包围盒会重叠，
  // 但多边形本身不应相交（用裁剪面积判定，共享边面积为 0）。
  const pairs = [[c0, c1], [c0, c3], [c1, c4], [c3, c4]];
  pairs.forEach(([a, b]) => {
    const area = overlapArea(a.pts, b.pts);
    assert(area < 0.5, `格 ${a.index} 与格 ${b.index} 重叠面积 ${area.toFixed(2)}px²`);
  });
  assert(!c0.plain && !c1.plain && !c3.plain && !c4.plain, "受影响的格子应被识别为非矩形");
  // 未受影响的格子仍是规整矩形，走快路径
  assert(geo.cells[8].plain, "右下角未受影响的格子应保持矩形");
  return `共享点 (${shared[0].toFixed(3)}, ${shared[1].toFixed(3)})，四格共享该点且重叠面积 < 0.5px²`;
});

check("分隔线平移：整条线上的交叉点随之移动（保持共线）", () => {
  const grid = { cols: 3, rows: 3, colsX: evenDividers(3), rowsY: evenDividers(3), nodes: {} };
  const delta = 0.1;
  const i = 1;
  const arr = [...grid.colsX];
  const start = arr[i];
  const base = start + delta; // 基准线被拖到的新位置
  const nodes = {};
  for (let r = 1; r < grid.rows; r++) nodes[`${i},${r}`] = { dx: delta, dy: 0 };
  const geo = buildCustomGrid({ ...grid, colsX: [0, base, grid.colsX[2], 1], nodes }, 640, 640, { pad: 0, gap: 0 });
  // 交叉点位置 = 基准线 + 节点偏移；同一行上的两个交叉点必须一致（共线）
  const interior = [1, 2].map((r) => geo.pointNorm(i, r)[0]);
  assert(interior.every((v) => close(v, interior[0], 0.0001)), `内部交叉点应共线，实际 ${interior.join(" / ")}`);
  assert(close(interior[0], base + delta, 0.0001), `交叉点应为 基准+偏移 = ${(base + delta).toFixed(3)}，实际 ${interior[0].toFixed(3)}`);
  return `线位 ${base.toFixed(3)} + 偏移 ${delta} → 交叉点 ${interior[0].toFixed(3)}（共线）`;
});

check("命中测试：节点优先于分隔线，分隔线优先于格子", () => {
  const grid = { cols: 2, rows: 2, colsX: evenDividers(2), rowsY: evenDividers(2), nodes: {} };
  const geo = buildCustomGrid(grid, 400, 400, { pad: 0, gap: 0 });
  const node = geo.nodes[0];
  assert(hitTest(geo, [node.x, node.y]).kind === "node", "中心交叉点应命中 node");
  assert(hitTest(geo, [200.5, 60]).kind === "divider", "分隔线上应命中 divider");
  assert(hitTest(geo, [60, 60]).kind === "cell", "格子内部应命中 cell");
  assert(hitTest(geo, [60, 60]).index === 0, "左上格下标应为 0");
  return "node / divider / cell 三级命中顺序正确";
});

check("加列：格数 +1、分隔线与形状归属按旧格中心重排", () => {
  // 2 列且左格更宽时，最宽间隙是第 1 段，新列插在 0 与 0.5 之间 → [0, 0.25, 0.5, 1]
  const g = normalizeGrid({ cols: 2, rows: 1, colsX: [0, 0.5, 1], shapes: { 0: "heart", 1: "star" } });
  const at = widestGapIndex(g.colsX);
  const colsX = respaceDividers(g.colsX, g.cols + 1, "insert", at);
  assert(colsX.length === 4, `分隔线应为 4 条，实际 ${colsX.length}`);
  const shapes = remapShapes(g.shapes, g.colsX, g.rowsY, colsX, g.rowsY);
  assert(Object.keys(shapes).length === 2, "形状数量应保持 2");
  assert(shapes["0"] === "heart", `左格形状应保留 heart，实际 ${shapes["0"]}`);
  assert(shapes["2"] === "star", `右格形状应落到下标 2（新列插在中间），实际 ${JSON.stringify(shapes)}`);
  return `分隔线 ${colsX.map((v) => v.toFixed(3)).join(", ")}；形状 ${JSON.stringify(shapes)}`;
});

check("减列 / 删除行列后清理越界节点", () => {
  const colsX = respaceDividers(evenDividers(3), 2, "remove", 1);
  assert(colsX.length === 3, "减列后应为 3 条分隔线");
  const g = normalizeGrid({ cols: 3, rows: 3, nodes: { "1,1": { dx: 0.02, dy: 0.02 }, "2,2": { dx: -0.03, dy: 0.01 } } });
  const pruned = pruneNodes(g, 2, 2);
  assert(Object.keys(pruned).length === 1 && pruned["1,1"], `应只保留 1,1，实际 ${JSON.stringify(pruned)}`);
  return "减列分隔线正确，越界节点已清理";
});

check("几何夹取：分隔线被推到极值也不会产生零宽或负宽格子", () => {
  const grid = { cols: 2, rows: 1, colsX: evenDividers(2), rowsY: [0, 1], nodes: {} };
  // 把分隔线硬推到 0.99 —— 应被夹取到 minUnit 以内
  const geo = buildCustomGrid({ ...grid, colsX: [0, 0.99, 1] }, 640, 640, { pad: 0, gap: 0 });
  const left = geo.cells[0];
  const right = geo.cells[1];
  assert(left.rect.w > 0 && right.rect.w > 0, "两格宽度都必须为正");
  assert(right.rect.w >= 40, `右格应保留最小宽度，实际 ${right.rect.w.toFixed(2)}px`);
  assert(left.rect.x + left.rect.w <= right.rect.x + 0.01, "两格不应重叠");
  return `左格 ${left.rect.w.toFixed(1)}px / 右格 ${right.rect.w.toFixed(1)}px（画布 640，最小 44px）`;
});

check("形状表：全部 id 均有几何，且缩略图点链非空", () => {
  const ids = SHAPE_GROUPS.flatMap((g) => g.items);
  const missing = ids.filter((id) => !hasShape(id) || !SHAPES[id]);
  assert(!missing.length, `缺少几何或名称：${missing.join(", ")}`);
  const empty = ids.filter((id) => shapeThumbPoints(id).length < 3);
  assert(!empty.length, `缩略图点链为空：${empty.join(", ")}`);
  return `${ids.length} 个形状：${ids.join(", ")}`;
});

check("绘制：套形状的格子按形状路径裁剪，未套形状的走矩形路径", () => {
  const state = baseState({
    customGrid: { cols: 2, rows: 1, shapes: { 0: DEFAULT_SHAPE_ID }, fits: { 0: "cover" } },
  });
  const ctx = makeFakeCtx();
  paintCollage(ctx, state, PREVIEW.w, PREVIEW.h);
  assert(ctx.__record.draws.length >= 2, `应至少绘制 2 张照片，实际 ${ctx.__record.draws.length}`);
  // 爱心为多段点链，矩形只有 1 条 rect 命令
  const heartClip = ctx.__record.clips.some((c) => c.filter(([op]) => op === "lineTo").length > 8);
  assert(heartClip, "应有一次多段点链裁剪（爱心形状）");
  assert(ctx.__record.clips.some((c) => c.length === 1 && c[0][0] === "rect"), "应有矩形裁剪（未套形状的格子）");
  return `${ctx.__record.draws.length} 张照片，裁剪路径 ${ctx.__record.clips.length} 条`;
});

check("绘制：完整显示（contain）与填充（cover）落点不同", () => {
  // outerPad / cellGap 归零，槽位即整张画布，便于按像素核对落点
  const run = (fit) => {
    const state = baseState({
      customGrid: { cols: 1, rows: 1, outerPad: 0, cellGap: 0, shapes: { 0: "circle" }, fits: { 0: fit } },
    });
    const ctx = makeFakeCtx();
    paintCollage(ctx, state, 400, 400);
    const only = ctx.__record.draws.find((d) => d.src === "a");
    assert(only, "应绘制照片 a");
    return only;
  };
  const cover = run("cover");
  const contain = run("contain");
  // 照片 1200×800（3:2）画进 400×400 格子：
  //   cover   → 高度铺满 400，宽度溢出到 600（裁切）
  //   contain → 宽度铺满 400，高度收到 267（留白）
  assert(close(cover.h, 400, 1), `cover 高度应铺满 400，实际 ${cover.h.toFixed(1)}`);
  assert(cover.w > 400, `cover 宽度应溢出格子，实际 ${cover.w.toFixed(1)}`);
  assert(close(contain.w, 400, 1), `contain 宽度应铺满 400，实际 ${contain.w.toFixed(1)}`);
  assert(contain.h < 400, `contain 高度应留白小于 400，实际 ${contain.h.toFixed(1)}`);
  assert(close(cover.w / cover.h, 1.5, 0.01) && close(contain.w / contain.h, 1.5, 0.01), "两种模式都不应改变照片比例");
  return `cover ${cover.w.toFixed(0)}×${cover.h.toFixed(0)} / contain ${contain.w.toFixed(0)}×${contain.h.toFixed(0)}`;
});

check("导出路径：resolveExportSize 后用同一份 customGrid 复算，槽位按比例一致", () => {
  const state = baseState({ customGrid: { cols: 3, rows: 2, colsX: [0, 0.42, 0.7, 1] } });
  const pv = computeSlots(state, state.photos, PREVIEW.w, PREVIEW.h, 10);
  const ex = computeSlots(state, state.photos, EXPORT.w, EXPORT.h, 20);
  assert(pv.length === 6 && ex.length === 6, `格数应均为 6，实际 ${pv.length}/${ex.length}`);
  pv.forEach((s, i) => {
    assert(close(s.x / PREVIEW.w, ex[i].x / EXPORT.w, 0.002), `格 ${i} 横向位置不一致`);
    assert(close(s.y / PREVIEW.h, ex[i].y / EXPORT.h, 0.002), `格 ${i} 纵向位置不一致`);
    assert(close(s.w / PREVIEW.w, ex[i].w / EXPORT.w, 0.002), `格 ${i} 宽度不一致`);
    assert(close(s.h / PREVIEW.h, ex[i].h / EXPORT.h, 0.002), `格 ${i} 高度不一致`);
  });
  return "6 个槽位在 640 与 1080 下相对位置一致";
});

check("照片数少于格子数：多余格子返回 null 且不报错", () => {
  const state = baseState({
    photos: [photo("only")],
    customGrid: { cols: 3, rows: 2 },
  });
  const slots = computeSlots(state, state.photos, PREVIEW.w, PREVIEW.h, 10);
  assert(slots.filter(Boolean).length === 1, `应只有 1 个有效槽位，实际 ${slots.filter(Boolean).length}`);
  const ctx = makeFakeCtx();
  paintCollage(ctx, state, PREVIEW.w, PREVIEW.h);
  assert(ctx.__record.draws.length === 1 || ctx.__record.draws.length === 2, "应只绘制有效格");
  return "空槽位安全跳过";
});

check("点内测试与网格上下限", () => {
  const quad = [[0, 0], [10, 0], [10, 10], [0, 10]];
  assert(pointInQuad([5, 5], quad), "中心点应在四边形内");
  assert(!pointInQuad([15, 5], quad), "外侧点不应在四边形内");
  assert(GRID_LIMIT >= 2 && GRID_LIMIT <= 12, "行列上限应在合理区间");
  return `GRID_LIMIT=${GRID_LIMIT}`;
});

/* ------------------------------------------------------------------ */

const pad = Math.max(...results.map((r) => r.name.length));
console.log("");
console.log("自定义网格 · 高级编辑自检");
console.log("─".repeat(pad + 40));
results.forEach((r) => {
  console.log(`${r.ok ? "✓" : "✗"} ${r.name.padEnd(pad)}  ${r.detail}`);
});
console.log("─".repeat(pad + 40));
console.log(`${results.length - failures} / ${results.length} 项通过`);
process.exitCode = failures ? 1 : 0;
