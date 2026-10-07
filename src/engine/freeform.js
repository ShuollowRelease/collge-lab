/**
 * 自由不规则拼接的平面图引擎。
 *
 * 图数据全部使用 0–1 归一化坐标。矩形外框由四个固定节点和运行时生成的
 * 边界节点组成；用户边与外框边共同决定闭合区域。该模块不依赖 React 或 DOM，
 * 预览覆盖层和 Canvas 导出都只消费 buildFreeformGeometry 的结果。
 */

export const FREEFORM_EPSILON = 1e-5;
export const FREEFORM_SNAP_DISTANCE = 0.018;
export const FREEFORM_BOUNDARY_HIT_DISTANCE = 0.025;
export const FREEFORM_DRAG_THRESHOLD = 0.004;
export const FREEFORM_HIT_RADIUS_PX = 12;
export const FREEFORM_MIN_EDGE = 0.006;
export const FREEFORM_MAX_NODES = 128;
export const FREEFORM_MAX_EDGES = 256;
export const FREEFORM_SEAM_DEFAULT = {
  mode: "gap",
  width: 0.012,
  style: "solid",
  color: "background",
  opacity: 1,
};

const FRAME_NODE_DEFS = [
  ["frame-tl", 0, 0, "top"],
  ["frame-tr", 1, 0, "right"],
  ["frame-br", 1, 1, "bottom"],
  ["frame-bl", 0, 1, "left"],
];

const FREEFORM_BOUNDARY_SIDES = ["top", "right", "bottom", "left"];

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function finitePoint(point) {
  return Array.isArray(point) && point.length >= 2 && Number.isFinite(Number(point[0])) && Number.isFinite(Number(point[1]));
}

function pointDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointKey(x, y) {
  return `${Math.round(x * 100000)},${Math.round(y * 100000)}`;
}

function boundarySideForPoint(x, y, threshold = FREEFORM_EPSILON) {
  const distances = [
    [Math.abs(y), "top"],
    [Math.abs(x - 1), "right"],
    [Math.abs(y - 1), "bottom"],
    [Math.abs(x), "left"],
  ].sort((a, b) => a[0] - b[0]);
  return distances[0][0] <= threshold ? distances[0][1] : null;
}

function projectToBoundary(side, point) {
  const x = clamp01(point?.x);
  const y = clamp01(point?.y);
  if (side === "top" || side === "bottom") return { x, y: side === "top" ? 0 : 1, boundary: side };
  if (side === "left" || side === "right") return { x: side === "left" ? 0 : 1, y, boundary: side };
  return { x, y, boundary: null };
}

function edgeKey(a, b) {
  return [a, b].sort().join("~");
}

function nextId(prefix, entries) {
  const used = new Set(entries);
  let index = 1;
  while (used.has(`${prefix}-${index}`)) index += 1;
  return `${prefix}-${index}`;
}

function cloneCrop(crop) {
  return {
    zoom: Number(crop?.zoom ?? 1) || 1,
    ox: Number(crop?.ox ?? 0) || 0,
    oy: Number(crop?.oy ?? 0) || 0,
  };
}

export function defaultRegionSetting() {
  return {
    mode: "independent",
    photoId: null,
    sourceId: null,
    fit: "cover",
    crop: cloneCrop(),
    sharedCrop: cloneCrop(),
  };
}

export function defaultFreeform() {
  const nodes = {};
  FRAME_NODE_DEFS.forEach(([id, x, y, side]) => {
    nodes[id] = { id, x, y, boundary: side, locked: true };
  });
  return {
    nodes,
    edges: [],
    regionSettings: {},
    seam: { ...FREEFORM_SEAM_DEFAULT },
  };
}

function normalizeNode(id, raw) {
  const x = clamp01(raw?.x);
  const y = clamp01(raw?.y);
  const boundary = FREEFORM_BOUNDARY_SIDES.includes(raw?.boundary)
    ? raw.boundary
    : boundarySideForPoint(x, y);
  return {
    id,
    x,
    y,
    boundary,
    locked: !!raw?.locked || id.startsWith("frame-"),
  };
}

function normalizeEdge(id, raw) {
  return { id, a: String(raw?.a || ""), b: String(raw?.b || "") };
}

