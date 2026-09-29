import { useState } from "react";
import PostActionBar from "./PostActionBar";

/** 用法示例：React + Tailwind + lucide-react */
export default function PostActionBarDemo() {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [comments, setComments] = useState(2200);

  return (
    <div className="mx-auto max-w-md rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mb-3 aspect-square w-full rounded-lg bg-neutral-100 dark:bg-neutral-900" />
      <PostActionBar
        liked={liked}
        bookmarked={bookmarked}
        commentCount={comments}
        likeCount={liked ? 39001 : 39000}
        onLike={() => setLiked((v) => !v)}
        onComment={() => setComments((c) => c + 1)}
        onShare={() => {
          /* navigator.share 或复制链接 */
        }}
        onBookmark={() => setBookmarked((v) => !v)}
      />
    </div>
  );
}
