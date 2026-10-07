import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { dividerBounds, hitTest, isDragActive, pxToNorm } from "../engine/grid.js";
import { HANDLE_HIT_PX } from "../engine/constants.js";
import { hasShape, shapeOutlinePoints } from "../engine/shapes.js";

/**
 * 自定义网格编辑层（仅预览可见，绝不进入导出路径）。
 *
 * 交互：
 *   拖分隔线   → 整条分隔线上的交叉点一起平移（节点共享形变）
 *   拖交叉点   → 只动该点，四周格子同步变形
 *   点格子     → 选中 / 取消选中；Ctrl（或「多选」开关）为切换
 *   空白处拖动 → 框选
 *
 * 几何全部读自 engine/grid.js，本组件不重复计算布局，也不写死颜色尺寸。
 * 坐标系与 paintCollage 的画布像素一致（size.w × size.h）；显示层用 viewBox
 * 映射到 canvas 的 CSS 尺寸，避免缩放后虚线与图片错位。
 */
export default function CustomGridOverlay({
  grid,
  geo,
  canvasRef,
  selected,
  multi,
  onGridChange,
  onGridBegin,
  onGridCommit,
  onToggleCell,
  onSetSelection,
  onPickCell,
}) {
  const hostRef = useRef(null);
  const drag = useRef(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState(null);
  const [band, setBand] = useState(null);
  const [dragging, setDragging] = useState(false);

  /** 几何坐标系尺寸（与 customGridGeometry / paintCollage 同一 W/H）。 */
  const coord = useMemo(() => {
    const pad = geo?.geom?.pad ?? 0;
    const spanX = geo?.geom?.spanX ?? 0;
    const spanY = geo?.geom?.spanY ?? 0;
    return { w: Math.max(1, spanX + pad * 2), h: Math.max(1, spanY + pad * 2) };
  }, [geo]);

  // 覆盖层尺寸跟随 canvas 的实际渲染尺寸（窗口缩放、主题切换都会变）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const sync = () => setBox({ w: canvas.clientWidth, h: canvas.clientHeight });
    sync();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", sync);
      return () => window.removeEventListener("resize", sync);
    }
    const ro = new ResizeObserver(sync);
    ro.observe(canvas);
    window.addEventListener("resize", sync);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [canvasRef]);

  /** 指针位置 → 几何坐标（画布像素），与 geo / 绘制共用同一坐标系。 */
  const toLocal = useCallback(
    (e) => {
      const rect = hostRef.current?.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) return [0, 0];
      const sx = coord.w / rect.width;
      const sy = coord.h / rect.height;
      return [(e.clientX - rect.left) * sx, (e.clientY - rect.top) * sy];
    },
    [coord.w, coord.h]
  );

  /** 交叉点当前偏移（归一化）。 */
  const offsetOf = useCallback(
    (c, r) => {
      const n = grid.nodes?.[`${c},${r}`];
      return [n?.dx || 0, n?.dy || 0];
    },
    [grid.nodes]
  );

  const onPointerDown = (e) => {
    // 正在处理一个指针时忽略其它指针，避免第二次按下覆盖拖拽起点。
    if (e.button !== 0 || drag.current) return;
    const p = toLocal(e);
    const hit = hitTest(geo, p);
    const nx = pxToNorm(p[0], geo.geom.pad, geo.geom.spanX);
    const ny = pxToNorm(p[1], geo.geom.pad, geo.geom.spanY);

    if (hit?.kind === "node") {
      drag.current = {
        kind: "node",
        pointerId: e.pointerId,
        c: hit.c,
        r: hit.r,
        start: p,
        startNorm: [nx, ny],
        startOffset: offsetOf(hit.c, hit.r),
        dragging: false,
      };
    } else if (hit?.kind === "divider") {
      const base = hit.axis === "x" ? geo.colsX[hit.i] : geo.rowsY[hit.i];
      drag.current = {
        kind: "divider",
        pointerId: e.pointerId,
        axis: hit.axis,
        i: hit.i,
        start: p,
        startNorm: [nx, ny],
        startBase: base,
        dragging: false,
      };
    } else {
      drag.current = { kind: "band", pointerId: e.pointerId, start: p, dragging: false };
      if (hit?.kind === "cell") onPickCell?.(hit.index);
    }
    // 捕获必须落在实际接收 pointerdown 的元素上；自动化事件或浏览器取消时
    // setPointerCapture 可能抛出异常，不能让一次拖拽中断组件事件链。
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      /* 指针已失效时仍保留普通 move/up 清理路径 */
    }
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (d?.pointerId != null && d.pointerId !== e.pointerId) return;
    const [lx, ly] = toLocal(e);

    if (!d) {
      setHover(hitTest(geo, [lx, ly]));
      return;
    }

    if (isDragActive(lx - d.start[0], ly - d.start[1]) && !d.dragging) {
      d.dragging = true;
      setDragging(true);
      // 拖拽起点入撤销栈：后续 onGridDrag 高频更新不再重复压栈
      if (d.kind === "node" || d.kind === "divider") onGridBegin?.();
    }

    if (d.kind === "band") {
      if (!d.dragging) return;
      setBand({
        x: Math.min(d.start[0], lx),
        y: Math.min(d.start[1], ly),
        w: Math.abs(lx - d.start[0]),
        h: Math.abs(ly - d.start[1]),
      });
      return;
    }
    if (!d.dragging) return;

    if (d.kind === "divider") {
      const isX = d.axis === "x";
      const arr = isX ? geo.colsX : geo.rowsY;
      const minU = isX ? geo.geom.ux : geo.geom.uy;
      const { lo, hi } = dividerBounds(arr, d.i, minU);
      const currentNorm = isX
        ? pxToNorm(lx, geo.geom.pad, geo.geom.spanX)
        : pxToNorm(ly, geo.geom.pad, geo.geom.spanY);
      const startNorm = isX ? d.startNorm[0] : d.startNorm[1];
      const value = Math.max(lo, Math.min(hi, d.startBase + currentNorm - startNorm));
      onGridChange?.({ type: "divider", axis: d.axis, i: d.i, value, start: d.startBase });
      return;
    }

    if (d.kind === "node") {
      const nx = pxToNorm(lx, geo.geom.pad, geo.geom.spanX);
      const ny = pxToNorm(ly, geo.geom.pad, geo.geom.spanY);
      const [ox, oy] = d.startOffset;
      onGridChange?.({
        type: "node",
        c: d.c,
        r: d.r,
        // 只约束水平方向就必须让垂直方向保持原值（反之亦然）
        dx: ox + nx - d.startNorm[0],
        dy: oy + ny - d.startNorm[1],
      });
    }
  };

  const finishPointer = (e, cancelled = false) => {
    const d = drag.current;
    if (d?.pointerId != null && d.pointerId !== e.pointerId) return;
    drag.current = null;
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      /* 指针捕获可能已由浏览器取消 */
    }
    if (!d) return;

    if (d.kind === "band") {
      setBand(null);
      if (cancelled) return;
      const [lx, ly] = toLocal(e);
      if (!d.dragging) {
        // 空白处单击＝清空选择；多选模式下保留选择，避免误清
        if (!multi) onSetSelection?.([]);
        else onGridCommit?.();
        return;
      }
      const x0 = Math.min(d.start[0], lx);
      const x1 = Math.max(d.start[0], lx);
      const y0 = Math.min(d.start[1], ly);
      const y1 = Math.max(d.start[1], ly);
      const inside = geo.cells
        .filter(
          (cell) =>
            cell.rect.x + cell.rect.w > x0 &&
            cell.rect.x < x1 &&
            cell.rect.y + cell.rect.h > y0 &&
            cell.rect.y < y1
        )
        .map((cell) => cell.index);
      onSetSelection?.(inside);
      return;
    }

    if (d.dragging && !cancelled) onGridCommit?.();
  };

  const onPointerUp = (e) => finishPointer(e, false);
  const onPointerCancel = (e) => finishPointer(e, true);

  const onCellClick = (e, index) => {
    if (e.ctrlKey || e.metaKey || multi) onToggleCell?.(index);
    else onSetSelection?.(selected.includes(index) ? [] : [index]);
  };

  const cursor = dragging
    ? "grabbing"
    : hover?.kind === "node" || hover?.kind === "divider"
      ? "grab"
      : "default";

  if (box.w <= 0 || box.h <= 0) {
    return <div className="grid-overlay" ref={hostRef} aria-hidden />;
  }

  /** 形状格子的可见轮廓：与 pathShape / drawCover 裁剪区域对齐，而不是外接矩形。 */
  const cellOutline = (cell) => {
    if (hasShape(cell.shape)) {
      const pts = shapeOutlinePoints(cell.shape, cell.rect);
      if (pts.length) return pts.map((p) => p.join(",")).join(" ");
    }
    return cell.pts.map((p) => p.join(",")).join(" ");
  };

  return (
    <div
      className="grid-overlay"
      ref={hostRef}
      style={{ width: box.w, height: box.h, cursor }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={() => !drag.current && setHover(null)}
    >
      <svg
        className="grid-overlay-svg"
        width={box.w}
        height={box.h}
        viewBox={`0 0 ${coord.w} ${coord.h}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        {geo.cells.map((cell) => (
          <polygon
            key={`cell-${cell.index}`}
            className={`grid-cell${selected.includes(cell.index) ? " is-selected" : ""}${
              cell.shape ? " has-shape" : ""
            }`}
            points={cellOutline(cell)}
            onClick={(e) => onCellClick(e, cell.index)}
          />
        ))}

        {geo.dividers.map((d) => (
          <line
            key={`d-${d.axis}-${d.i}`}
            className={`grid-divider${
              hover?.kind === "divider" && hover.axis === d.axis && hover.i === d.i ? " is-hot" : ""
            }`}
            x1={d.a[0]}
            y1={d.a[1]}
            x2={d.b[0]}
            y2={d.b[1]}
          />
        ))}

        {geo.nodes.map((n) => {
          const hot = hover?.kind === "node" && hover.c === n.c && hover.r === n.r;
          return (
            <g key={`n-${n.c}-${n.r}`}>
              <circle
                className="grid-node-hit"
                cx={n.x}
                cy={n.y}
                r={HANDLE_HIT_PX}
                aria-hidden="true"
              />
              <circle
                className={`grid-node${hot ? " is-hot" : ""}`}
                cx={n.x}
                cy={n.y}
                r={hot ? 7 : 5}
                aria-hidden="true"
              />
            </g>
          );
        })}

        {band && <rect className="grid-band" x={band.x} y={band.y} width={band.w} height={band.h} />}
      </svg>
    </div>
  );
}