export function normalizeFreeform(raw) {
  const base = defaultFreeform();
  const source = raw && typeof raw === "object" ? raw : {};
  const nodes = { ...base.nodes };
  Object.entries(source.nodes || {}).forEach(([id, node]) => {
    if (!id || !node || !Number.isFinite(Number(node.x)) || !Number.isFinite(Number(node.y))) return;
    nodes[id] = normalizeNode(id, node);
  });
  FRAME_NODE_DEFS.forEach(([id, x, y, side]) => {
    nodes[id] = { ...nodes[id], id, x, y, boundary: side, locked: true };
  });

  const edges = [];
  const seen = new Set();
  const rawEdges = Array.isArray(source.edges)
    ? source.edges.map((edge, index) => [edge?.id || `edge-${index + 1}`, edge])
    : Object.entries(source.edges || {});
  rawEdges.forEach(([id, edge]) => {
    const item = normalizeEdge(edge?.id || id, edge);
    if (!nodes[item.a] || !nodes[item.b] || item.a === item.b) return;
    const key = edgeKey(item.a, item.b);
    if (seen.has(key)) return;
    seen.add(key);
    edges.push(item);
  });

  const regionSettings = {};
  Object.entries(source.regionSettings || {}).forEach(([id, setting]) => {
    const mode = setting?.mode === "shared" ? "shared" : "independent";
    const sourceId = mode === "shared" ? setting?.sourceId || setting?.photoId || null : null;
    regionSettings[id] = {
      ...defaultRegionSetting(),
      ...(setting || {}),
      mode,
      sourceId,
      crop: cloneCrop(setting?.crop),
      sharedCrop: cloneCrop(setting?.sharedCrop || (mode === "shared" ? setting?.crop : null)),
    };
  });

  const seam = {
    ...FREEFORM_SEAM_DEFAULT,
    ...(source.seam || {}),
    mode: source.seam?.mode === "stitch" ? "stitch" : "gap",
    width: Math.max(0, Math.min(0.08, Number(source.seam?.width ?? FREEFORM_SEAM_DEFAULT.width) || 0)),
    opacity: Math.max(0, Math.min(1, Number(source.seam?.opacity ?? FREEFORM_SEAM_DEFAULT.opacity) || 0)),
  };

  return { ...base, ...source, nodes, edges, regionSettings, seam };
}

/** 返回区域最终使用的设置；共享图片组统一从首个同源区域读取全局裁剪参数。 */
export function resolveRegionSetting(rawGraph, regionId) {
  const graph = normalizeFreeform(rawGraph);
  const current = { ...defaultRegionSetting(), ...(graph.regionSettings?.[regionId] || {}) };
  if (current.mode !== "shared") return { ...current, crop: cloneCrop(current.crop) };

  const sourceId = current.sourceId || current.photoId || null;
  const group = Object.values(graph.regionSettings || {}).find((setting) => {
    if (setting?.mode !== "shared") return false;
    return (setting.sourceId || setting.photoId || null) === sourceId && (setting.sharedCrop || setting.crop);
  });
  return {
    ...current,
    sourceId,
    crop: cloneCrop(group?.sharedCrop || group?.crop || current.sharedCrop || current.crop),
  };
}

function frameSideForPoint(x, y) {
  return boundarySideForPoint(x, y, FREEFORM_SNAP_DISTANCE);
}

export function snapFreeformPoint(graph, point, ignoreId = null) {
  const x = clamp01(point?.x);
  const y = clamp01(point?.y);
  const nodes = Object.values(graph?.nodes || {});
  let best = null;
  nodes.forEach((node) => {
    if (node.id === ignoreId) return;
    const distance = Math.hypot(node.x - x, node.y - y);
    if (distance <= FREEFORM_SNAP_DISTANCE && (!best || distance < best.distance)) {
      best = { id: node.id, x: node.x, y: node.y, distance };
    }
  });
  if (best) return { ...best, boundary: graph.nodes[best.id]?.boundary || null };
  const side = frameSideForPoint(x, y);
  if (!side) return { x, y, boundary: null };
  if (side === "top" || side === "bottom") return { x, y: side === "top" ? 0 : 1, boundary: side };
  return { x: side === "left" ? 0 : 1, y, boundary: side };
}

