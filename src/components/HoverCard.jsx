import { cloneElement, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const POPOVER_GAP_PX = 10;
const POPOVER_FALLBACK_WIDTH_PX = 286;
const POPOVER_FALLBACK_HEIGHT_PX = 224;
const HOVER_OPEN_DELAY_FALLBACK_MS = 120;
const HOVER_CLOSE_DELAY_MS = 140;

function cssTimeMs(variableName, fallbackMs) {
  if (typeof document === "undefined") return fallbackMs;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
  if (!raw) return fallbackMs;
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) return fallbackMs;
  return raw.endsWith("s") && !raw.endsWith("ms") ? value * 1000 : value;
}

function detailRows(details) {
  return (details?.rows || []).filter((row) => row?.label && row?.value);
}

export default function HoverCard({ children, details, className = "" }) {
  const anchorRef = useRef(null);
  const popoverRef = useRef(null);
  const openTimerRef = useRef(null);
  const closeTimerRef = useRef(null);
  const touchOpenRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0, placement: "bottom" });
  const popoverId = `hover-card-popover-${useId().replace(/:/g, "")}`;

  const cancelTimers = useCallback(() => {
    if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    openTimerRef.current = null;
    closeTimerRef.current = null;
  }, []);

  const scheduleOpen = useCallback(() => {
    cancelTimers();
    openTimerRef.current = window.setTimeout(
      () => setOpen(true),
      cssTimeMs("--hover-card-popover-delay", HOVER_OPEN_DELAY_FALLBACK_MS)
    );
  }, [cancelTimers]);

  const scheduleClose = useCallback(() => {
    if (touchOpenRef.current) return;
    cancelTimers();
    closeTimerRef.current = window.setTimeout(() => setOpen(false), HOVER_CLOSE_DELAY_MS);
  }, [cancelTimers]);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const anchorRect = anchor.getBoundingClientRect();
    const popoverRect = popoverRef.current?.getBoundingClientRect();
    const width = popoverRect?.width || POPOVER_FALLBACK_WIDTH_PX;
    const height = popoverRect?.height || POPOVER_FALLBACK_HEIGHT_PX;
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const canShowTop = anchorRect.top >= height + POPOVER_GAP_PX;
    const canShowBottom = viewportHeight - anchorRect.bottom >= height + POPOVER_GAP_PX;
    const canShowRight = viewportWidth - anchorRect.right >= width + POPOVER_GAP_PX;
    const placement = canShowTop ? "top" : canShowBottom ? "bottom" : canShowRight ? "right" : "left";
    let x = anchorRect.left + (anchorRect.width - width) / 2;
    let y = anchorRect.bottom + POPOVER_GAP_PX;
    if (placement === "top") y = anchorRect.top - height - POPOVER_GAP_PX;
    if (placement === "right") {
      x = anchorRect.right + POPOVER_GAP_PX;
      y = anchorRect.top + (anchorRect.height - height) / 2;
    }
    if (placement === "left") {
      x = anchorRect.left - width - POPOVER_GAP_PX;
      y = anchorRect.top + (anchorRect.height - height) / 2;
    }
    setPosition({
      x: Math.max(POPOVER_GAP_PX, Math.min(x, viewportWidth - width - POPOVER_GAP_PX)),
      y: Math.max(POPOVER_GAP_PX, Math.min(y, viewportHeight - height - POPOVER_GAP_PX)),
      placement,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return undefined;
    updatePosition();
    const onViewportChange = () => updatePosition();
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [open, details, updatePosition]);

  useEffect(() => () => cancelTimers(), [cancelTimers]);

  const toggleForTouch = () => {
    const touchLike = window.matchMedia?.("(hover: none)").matches || window.matchMedia?.("(pointer: coarse)").matches;
    if (touchLike) {
      cancelTimers();
      setOpen((current) => {
        const next = !current;
        touchOpenRef.current = next;
        return next;
      });
    }
  };

  const child = cloneElement(children, {
    ref: (node) => {
      anchorRef.current = node;
      const originalRef = children.ref;
      if (typeof originalRef === "function") originalRef(node);
      else if (originalRef && typeof originalRef === "object") originalRef.current = node;
    },
    className: `${children.props.className || ""} hover-card-target`.trim(),
    "aria-describedby": open ? popoverId : undefined,
    onPointerDown: (event) => {
      children.props.onPointerDown?.(event);
      toggleForTouch();
    },
    onClick: (event) => {
      children.props.onClick?.(event);
    },
  });

  const popover = open && typeof document !== "undefined"
    ? createPortal(
        <div
          ref={popoverRef}
          id={popoverId}
          role="tooltip"
          tabIndex={-1}
          className={`hover-card-popover is-${position.placement}`}
          style={{ left: `${position.x}px`, top: `${position.y}px` }}
          onPointerEnter={() => {
            cancelTimers();
            setOpen(true);
          }}
          onPointerLeave={scheduleClose}
          onFocusCapture={() => {
            cancelTimers();
            setOpen(true);
          }}
          onBlurCapture={(event) => {
            if (!event.relatedTarget || !popoverRef.current?.contains(event.relatedTarget)) scheduleClose();
          }}
        >
          <div className="hover-card-popover-kicker">预览说明</div>
          <h3>{details?.name || "项目说明"}</h3>
          {details?.description && <p>{details.description}</p>}
          {detailRows(details).length > 0 && (
            <dl>
              {detailRows(details).map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <div
      ref={(node) => {
        if (node) anchorRef.current = node.querySelector(".hover-card-target") || node;
      }}
      className={`hover-card-shell${open ? " is-open" : ""} ${className}`.trim()}
      onPointerEnter={() => {
        if (!window.matchMedia?.("(hover: none)").matches && !window.matchMedia?.("(pointer: coarse)").matches) scheduleOpen();
      }}
      onPointerLeave={() => {
        if (!window.matchMedia?.("(hover: none)").matches && !window.matchMedia?.("(pointer: coarse)").matches) scheduleClose();
      }}
      onFocusCapture={() => {
        cancelTimers();
        setOpen(true);
      }}
      onBlurCapture={(event) => {
        if (event.relatedTarget && (event.currentTarget.contains(event.relatedTarget) || popoverRef.current?.contains(event.relatedTarget))) return;
        scheduleClose();
      }}
    >
      {child}
      {popover}
    </div>
  );
}
