/**
 * 形状蒙版几何。
 *
 * 约定：所有形状都在「单位方块」0–1 空间里定义，
 * 绘制时才映射到槽位矩形 —— 换比例、换导出尺寸都不会变形。
 * 每个生成器返回 { pts } 或 { path }（Path2D 构造器），
 * 由 pathShape() 统一落到具体上下文。
 *
 * 预览与导出共用本模块，禁止在 draw* 函数里就地写形状字面量。
 */

/**
 * 把单位空间的点按包围盒映射到任意矩形。
 * @param {{x:number,y:number,w:number,h:number}} box 目标矩形
 */
function mapper(box) {
  return (p) => [box.x + p[0] * box.w, box.y + p[1] * box.h];
}

/** 点链 → 绝对坐标点数组。 */
function toPoints(list, box) {
  const m = mapper(box);
  return list.map((p) => m(p));
}

/* ---------------------------------------------------------------- *
 * 基础形（可用圆角参数 / 参数方程，不依赖点链密度）
 * ---------------------------------------------------------------- */

/** 圆角半径基于 w/h 的同一个比例，保证矩形与正方形观感一致。 */
function roundedRadius(box, ratio) {
  return Math.min(box.w, box.h) * ratio;
}

/** 超椭圆（|x|^n + |y|^n = 1），n 越大越接近矩形。 */
function squirclePoints(segments = 96, exponent = 4) {
  const pts = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const ct = Math.cos(t);
    const st = Math.sin(t);
    const x = Math.sign(ct) * Math.pow(Math.abs(ct), 2 / exponent);
    const y = Math.sign(st) * Math.pow(Math.abs(st), 2 / exponent);
    pts.push([0.5 + x * 0.5, 0.5 + y * 0.5]);
  }
  return pts;
}

/* ---------------------------------------------------------------- *
 * 形状表
 * ---------------------------------------------------------------- */

/** 单位空间点链定义（归一化到 0–1 包围盒）。 */
const SHAPE_POINTS = {
  heart: [
    [0.5, 0.97],
    [0.07, 0.55],
    [0.015, 0.36],
    [0.03, 0.2],
    [0.13, 0.08],
    [0.28, 0.045],
    [0.44, 0.11],
    [0.5, 0.23],
    [0.56, 0.11],
    [0.72, 0.045],
    [0.87, 0.08],
    [0.97, 0.2],
    [0.985, 0.36],
    [0.93, 0.55],
  ],
  hexagon: [
    [0.25, 0],
    [0.75, 0],
    [1, 0.5],
    [0.75, 1],
    [0.25, 1],
    [0, 0.5],
  ],
  diamond: [
    [0.5, 0],
    [1, 0.5],
    [0.5, 1],
    [0, 0.5],
  ],
  pentagon: [
    [0.5, 0],
    [1, 0.36],
    [0.81, 1],
    [0.19, 1],
    [0, 0.36],
  ],
  triangle: [
    [0.5, 0],
    [1, 1],
    [0, 1],
  ],
  speech: [
    [0.16, 0],
    [0.84, 0],
    [1, 0.17],
    [1, 0.58],
    [0.84, 0.75],
    [0.55, 0.75],
    [0.3, 1],
    [0.34, 0.75],
    [0.16, 0.75],
    [0, 0.58],
    [0, 0.17],
  ],
};

/** 参数曲线定义：以 Path2D 构造器描述，支持真实圆弧。 */
const SHAPE_PATHS = {
  circle: (b) => (p) => {
    p.arc(b.x + b.w / 2, b.y + b.h / 2, Math.min(b.w, b.h) / 2, 0, Math.PI * 2);
  },
  ellipse: (b) => (p) => {
    p.ellipse(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, b.h / 2, 0, 0, Math.PI * 2);
  },
  /** 拱形：上方半圆 + 两侧直落。 */
  arch: (b) => (p) => {
    const r = b.w / 2;
    p.moveTo(b.x, b.y + b.h);
    p.lineTo(b.x, b.y + Math.min(r, b.h));
    p.arc(b.x + r, b.y + Math.min(r, b.h), r, Math.PI, 0);
    p.lineTo(b.x + b.w, b.y + b.h);
    p.closePath();
  },
  halfCircle: (b) => (p) => {
    const r = Math.min(b.w, b.h) / 2;
    p.arc(b.x + b.w / 2, b.y + b.h / 2, r, Math.PI, 0);
    p.closePath();
  },
  quarterCircle: (b) => (p) => {
    const r = Math.min(b.w, b.h);
    p.moveTo(b.x, b.y);
    p.lineTo(b.x + r, b.y);
    p.arc(b.x, b.y, r, 0, Math.PI / 2);
    p.closePath();
  },
};