function segmentIntersection(a, b, c, d) {
  const rX = b.x - a.x;
  const rY = b.y - a.y;
  const sX = d.x - c.x;
  const sY = d.y - c.y;
  const den = rX * sY - rY * sX;
  if (Math.abs(den) <= FREEFORM_EPSILON) return null;
  const qX = c.x - a.x;
  const qY = c.y - a.y;
  const t = (qX * sY - qY * sX) / den;
  const u = (qX * rY - qY * rX) / den;
  if (t <= FREEFORM_EPSILON || t >= 1 - FREEFORM_EPSILON || u <= FREEFORM_EPSILON || u >= 1 - FREEFORM_EPSILON) return null;
  return { t, u, x: a.x + t * rX, y: a.y + t * rY };
}

function segmentsOverlap(a, b, c, d) {
  const cross = (uX, uY, vX, vY) => uX * vY - uY * vX;
  const abX = b.x - a.x;
  const abY = b.y - a.y;
  if (Math.abs(cross(abX, abY, c.x - a.x, c.y - a.y)) > FREEFORM_EPSILON) return false;
  if (Math.abs(cross(abX, abY, d.x - a.x, d.y - a.y)) > FREEFORM_EPSILON) return false;
  const axis = Math.abs(abX) >= Math.abs(abY) ? "x" : "y";
  const first = [a[axis], b[axis]].sort((x, y) => x - y);
  const second = [c[axis], d[axis]].sort((x, y) => x - y);
  return Math.min(first[1], second[1]) - Math.max(first[0], second[0]) > FREEFORM_MIN_EDGE;
}

function splitEdgesAtIntersections(graph) {
  const nodes = { ...graph.nodes };
  const edges = graph.edges.map((edge) => ({ ...edge }));
  const cuts = new Map(edges.map((edge) => [edge.id, [{ t: 0, id: edge.a }, { t: 1, id: edge.b }]]));
  const nodeAt = new Map(Object.values(nodes).map((node) => [pointKey(node.x, node.y), node.id]));
  let changed = false;

  for (let i = 0; i < edges.length; i += 1) {
    const first = edges[i];
    const a = nodes[first.a];
    const b = nodes[first.b];
    if (!a || !b) continue;
    for (let j = i + 1; j < edges.length; j += 1) {
      const second = edges[j];
      if (first.a === second.a || first.a === second.b || first.b === second.a || first.b === second.b) continue;
      const c = nodes[second.a];
      const d = nodes[second.b];
      if (!c || !d) continue;
      const hit = segmentIntersection(a, b, c, d);
      if (!hit) continue;
      const key = pointKey(hit.x, hit.y);
      let id = nodeAt.get(key);
      if (!id) {
        id = nextId("node", Object.keys(nodes));
        nodes[id] = { id, x: hit.x, y: hit.y, boundary: null, locked: false };
        nodeAt.set(key, id);
      }
      cuts.get(first.id).push({ t: hit.t, id });
      cuts.get(second.id).push({ t: hit.u, id });
      changed = true;
    }
  }

  if (!changed) return graph;
  const nextEdges = [];
  edges.forEach((edge) => {
    const list = cuts.get(edge.id).sort((a, b) => a.t - b.t);
    for (let i = 0; i < list.length - 1; i += 1) {
      if (list[i].id === list[i + 1].id) continue;
      nextEdges.push({ id: `${edge.id}:${i + 1}`, a: list[i].id, b: list[i + 1].id });
    }
  });
  return { ...graph, nodes, edges: dedupeEdges(nextEdges) };
}

