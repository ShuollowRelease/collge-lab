/**
 * Instagram 发帖卡片 · 交互层
 * 图标内联 SVG（viewBox 0 0 24 24），颜色 currentColor / CSS 变量。
 */

const ICONS = {
  heart: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>`,
  heartFill: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor"
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>`,
  comment: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>`,
  share: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"
        d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/>
    </svg>`,
  bookmark: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"
        d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>`,
  bookmarkFill: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor"
        d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>`,
  more: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="5.5" r="1.35" fill="currentColor"/>
      <circle cx="12" cy="12" r="1.35" fill="currentColor"/>
      <circle cx="12" cy="18.5" r="1.35" fill="currentColor"/>
    </svg>`,
};

export function mountInsPost(root, options = {}) {
  if (!root) throw new Error("mountInsPost: root required");

  const likeBtn = root.querySelector("[data-ins-like]");
  const saveBtn = root.querySelector("[data-ins-save]");
  const commentBtn = root.querySelector("[data-ins-comment]");
  const shareBtn = root.querySelector("[data-ins-share]");
  const moreBtn = root.querySelector("[data-ins-more]");
  const media = root.querySelector("[data-ins-media]");
  const heartPop = root.querySelector("[data-ins-heart-pop]");
  const likesEl = root.querySelector("[data-ins-likes]");
  const moreLink = root.querySelector("[data-ins-more-link]");

  const state = {
    liked: !!options.liked,
    saved: !!options.saved,
    likeCount: Number(options.likeCount ?? 0),
  };

  const emit = (type, detail) => options.onEvent?.(type, detail);

  const setIcon = (el, name) => {
    if (el) el.innerHTML = ICONS[name] || "";
  };

  const render = () => {
    setIcon(likeBtn, state.liked ? "heartFill" : "heart");
    likeBtn?.classList.toggle("is-liked", state.liked);
    likeBtn?.setAttribute("aria-label", state.liked ? "取消赞" : "赞");
    likeBtn?.setAttribute("aria-pressed", state.liked ? "true" : "false");

    setIcon(saveBtn, state.saved ? "bookmarkFill" : "bookmark");
    saveBtn?.classList.toggle("is-saved", state.saved);
    saveBtn?.setAttribute("aria-label", state.saved ? "取消收藏" : "收藏");
    saveBtn?.setAttribute("aria-pressed", state.saved ? "true" : "false");

    if (likesEl) {
      likesEl.textContent =
        state.likeCount > 0 ? `${state.likeCount.toLocaleString("zh-CN")} 次赞` : "赞";
    }
  };

  const toggleLike = (fromMedia = false) => {
    state.liked = !state.liked;
    state.likeCount += state.liked ? 1 : -1;
    if (state.likeCount < 0) state.likeCount = 0;
    if (likeBtn) {
      likeBtn.classList.remove("is-spring");
      // reflow 以重启动画
      void likeBtn.offsetWidth;
      likeBtn.classList.add("is-spring");
    }
    if (fromMedia && state.liked && heartPop) {
      heartPop.classList.remove("is-on");
      void heartPop.offsetWidth;
      heartPop.classList.add("is-on");
    }
    render();
    emit("like", { liked: state.liked, likeCount: state.likeCount });
  };

  likeBtn?.addEventListener("click", () => toggleLike(false));
  saveBtn?.addEventListener("click", () => {
    state.saved = !state.saved;
    render();
    emit("save", { saved: state.saved });
  });
  commentBtn?.addEventListener("click", () => emit("comment", {}));
  shareBtn?.addEventListener("click", () => emit("share", {}));
  moreBtn?.addEventListener("click", () => emit("more", {}));
  moreLink?.addEventListener("click", () => emit("comments", {}));

  // 双击媒体点赞（对齐 IG）
  let lastTap = 0;
  media?.addEventListener("click", () => {
    const now = Date.now();
    if (now - lastTap < 320) {
      if (!state.liked) toggleLike(true);
      else if (heartPop) {
        heartPop.classList.remove("is-on");
        void heartPop.offsetWidth;
        heartPop.classList.add("is-on");
      }
      lastTap = 0;
      return;
    }
    lastTap = now;
  });

  render();
  return {
    setLike(liked) {
      state.liked = !!liked;
      render();
    },
    setSaved(saved) {
      state.saved = !!saved;
      render();
    },
  };
}

export { ICONS };
