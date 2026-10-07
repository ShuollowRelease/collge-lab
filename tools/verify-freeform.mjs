import assert from "node:assert/strict";

import { layoutCustomGrid } from "../src/engine/layouts.js";
import {
  addFreeformNode,
  buildFreeformGeometry,
  connectFreeformNodes,
  defaultFreeform,
  moveFreeformNode,
  normalizeFreeform,
  removeFreeformNode,
  resolveRegionSetting,
} from "../src/engine/freeform.js";

const size = { w: 1080, h: 1080 };
const baseState = (freeform) => ({
  layout: "custom",
  photos: [],
  customGrid: { mode: "freeform", freeform },
});

function addNode(graph, x, y) {
  return addFreeformNode(graph, { x, y });
}

function connect(graph, a, b) {
  return connectFreeformNodes(graph, a, b);
}

// 1. 一条斜线把矩形画布分为两个真实多边形。
let diagonal = connect(defaultFreeform(), "frame-tl", "frame-br");
const diagonalGeo = buildFreeformGeometry(diagonal, size.w, size.h);
assert.equal(diagonalGeo.regions.length, 2);
assert.equal(diagonalGeo.regions.every((region) => region.points.length === 3), true);

// 2. 中心节点连接四条射线，得到四个闭合区域。
let radial = defaultFreeform();
const center = addNode(radial, 0.5, 0.5);
radial = center.graph;
["frame-tl", "frame-tr", "frame-br", "frame-bl"].forEach((corner) => {
  radial = connect(radial, center.id, corner);
});
const radialGeo = buildFreeformGeometry(radial, size.w, size.h);
assert.equal(radialGeo.regions.length, 4);
assert.equal(radialGeo.sharedEdges.length, 4);

// 3. 相交线段自动生成一个共享节点并拆成四条边。
let crossing = defaultFreeform();
const first = addNode(crossing, 0.1, 0.1);
crossing = first.graph;
const second = addNode(crossing, 0.9, 0.9);
crossing = second.graph;
const third = addNode(crossing, 0.1, 0.9);
crossing = third.graph;
const fourth = addNode(crossing, 0.9, 0.1);
crossing = fourth.graph;
crossing = connect(crossing, first.id, second.id);
crossing = connect(crossing, third.id, fourth.id);
const intersection = Object.values(crossing.nodes).filter(
  (node) => !node.locked && Math.abs(node.x - 0.5) < 0.01 && Math.abs(node.y - 0.5) < 0.01
);
assert.equal(intersection.length, 1);
assert.equal(crossing.edges.length, 4);

// 4–5. 区域设置可保存独立/整图模式与缝合配置，并能恢复。
const settingsGeo = buildFreeformGeometry(radial, size.w, size.h);
const regionSettings = Object.fromEntries(
  settingsGeo.regions.map((region, index) => [
    region.id,
    {
      mode: index === 0 ? "shared" : "independent",
      photoId: `photo-${index}`,
      fit: "contain",
      crop: { zoom: 1.25, ox: 0.1, oy: -0.2 },
    },
  ])
);
const saved = normalizeFreeform({
  ...radial,
  regionSettings,
  seam: { mode: "stitch", style: "dashed", color: "accent", width: 0.01, opacity: 0.7 },
});
assert.equal(saved.regionSettings[settingsGeo.regions[0].id].mode, "shared");
assert.equal(saved.seam.mode, "stitch");
assert.equal(saved.seam.style, "dashed");

// 6. 移动节点后仍然返回有效闭合区域，布局槽位使用真实多边形。
const moved = { ...saved, nodes: { ...saved.nodes, [center.id]: { ...saved.nodes[center.id], x: 0.42, y: 0.58 } } };
const movedGeo = buildFreeformGeometry(moved, size.w, size.h);
assert.equal(movedGeo.regions.length, 4);
const slots = layoutCustomGrid(baseState(moved), [], size.w, size.h);
assert.equal(slots.length, 4);
assert.equal(slots.every((slot) => slot.freeform && slot.poly.length >= 3), true);

// 7. 归一化恢复不改变图结构的节点/边数量。
const restored = normalizeFreeform(JSON.parse(JSON.stringify(saved)));
assert.equal(Object.keys(restored.nodes).length, Object.keys(saved.nodes).length);
assert.equal(restored.edges.length, saved.edges.length);

