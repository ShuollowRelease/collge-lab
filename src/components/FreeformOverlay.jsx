import { useCallback, useEffect, useRef, useState } from "react";

import {
  addFreeformNode,
  connectFreeformNodes,
  connectFreeformToPoint,
  FREEFORM_BOUNDARY_HIT_DISTANCE,
  FREEFORM_DRAG_THRESHOLD,
  FREEFORM_HIT_RADIUS_PX,
  hitTestFreeform,
  insertFreeformNode,
  moveFreeformNode,
  removeFreeformEdge,
  removeFreeformNode,
} from "../engine/freeform.js";

/**
 * 自由拼接预览编辑层。SVG 只负责显示和命中转译，所有图结构修改都回调
 * engine/freeform.js 的纯函数；辅助节点和控制线不会进入 Canvas 导出。
 */
export default function FreeformOverlay({
  graph,
  geo,
  canvasRef,
  tool,
  selectedRegion,
  onRegionPick,
  onGraphChange,
  onGraphBegin,
  onGraphCommit,
}) {
  const hostRef = useRef(null);
  const dragRef = useRef(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState(null);
  const [connectStart, setConnectStart] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const sync = () => setBox({ w: canvas.clientWidth, h: canvas.clientHeight });
    sync();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(sync);
    ro?.observe(canvas);
    window.addEventListener("resize", sync);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [canvasRef]);

  useEffect(() => {
    if (tool !== "connect") setConnectStart(null);
  }, [tool]);

  const toNorm = useCallback(
    (event) => {
      const rect = hostRef.current?.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };
      return {
        x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
        y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
      };
    },
    []
  );

  const update = useCallback(
    (next) => onGraphChange?.(next),
    [onGraphChange]
  );

  const commitGraph = useCallback(
    (next) => {
      onGraphBegin?.();
      update(next);
      onGraphCommit?.();
    },
    [onGraphBegin, onGraphCommit, update]
  );

  const onPointerDown = (event) => {
    if (event.button !== 0 || !geo || dragRef.current) return;
    const point = toNorm(event);
    const hit = hitTestFreeform(geo, point, FREEFORM_HIT_RADIUS_PX);
    setHover(hit);

    if (tool === "select") {
      if (hit?.kind === "node" && !geo.graph.nodes[hit.id]?.locked) {
        dragRef.current = { id: hit.id, point, moved: false, pointerId: event.pointerId };
        try {
          event.currentTarget.setPointerCapture?.(event.pointerId);
        } catch {
          /* 指针已失效时仍保留普通事件清理路径 */
        }
      } else if (hit?.kind === "region") {
        onRegionPick?.(hit.id);
      }
      event.preventDefault();
      return;
    }

    if (tool === "connect") {
      if (hit?.kind === "node") {
        if (!connectStart) setConnectStart(hit.id);
        else if (connectStart !== hit.id) {
          commitGraph(connectFreeformNodes(graph, connectStart, hit.id));
          setConnectStart(null);
        }
      } else if (
        connectStart &&
        (point.x <= FREEFORM_BOUNDARY_HIT_DISTANCE ||
          point.x >= 1 - FREEFORM_BOUNDARY_HIT_DISTANCE ||
          point.y <= FREEFORM_BOUNDARY_HIT_DISTANCE ||
          point.y >= 1 - FREEFORM_BOUNDARY_HIT_DISTANCE)
      ) {
        commitGraph(connectFreeformToPoint(graph, connectStart, point));
        setConnectStart(null);
      }
      event.preventDefault();
      return;
    }

    if (tool === "node") {
      commitGraph(addFreeformNode(graph, point).graph);
      event.preventDefault();
      return;
    }

    if (tool === "insert" && hit?.kind === "edge" && !hit.id.startsWith("frame:")) {
      commitGraph(insertFreeformNode(graph, hit.id, point).graph);
      event.preventDefault();
      return;
    }

    if (tool === "delete") {
      if (hit?.kind === "node") commitGraph(removeFreeformNode(graph, hit.id));
      else if (hit?.kind === "edge" && !hit.id.startsWith("frame:")) commitGraph(removeFreeformEdge(graph, hit.id));
      event.preventDefault();
    }
  };

  const onPointerMove = (event) => {
    const point = toNorm(event);
    const drag = dragRef.current;
    if (drag?.pointerId != null && drag.pointerId !== event.pointerId) return;
    if (!drag) {
      setHover(hitTestFreeform(geo, point, FREEFORM_HIT_RADIUS_PX));
      return;
    }
    if (!drag.moved) {
      const dx = point.x - drag.point.x;
      const dy = point.y - drag.point.y;
      if (Math.hypot(dx, dy) < FREEFORM_DRAG_THRESHOLD) return;
      drag.moved = true;
      onGraphBegin?.();
    }
    update(moveFreeformNode(graph, drag.id, point));
    event.preventDefault();
  };

  const finishPointer = (event, cancelled = false) => {
    const drag = dragRef.current;
    if (drag?.pointerId != null && drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      /* 指针捕获可能已由浏览器取消 */
    }
    if (drag?.moved && !cancelled) onGraphCommit?.();
  };

  const onPointerUp = (event) => finishPointer(event, false);
  const onPointerCancel = (event) => finishPointer(event, true);

  if (!geo || box.w <= 0 || box.h <= 0) return <div className="grid-overlay freeform-overlay" ref={hostRef} aria-hidden />;

  const connectPoint = connectStart ? geo.nodes.find((node) => node.id === connectStart) : null;
  return (
    <div
      className="grid-overlay freeform-overlay"
      ref={hostRef}
      style={{ width: box.w, height: box.h }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={() => !dragRef.current && setHover(null)}
    >
      <svg className="grid-overlay-svg" width={box.w} height={box.h} viewBox={`0 0 ${geo.geom.w} ${geo.geom.h}`} preserveAspectRatio="none" aria-hidden>
        {geo.regions.map((region) => (
          <polygon
            key={region.id}
            className={`freeform-region${selectedRegion === region.id ? " is-selected" : ""}${hover?.kind === "region" && hover.id === region.id ? " is-hot" : ""}`}
            points={region.pointsPx.map((point) => point.join(",")).join(" ")}
          />
        ))}
        {geo.edges.map((edge) => (
          <line
            key={edge.id}
            className={`freeform-edge${edge.frame ? " is-frame" : ""}${hover?.kind === "edge" && hover.id === edge.id ? " is-hot" : ""}`}
            x1={edge.aPoint[0]}
            y1={edge.aPoint[1]}
            x2={edge.bPoint[0]}
            y2={edge.bPoint[1]}
          />
        ))}
        {connectPoint && (
          <circle className="freeform-connect-start" cx={connectPoint.xPx} cy={connectPoint.yPx} r="10" />
        )}
        {geo.nodes.map((node) => (
          <g key={node.id}>
            <circle
              className="freeform-node-hit"
              cx={node.xPx}
              cy={node.yPx}
              r={FREEFORM_HIT_RADIUS_PX}
              aria-hidden="true"
            />
            <circle
              className={`freeform-node${node.locked ? " is-frame" : ""}${node.boundary && !node.locked ? " is-boundary" : ""}${hover?.kind === "node" && hover.id === node.id ? " is-hot" : ""}${connectStart === node.id ? " is-connect-start" : ""}`}
              cx={node.xPx}
              cy={node.yPx}
              r={node.locked ? 5 : 6}
              data-boundary={node.boundary || undefined}
              aria-hidden="true"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
