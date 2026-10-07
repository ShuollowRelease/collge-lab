import { useCallback, useEffect, useRef, useState } from "react";
import "./InstagramPost.css";

/**
 * Instagram 发帖卡片（样式 + 内联 SVG 图标）。
 *
 * 对外 props / 事件接口（与常见发帖卡片封装一致）：
 *   username, avatarUrl, meta, mediaSrc, mediaAlt, mediaRatio
 *   caption, likeCount, commentCount, timestamp
 *   liked, saved, className
 *   onLike, onSave, onComment, onShare, onMore, onOpenComments
 *
 * 图标一律内联 SVG（viewBox 0 0 24 24），颜色 currentColor。
 */

const IconHeart = ({ filled }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.8}
      strokeLinejoin="round"
    />
  </svg>
);

const IconComment = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
  </svg>
);

const IconShare = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
);

const IconBookmark = ({ filled }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.8}
      strokeLinejoin="round"
    />
  </svg>
);

const IconMore = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <circle cx="12" cy="5.5" r="1.35" fill="currentColor" />
    <circle cx="12" cy="12" r="1.35" fill="currentColor" />
    <circle cx="12" cy="18.5" r="1.35" fill="currentColor" />
  </svg>
);

function formatCount(n) {
  if (typeof n === "string") return n;
  if (typeof n !== "number" || Number.isNaN(n)) return "";
  if (n < 1000) return String(n);
  if (n < 10000) return `${(n / 1000).toFixed(1)}千`;
  return `${(n / 10000).toFixed(1)}万`;
}

export default function InstagramPost({
  username = "photo.cut",
  avatarUrl,
  meta = "",
  mediaSrc,
  mediaAlt = "",
  mediaRatio = "1 / 1",
  caption = "",
  likeCount = 0,
  commentCount = null,
  timestamp = "",
  liked: likedProp = false,
  saved: savedProp = false,
  className = "",
  onLike,
  onSave,
  onComment,
  onShare,
  onMore,
  onOpenComments,
}) {
  const [liked, setLiked] = useState(!!likedProp);
  const [saved, setSaved] = useState(!!savedProp);
  const [likes, setLikes] = useState(Number(likeCount) || 0);
  const [spring, setSpring] = useState(false);
  const [heartPop, setHeartPop] = useState(false);
  const lastTapRef = useRef(0);

  useEffect(() => setLiked(!!likedProp), [likedProp]);
  useEffect(() => setSaved(!!savedProp), [savedProp]);
  useEffect(() => setLikes(Number(likeCount) || 0), [likeCount]);

  const runSpring = useCallback(() => {
    setSpring(true);
    const t = window.setTimeout(() => setSpring(false), 480);
    return () => window.clearTimeout(t);
  }, []);

  const toggleLike = useCallback(
    (fromMedia = false) => {
      setLiked((prev) => {
        const next = !prev;
        setLikes((n) => Math.max(0, n + (next ? 1 : -1)));
        onLike?.({ liked: next });
        return next;
      });
      runSpring();
      if (fromMedia) {
        setHeartPop(true);
        window.setTimeout(() => setHeartPop(false), 700);
      }
    },
    [onLike, runSpring]
  );

  const onMediaClick = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      if (!liked) toggleLike(true);
      else {
        setHeartPop(true);
        window.setTimeout(() => setHeartPop(false), 700);
      }
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;
  };

  return (
    <article
      className={`ins-post ${className}`.trim()}
      style={{ "--ins-media-ratio": mediaRatio }}
      aria-label="Instagram 帖子"
    >
      <header className="ins-post-header">
        {avatarUrl ? (
          <img className="ins-post-avatar" src={avatarUrl} alt="" />
        ) : (
          <div className="ins-post-avatar ins-post-avatar-fallback" aria-hidden="true" />
        )}
        <div className="ins-post-user">
          <div className="ins-post-username">{username}</div>
          {meta ? <div className="ins-post-meta">{meta}</div> : null}
        </div>
        <button
          type="button"
          className="ins-post-btn"
          aria-label="更多选项"
          onClick={() => onMore?.()}
        >
          <IconMore />
        </button>
      </header>

      <div
        className="ins-post-media"
        role="img"
        aria-label={mediaAlt || "帖子媒体"}
        onClick={onMediaClick}
      >
        {mediaSrc ? (
          <img src={mediaSrc} alt={mediaAlt} />
        ) : (
          <div className="ins-post-media-empty">媒体区</div>
        )}
        <div className={`ins-post-heart-pop${heartPop ? " is-on" : ""}`} aria-hidden="true">
          <IconHeart filled />
        </div>
      </div>

      <div className="ins-post-actions">
        <button
          type="button"
          className={`ins-post-btn${liked ? " is-liked" : ""}${spring ? " is-spring" : ""}`}
          aria-label={liked ? "取消赞" : "赞"}
          aria-pressed={liked}
          onClick={() => toggleLike(false)}
        >
          <IconHeart filled={liked} />
        </button>
        <button
          type="button"
          className="ins-post-btn"
          aria-label="评论"
          onClick={() => onComment?.()}
        >
          <IconComment />
        </button>
        <button
          type="button"
          className="ins-post-btn"
          aria-label="分享"
          onClick={() => onShare?.()}
        >
          <IconShare />
        </button>
        <div className="ins-post-actions-right">
          <button
            type="button"
            className={`ins-post-btn${saved ? " is-saved" : ""}`}
            aria-label={saved ? "取消收藏" : "收藏"}
            aria-pressed={saved}
            onClick={() => {
              const next = !saved;
              setSaved(next);
              onSave?.({ saved: next });
            }}
          >
            <IconBookmark filled={saved} />
          </button>
        </div>
      </div>

      <div className="ins-post-body">
        <div className="ins-post-likes">
          {likes > 0 ? `${formatCount(likes)} 次赞` : "赞"}
        </div>
        {caption ? (
          <p className="ins-post-caption">
            <span className="user">{username}</span>
            {caption}
          </p>
        ) : null}
        {commentCount !== null && commentCount !== undefined ? (
          <button
            type="button"
            className="ins-post-more-link"
            onClick={() => onOpenComments?.()}
          >
            查看全部 {formatCount(commentCount)} 条评论
          </button>
        ) : null}
        {timestamp ? <div className="ins-post-time">{timestamp}</div> : null}
      </div>
    </article>
  );
}