function dedupeEdges(edges) {
  const seen = new Set();
  return edges.filter((edge) => {
    if (!edge.a || !edge.b || edge.a === edge.b) return false;
    const key = edgeKey(edge.a, edge.b);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function addFreeformNode(rawGraph, point) {
  const graph = normalizeFreeform(rawGraph);
  if (Object.keys(graph.nodes).length >= FREEFORM_MAX_NODES) return { graph, id: null };
  const snapped = snapFreeformPoint(graph, point);
  if (snapped.id) return { graph, id: snapped.id };
  const id = nextId("node", Object.keys(graph.nodes));
  graph.nodes[id] = { id, x: snapped.x, y: snapped.y, boundary: snapped.boundary, locked: false };
  return { graph, id };
}

export function connectFreeformNodes(rawGraph, a, b) {
  const graph = normalizeFreeform(rawGraph);
  if (!graph.nodes[a] || !graph.nodes[b] || a === b || graph.edges.length >= FREEFORM_MAX_EDGES) return graph;
  const first = graph.nodes[a];
  const second = graph.nodes[b];
  if (Math.hypot(first.x - second.x, first.y - second.y) < FREEFORM_MIN_EDGE) return graph;
  if (graph.edges.some((edge) => edgeKey(edge.a, edge.b) === edgeKey(a, b))) return graph;
  if (
    graph.edges.some((edge) => {
      const otherA = graph.nodes[edge.a];
      const otherB = graph.nodes[edge.b];
      return otherA && otherB && segmentsOverlap(first, second, otherA, otherB);
    })
  ) {
    return graph;
  }
  const id = nextId("edge", graph.edges.map((edge) => edge.id));
  return splitEdgesAtIntersections({ ...graph, edges: [...graph.edges, { id, a, b }] });
}

export function connectFreeformToPoint(rawGraph, nodeId, point) {
  const base = normalizeFreeform(rawGraph);
  const result = addFreeformNode(base, point);
  if (!result.id || result.id === nodeId) return result.graph;
  return connectFreeformNodes(result.graph, nodeId, result.id);
}

export function insertFreeformNode(rawGraph, edgeId, point) {
  const graph = normalizeFreeform(rawGraph);
  const edge = graph.edges.find((item) => item.id === edgeId);
  if (!edge) return { graph, id: null };
  const a = graph.nodes[edge.a];
  const b = graph.nodes[edge.b];
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const len2 = vx * vx + vy * vy || 1;
  const t = Math.max(0.05, Math.min(0.95, ((point.x - a.x) * vx + (point.y - a.y) * vy) / len2));
  const result = addFreeformNode(graph, { x: a.x + vx * t, y: a.y + vy * t });
  if (!result.id || result.id === edge.a || result.id === edge.b) return result;
  const edges = graph.edges.filter((item) => item.id !== edge.id);
  const next = { ...result.graph, edges };
  const first = connectFreeformNodes(next, edge.a, result.id);
  return { graph: connectFreeformNodes(first, result.id, edge.b), id: result.id };
}

function mergeFreeformNodes(rawGraph, sourceId, targetId) {
  const graph = normalizeFreeform(rawGraph);
  if (!graph.nodes[sourceId] || !graph.nodes[targetId] || sourceId === targetId) return graph;
  const edges = graph.edges.map((edge) => ({
    ...edge,
    a: edge.a === sourceId ? targetId : edge.a,
    b: edge.b === sourceId ? targetId : edge.b,
  }));
  delete graph.nodes[sourceId];
  graph.edges = dedupeEdges(edges);
  return graph;
}

export function moveFreeformNode(rawGraph, nodeId, point) {
  const graph = normalizeFreeform(rawGraph);
  const node = graph.nodes[nodeId];
  if (!node || node.locked) return graph;
  let snapped;
  if (node.boundary) {
    const projected = projectToBoundary(node.boundary, point);
    const nearest = Object.values(graph.nodes)
      .filter((candidate) => candidate.id !== nodeId && (candidate.locked || candidate.boundary === node.boundary))
      .map((candidate) => ({ candidate, distance: pointDistance(candidate, projected) }))
      .sort((a, b) => a.distance - b.distance)[0];
    if (nearest && nearest.distance <= FREEFORM_SNAP_DISTANCE) {
      return splitEdgesAtIntersections(mergeFreeformNodes(graph, nodeId, nearest.candidate.id));
    }
    snapped = projected;
  } else {
    snapped = snapFreeformPoint(graph, point, nodeId);
  }
  graph.nodes[nodeId] = { ...node, x: snapped.x, y: snapped.y, boundary: snapped.boundary };
  return splitEdgesAtIntersections(graph);
}

export function removeFreeformNode(rawGraph, nodeId) {
  const graph = normalizeFreeform(rawGraph);
  if (!graph.nodes[nodeId] || graph.nodes[nodeId].locked) return graph;
  delete graph.nodes[nodeId];
  graph.edges = graph.edges.filter((edge) => edge.a !== nodeId && edge.b !== nodeId);
  return graph;
}

export function removeFreeformEdge(rawGraph, edgeId) {
  const graph = normalizeFreeform(rawGraph);
  graph.edges = graph.edges.filter((edge) => edge.id !== edgeId);
  return graph;
}

function addFrameEdges(graph) {
  const nodes = Object.values(graph.nodes);
  const bySide = { top: [], right: [], bottom: [], left: [] };
  nodes.forEach((node) => {
    if (Math.abs(node.y) <= FREEFORM_EPSILON) bySide.top.push(node);
    if (Math.abs(node.x - 1) <= FREEFORM_EPSILON) bySide.right.push(node);
    if (Math.abs(node.y - 1) <= FREEFORM_EPSILON) bySide.bottom.push(node);
    if (Math.abs(node.x) <= FREEFORM_EPSILON) bySide.left.push(node);
  });
  const order = {
    top: (a, b) => a.x - b.x,
    right: (a, b) => a.y - b.y,
    bottom: (a, b) => b.x - a.x,
    left: (a, b) => b.y - a.y,
  };
  const frameEdges = [];
  Object.entries(bySide).forEach(([side, list]) => {
    list.sort(order[side]);
    for (let i = 0; i < list.length - 1; i += 1) {
      frameEdges.push({ id: `frame:${side}:${i}`, a: list[i].id, b: list[i + 1].id, frame: true });
    }
  });
  const userKeys = new Set(graph.edges.map((edge) => edgeKey(edge.a, edge.b)));
  return frameEdges.filter((edge) => !userKeys.has(edgeKey(edge.a, edge.b)));
}

function signedArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
}

function canonicalCycle(ids) {
  if (!ids.length) return ids;
  let best = null;
  for (let i = 0; i < ids.length; i += 1) {
    const rotated = [...ids.slice(i), ...ids.slice(0, i)].join("|");
    if (best === null || rotated < best.key) best = { key: rotated, ids: [...ids.slice(i), ...ids.slice(0, i)] };
  }
  return best.ids;
}

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    const hit = a.y > point.y !== b.y > point.y && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y || FREEFORM_EPSILON) + a.x;
    if (hit) inside = !inside;
  }
  return inside;
}