/** 星形：外半径 / 内半径固定比例，点数与相位为具名常量以便复现。 */
const STAR = { points: 5, innerRatio: 0.4, phase: -Math.PI / 2 };

function starPoints() {
  const pts = [];
  const total = STAR.points * 2;
  for (let i = 0; i < total; i++) {
    const r = i % 2 === 0 ? 0.5 : 0.5 * STAR.innerRatio;
    const a = STAR.phase + (i / total) * Math.PI * 2;
    pts.push([0.5 + Math.cos(a) * r, 0.5 + Math.sin(a) * r]);
  }
  return pts;
}

/** 云朵：两排交叠圆弧拼出的连续外轮廓点链。 */
const BLOB = {
  lobes: [
    { cx: 0.2, cy: 0.66, r: 0.2 },
    { cx: 0.42, cy: 0.4, r: 0.28 },
    { cx: 0.68, cy: 0.42, r: 0.26 },
    { cx: 0.86, cy: 0.66, r: 0.18 },
  ],
  perLobe: 22,
};

function blobPoints() {
  const pts = [];
  BLOB.lobes.forEach((lobe, li) => {
    const start = li === 0 ? Math.PI : Math.PI * 0.8;
    const end = li === BLOB.lobes.length - 1 ? Math.PI * 2 : Math.PI * 1.2;
    for (let i = 0; i <= BLOB.perLobe; i++) {
      const a = start + ((end - start) * i) / BLOB.perLobe;
      pts.push([lobe.cx + Math.cos(a) * lobe.r, lobe.cy + Math.sin(a) * lobe.r]);
    }
  });
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const sx = maxX - minX || 1;
  const sy = maxY - minY || 1;
  // 归一化到 0–1 包围盒
  return pts.map((p) => [(p[0] - minX) / sx, (p[1] - minY) / sy]);
}

/** 单位空间点链总表；星形与云朵由参数生成，其余为手写关键点。 */
const UNIT_POINTS = {
  ...SHAPE_POINTS,
  star: starPoints(),
  blob: blobPoints(),
  squircle: squirclePoints(),
};

/**
 * 在给定上下文上构造形状路径（不改动 ctx 状态，调用方自行 beginPath 语义）。
 * @returns {boolean} 是否成功构造
 */
export function pathShape(ctx, shapeId, box) {
  if (!ctx || !box || box.w <= 0 || box.h <= 0) return false;

  if (shapeId === "rounded") {
    const r = Math.max(0, Math.min(roundedRadius(box, 0.16), box.w / 2, box.h / 2));
    const { x, y, w, h } = box;
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    return true;
  }

  const parametric = SHAPE_PATHS[shapeId];
  if (parametric) {
    parametric(box)(ctx);
    return true;
  }

  const unit = UNIT_POINTS[shapeId];
  if (!unit || !unit.length) return false;
  const abs = toPoints(unit, box);
  abs.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.closePath();
  return true;
}

/** 形状是否可用（UI 与绘制共用的校验）。 */
export function hasShape(shapeId) {
  return shapeId === "rounded" || !!SHAPE_PATHS[shapeId] || !!UNIT_POINTS[shapeId];
}

/**
 * 形状在目标矩形内的可见轮廓点链（绝对坐标）。
 * 与 pathShape() 同一套几何，供编辑层虚线描边使用，避免轮廓与图片裁剪不一致。
 */
