import { ICON_FILL, ICON_STROKE } from "../engine/icons.js";
import { YT_SHORT_CHROME } from "../engine/constants.js";

function hasValue(value) {
  return String(value ?? "").trim().length > 0;
}

function ShortIcon({ path, filled = false }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

/** yt-short 网页互动覆盖层；Canvas 导出仍由 drawYtChrome 负责。 */
export default function YtShortOverlay({ state, onToggle }) {
  const stats = state.ytStats || {};
  const showCounts = !!state.ui?.showCounts;
  const items = [
    hasValue(stats.likes)
      ? { id: "liked", label: "点赞", path: state.ui?.liked ? ICON_FILL.heart : ICON_STROKE.heart, pressed: !!state.ui?.liked, count: stats.likes }
      : null,
    hasValue(stats.comments)
      ? { id: "ytCommented", label: "评论", path: ICON_STROKE.comment, pressed: !!state.ui?.ytCommented, count: stats.comments }
      : null,
    hasValue(stats.shares || stats.reposts)
      ? { id: "ytShared", label: "分享", path: ICON_STROKE.share, pressed: !!state.ui?.ytShared, count: stats.shares || stats.reposts }
      : null,
    { id: "bookmarked", label: "收藏", path: state.ui?.bookmarked ? ICON_FILL.bookmark : ICON_STROKE.bookmark, pressed: !!state.ui?.bookmarked },
  ].filter(Boolean);

  if (!items.length) return null;

  return (
    <div
      className="yt-short-overlay"
      style={{
        "--yt-short-rail-x": `${YT_SHORT_CHROME.railXRatio * 100}%`,
        "--yt-short-rail-width": `${YT_SHORT_CHROME.railWidthRatio * 100}%`,
        "--yt-short-rail-top": `${YT_SHORT_CHROME.railTopRatio * 100}%`,
        "--yt-short-item-step": `${YT_SHORT_CHROME.itemStepRatio * 100}%`,
      }}
      aria-label="短视频互动"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="yt-short-action"
          aria-label={item.label}
          aria-pressed={item.pressed}
          onClick={() => onToggle?.(item.id)}
        >
          <ShortIcon path={item.path} filled={item.pressed} />
          {showCounts && hasValue(item.count) && <span className="yt-short-count">{item.count}</span>}
        </button>
      ))}
    </div>
  );
}