function boundsOf(points) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}

function isSimplePolygon(points) {
  const unique = new Set(points.map((point) => point.id || pointKey(point.x, point.y)));
  if (unique.size !== points.length) return false;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    for (let j = i + 1; j < points.length; j += 1) {
      if (j === i || j === i + 1 || (i === 0 && j === points.length - 1)) continue;
      const c = points[j];
      const d = points[(j + 1) % points.length];
      if (segmentIntersection(a, b, c, d)) return false;
    }
  }
  return true;
}

/**
 * 构建平面图、闭合区域和预览命中数据。
 * W/H 只影响输出像素坐标，graph 本身仍保持归一化数据。
 */
export function buildFreeformGeometry(rawGraph, W, H) {
  // 读取旧数据时也重新拆分相交边，保证 nodes / edges / regions 始终来自同一拓扑。
  const graph = splitEdgesAtIntersections(normalizeFreeform(rawGraph));
  const frameEdges = addFrameEdges(graph);
  const allEdges = [...graph.edges, ...frameEdges];
  const adjacency = new Map(Object.keys(graph.nodes).map((id) => [id, []]));
  allEdges.forEach((edge) => {
    if (!adjacency.has(edge.a) || !adjacency.has(edge.b)) return;
    adjacency.get(edge.a).push({ to: edge.b, edge });
    adjacency.get(edge.b).push({ to: edge.a, edge });
  });
  adjacency.forEach((list, id) => {
    const origin = graph.nodes[id];
    list.sort((a, b) => {
      const pa = graph.nodes[a.to];
      const pb = graph.nodes[b.to];
      return Math.atan2(pa.y - origin.y, pa.x - origin.x) - Math.atan2(pb.y - origin.y, pb.x - origin.x);
    });
  });

  const visited = new Set();
  const regions = [];
  const regionIds = new Set();
  const halfKey = (a, b) => `${a}>${b}`;
  adjacency.forEach((list, from) => {
    list.forEach(({ to: firstTo }) => {
      const startKey = halfKey(from, firstTo);
      if (visited.has(startKey)) return;
      const cycle = [];
      let a = from;
      let b = firstTo;
      let guard = 0;
      while (guard < allEdges.length * 4 + 8) {
        guard += 1;
        const currentKey = halfKey(a, b);
        if (visited.has(currentKey)) break;
        visited.add(currentKey);
        cycle.push(a);
        const outgoing = adjacency.get(b) || [];
        const reverseIndex = outgoing.findIndex((item) => item.to === a);
        if (reverseIndex < 0) break;
        const next = outgoing[(reverseIndex - 1 + outgoing.length) % outgoing.length];
        a = b;
        b = next.to;
        if (a === from && b === firstTo) break;
      }
      if (cycle.length < 3) return;
      const points = cycle.map((id) => graph.nodes[id]).filter(Boolean);
      const area = signedArea(points);
      if (area <= FREEFORM_EPSILON || !isSimplePolygon(points)) return;
      const ids = canonicalCycle(cycle);
      const id = `region:${ids.join("|")}`;
      if (regionIds.has(id)) return;
      regionIds.add(id);
      const edgeKeys = ids.map((nodeId, index) => edgeKey(nodeId, ids[(index + 1) % ids.length]));
      const centroid = points.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), { x: 0, y: 0 });
      centroid.x /= points.length;
      centroid.y /= points.length;
      regions.push({
        id,
        nodeIds: ids,
        points,
        pointsPx: points.map((point) => [point.x * W, point.y * H]),
        edgeKeys,
        area,
        centroid,
        bounds: boundsOf(points),
      });
    });
  });

  const edgeCounts = new Map();
  regions.forEach((region) => region.edgeKeys.forEach((key) => edgeCounts.set(key, (edgeCounts.get(key) || 0) + 1)));
  const openEdges = graph.edges.filter((edge) => !edgeCounts.has(edgeKey(edge.a, edge.b)));
  const sharedEdges = [];
  const drawn = new Set();
  regions.forEach((region) => {
    region.edgeKeys.forEach((key, index) => {
      if ((edgeCounts.get(key) || 0) < 2 || drawn.has(key)) return;
      drawn.add(key);
      const a = graph.nodes[region.nodeIds[index]];
      const b = graph.nodes[region.nodeIds[(index + 1) % region.nodeIds.length]];
      sharedEdges.push({ key, a: [a.x * W, a.y * H], b: [b.x * W, b.y * H] });
    });
  });

  return {
    kind: "freeform",
    graph,
    nodes: Object.values(graph.nodes).map((node) => ({ ...node, xPx: node.x * W, yPx: node.y * H })),
    edges: allEdges.map((edge) => ({
      ...edge,
      aPoint: [graph.nodes[edge.a].x * W, graph.nodes[edge.a].y * H],
      bPoint: [graph.nodes[edge.b].x * W, graph.nodes[edge.b].y * H],
    })),
    regions,
    openEdges,
    sharedEdges,
    geom: { w: W, h: H },
    regionAt(point) {
      return regions.find((region) => pointInPolygon(point, region.points)) || null;
    },
  };
}

