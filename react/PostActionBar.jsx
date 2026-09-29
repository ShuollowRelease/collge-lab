import { useEffect, useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import "./PostActionBar.css";

/**
 * 帖子底部操作栏
 * - Heart 点赞：选中 fill 红色 + spring 缩放
 * - MessageCircle 评论：图标 + 数字
 * - Share2 分享
 * - Bookmark 收藏：选中 fill
 * 图标 24px / stroke-width 2；点击热区 44px；间距 gap-6；hover 轻微放大
 */
export default function PostActionBar({
  liked = false,
  bookmarked = false,
  commentCount = null,
  likeCount = null,
  className = "",
  onLike,
  onComment,
  onShare,
  onBookmark,
}) {
  const [likeSpring, setLikeSpring] = useState(false);

  useEffect(() => {
    if (!liked) return undefined;
    setLikeSpring(true);
    const t = window.setTimeout(() => setLikeSpring(false), 480);
    return () => window.clearTimeout(t);
  }, [liked]);

  const iconBase = "h-11 w-11"; // 44px touch target
  const iconCls =
    "transition-transform duration-200 ease-out group-hover:scale-110 group-active:scale-95";

  return (
    <div className={`flex items-center gap-6 ${className}`} role="toolbar" aria-label="帖子操作">
      {/* 点赞 */}
      <button
        type="button"
        aria-label={liked ? "取消点赞" : "点赞"}
        aria-pressed={liked}
        onClick={onLike}
        className={`group ${iconBase} inline-flex items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 ${
          likeSpring ? "post-action-spring" : ""
        }`}
      >
        <Heart
          size={24}
          strokeWidth={2}
          className={iconCls + (liked ? " text-red-500" : " text-neutral-900 dark:text-neutral-50")}
          fill={liked ? "currentColor" : "none"}
        />
        {likeCount !== null && likeCount !== undefined && (
          <span className="ml-1 text-sm tabular-nums text-neutral-900 dark:text-neutral-50">
            {formatCount(likeCount)}
          </span>
        )}
      </button>

      {/* 评论 */}
      <button
        type="button"
        aria-label="评论"
        onClick={onComment}
        className={`group ${iconBase} !w-auto min-w-[44px] px-1 inline-flex items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400`}
      >
        <MessageCircle
          size={24}
          strokeWidth={2}
          className={iconCls + " text-neutral-900 dark:text-neutral-50"}
        />
        {commentCount !== null && commentCount !== undefined && (
          <span className="ml-1.5 text-sm tabular-nums text-neutral-900 dark:text-neutral-50">
            {formatCount(commentCount)}
          </span>
        )}
      </button>

      {/* 分享 */}
      <button
        type="button"
        aria-label="分享"
        onClick={onShare}
        className={`group ${iconBase} inline-flex items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400`}
      >
        <Share2
          size={24}
          strokeWidth={2}
          className={iconCls + " text-neutral-900 dark:text-neutral-50"}
        />
      </button>

      {/* 收藏 */}
      <button
        type="button"
        aria-label={bookmarked ? "取消收藏" : "收藏"}
        aria-pressed={bookmarked}
        onClick={onBookmark}
        className={`group ${iconBase} inline-flex items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400`}
      >
        <Bookmark
          size={24}
          strokeWidth={2}
          className={iconCls + (bookmarked ? " text-amber-600 dark:text-amber-400" : " text-neutral-900 dark:text-neutral-50")}
          fill={bookmarked ? "currentColor" : "none"}
        />
      </button>
    </div>
  );
}

function formatCount(n) {
  if (typeof n === "string") return n;
  if (typeof n !== "number" || Number.isNaN(n)) return "";
  if (n < 1000) return String(n);
  if (n < 10000) return `${(n / 1000).toFixed(1)}千`;
  return `${(n / 10000).toFixed(1)}万`;
}