// 8. 开放线段必须被诊断出来，避免用户误以为它会进入导出。
let openGraph = defaultFreeform();
const openNode = addNode(openGraph, 0.5, 0.5);
openGraph = connect(openNode.graph, openNode.id, "frame-tl");
const openGeo = buildFreeformGeometry(openGraph, size.w, size.h);
assert.equal(openGeo.openEdges.length, 1);

// 9. 同一 sourceId 的区域读取同一份共享裁剪规则。
const sharedGraph = normalizeFreeform({
  ...radial,
  regionSettings: {
    [radialGeo.regions[0].id]: { mode: "shared", sourceId: "photo-shared", sharedCrop: { zoom: 1.4, ox: 0.2, oy: -0.1 } },
    [radialGeo.regions[1].id]: { mode: "shared", sourceId: "photo-shared", sharedCrop: { zoom: 1.8, ox: -0.3, oy: 0.25 } },
  },
});
const sharedSetting = resolveRegionSetting(sharedGraph, radialGeo.regions[1].id);
assert.equal(sharedSetting.crop.zoom, 1.4);

// 10. 四条边的交点生成带 side 的可编辑边界节点，重复命中复用同一节点。
let boundaryGraph = defaultFreeform();
const boundaryPoints = [
  ["top", 0.5, 0.001],
  ["right", 0.999, 0.5],
  ["bottom", 0.5, 0.999],
  ["left", 0.001, 0.5],
];
const boundaryIds = {};
boundaryPoints.forEach(([side, x, y]) => {
  const result = addNode(boundaryGraph, x, y);
  boundaryGraph = result.graph;
  boundaryIds[side] = result.id;
});
const duplicateTop = addNode(boundaryGraph, 0.502, 0.002);
assert.equal(duplicateTop.id, boundaryIds.top);
const boundaryGeo = buildFreeformGeometry(boundaryGraph, size.w, size.h);
assert.equal(boundaryGeo.nodes.filter((node) => node.boundary && !node.locked).length, 4);
assert.equal(boundaryGeo.edges.filter((edge) => edge.frame).length, 8);

// 11. 中心节点连接四边节点后形成区域；边界节点只能沿所属边移动。
const boundaryCenter = addNode(boundaryGraph, 0.5, 0.5);
boundaryGraph = boundaryCenter.graph;
Object.values(boundaryIds).forEach((id) => {
  boundaryGraph = connect(boundaryGraph, boundaryCenter.id, id);
});
const boundaryRegions = buildFreeformGeometry(boundaryGraph, size.w, size.h);
assert.equal(boundaryRegions.regions.length, 4);
const movedBoundary = moveFreeformNode(boundaryGraph, boundaryIds.top, { x: 0.72, y: 0.72 });
assert.equal(movedBoundary.nodes[boundaryIds.top].y, 0);
assert.equal(movedBoundary.nodes[boundaryIds.top].x, 0.72);

// 12. 边界节点拖到角点时合并 frame 节点，frame 角点和其连接线不可删除。
const mergedBoundary = moveFreeformNode(movedBoundary, boundaryIds.top, { x: 0.001, y: 0.001 });
assert.equal(mergedBoundary.nodes[boundaryIds.top], undefined);
assert.equal(mergedBoundary.nodes["frame-tl"].locked, true);
const afterRemove = removeFreeformNode(mergedBoundary, boundaryIds.right);
assert.equal(afterRemove.nodes[boundaryIds.right], undefined);
assert.equal(afterRemove.edges.some((edge) => edge.a === boundaryIds.right || edge.b === boundaryIds.right), false);
assert.equal(Object.keys(removeFreeformNode(afterRemove, "frame-tl").nodes).includes("frame-tl"), true);

console.log("自由不规则拼接专项自检");
console.log("────────────────────────────────────────");
console.log("✓ 斜线分区、中心放射、相交线自动拆分");
console.log("✓ 独立图片 / 整图切割元数据与缝合设置可保存");
console.log("✓ 节点移动后区域和 Canvas 槽位仍为真实多边形");
console.log("✓ 归一化恢复保留节点与边");
console.log("✓ 开放线段诊断与共享图片裁剪规则");
console.log("✓ 四边边界节点复用、拆分、沿边拖动、角点合并和删除规则");
console.log("12 / 12 项通过");