function distanceToSegment(point, a, b) {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const len2 = vx * vx + vy * vy || 1;
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * vx + (point.y - a.y) * vy) / len2));
  return { distance: Math.hypot(point.x - (a.x + vx * t), point.y - (a.y + vy * t)), t };
}

export function hitTestFreeform(geo, point, tolerancePx = 10) {
  if (!geo) return null;
  const tolerance = tolerancePx / Math.max(geo.geom.w, geo.geom.h, 1);
  let nodeHit = null;
  geo.nodes.forEach((node) => {
    const distance = Math.hypot(point.x - node.x, point.y - node.y);
    if (distance <= tolerance && (!nodeHit || distance < nodeHit.distance)) nodeHit = { kind: "node", id: node.id, distance };
  });
  if (nodeHit) return nodeHit;
  let edgeHit = null;
  geo.edges.forEach((edge) => {
    const hit = distanceToSegment(point, { x: edge.aPoint[0] / geo.geom.w, y: edge.aPoint[1] / geo.geom.h }, { x: edge.bPoint[0] / geo.geom.w, y: edge.bPoint[1] / geo.geom.h });
    if (hit.distance <= tolerance && (!edgeHit || hit.distance < edgeHit.distance)) edgeHit = { kind: "edge", id: edge.id, distance: hit.distance };
  });
  if (edgeHit) return edgeHit;
  const region = geo.regionAt(point);
  return region ? { kind: "region", id: region.id } : null;
}

export function freeformInsetPolygon(points, insetPx) {
  if (!Array.isArray(points) || points.length < 3 || insetPx <= 0) return points;
  const cx = points.reduce((sum, point) => sum + point[0], 0) / points.length;
  const cy = points.reduce((sum, point) => sum + point[1], 0) / points.length;
  const radius = Math.max(1, Math.min(...points.map((point) => Math.hypot(point[0] - cx, point[1] - cy))));
  const scale = Math.max(0.08, 1 - insetPx / radius);
  return points.map(([x, y]) => [cx + (x - cx) * scale, cy + (y - cy) * scale]);
}