export function shapeOutlinePoints(shapeId, box) {
  if (!box || box.w <= 0 || box.h <= 0 || !hasShape(shapeId)) return [];

  if (shapeId === "rounded") {
    const r = Math.max(0, Math.min(roundedRadius(box, 0.16), box.w / 2, box.h / 2));
    const { x, y, w, h } = box;
    const pts = [];
    const corner = (cx, cy, a0, a1) => {
      const n = 6;
      for (let i = 0; i <= n; i++) {
        const a = a0 + ((a1 - a0) * i) / n;
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
    };
    corner(x + w - r, y + r, -Math.PI / 2, 0);
    corner(x + w - r, y + h - r, 0, Math.PI / 2);
    corner(x + r, y + h - r, Math.PI / 2, Math.PI);
    corner(x + r, y + r, Math.PI, Math.PI * 1.5);
    return pts;
  }

  if (shapeId === "circle") {
    const r = Math.min(box.w, box.h) / 2;
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    const pts = [];
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return pts;
  }

  if (shapeId === "ellipse") {
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    const rx = box.w / 2;
    const ry = box.h / 2;
    const pts = [];
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return pts;
  }

  // 其余形状（含超椭圆 / 拱形等参数曲线）沿用 pathShape 的同一条路径采样
  const pts = [];
  const rec = {
    moveTo: (x, y) => pts.push([x, y]),
    lineTo: (x, y) => pts.push([x, y]),
    closePath: () => {},
    arc: (x, y, r, a0, a1) => {
      const n = 32;
      for (let i = 0; i <= n; i++) {
        const a = a0 + ((a1 - a0) * i) / n;
        pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
      }
    },
    ellipse: (x, y, rx, ry, _rot, a0, a1) => {
      const n = 32;
      for (let i = 0; i <= n; i++) {
        const a = a0 + ((a1 - a0) * i) / n;
        pts.push([x + Math.cos(a) * rx, y + Math.sin(a) * ry]);
      }
    },
    arcTo: (x1, y1, x2, y2, r) => {
      // 轮廓采样用途：退化为两段直线端点即可
      pts.push([x1, y1], [x2, y2]);
    },
  };
  if (!pathShape(rec, shapeId, box) || !pts.length) {
    const unit = UNIT_POINTS[shapeId];
    return unit ? toPoints(unit, box) : [];
  }
  return pts;
}

/**
 * 形状缩略图点链：供 React 用 <polygon> 直接预览，避免另画一套几何。
 * @returns {Array<[number,number]>} 0–100 视图盒内的点链
 */
export function shapeThumbPoints(shapeId) {
  const unit = UNIT_POINTS[shapeId];
  if (unit) return unit.map(([x, y]) => [x * 100, y * 100]);
  if (shapeId === "circle") {
    const pts = [];
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      pts.push([50 + Math.cos(a) * 50, 50 + Math.sin(a) * 50]);
    }
    return pts;
  }
  if (shapeId === "ellipse" || shapeId === "squircle") {
    // squirclePoints(段数, n)：n=2 即正圆，n=4 为超椭圆；缩略图按单位盒比例拉伸即可
    const n = shapeId === "squircle" ? 4 : 2;
    if (n === 2) {
      const pts = [];
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        pts.push([50 + Math.cos(a) * 50, 50 + Math.sin(a) * 50]);
      }
      return pts;
    }
    return squirclePoints(48, n).map(([x, y]) => [x * 100, y * 100]);
  }
  if (shapeId === "rounded") {
    return [
      [18, 4],
      [82, 4],
      [96, 18],
      [96, 82],
      [82, 96],
      [18, 96],
      [4, 82],
      [4, 18],
    ];
  }
  if (shapeId === "arch") {
    const pts = [];
    for (let i = 0; i <= 32; i++) {
      const a = Math.PI + (i / 32) * Math.PI;
      pts.push([50 + Math.cos(a) * 50, 50 + Math.sin(a) * 50]);
    }
    pts.push([100, 100], [0, 100]);
    return pts;
  }
  if (shapeId === "halfCircle") {
    const pts = [];
    for (let i = 0; i <= 32; i++) {
      const a = Math.PI + (i / 32) * Math.PI;
      pts.push([50 + Math.cos(a) * 50, 50 + Math.sin(a) * 50]);
    }
    return pts;
  }
  if (shapeId === "quarterCircle") {
    const pts = [[0, 0]];
    for (let i = 0; i <= 32; i++) {
      const a = (i / 32) * (Math.PI / 2);
      pts.push([Math.sin(a) * 100, Math.cos(a) * 100]);
    }
    return pts;
  }
  return [];
}
