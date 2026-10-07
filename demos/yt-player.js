/**
 * YouTube 长视频播放器 · 交互层
 * 媒体逻辑挂在原生 <video>；图标内联 SVG（viewBox 0 0 24 24）。
 */

const ICONS = {
  play: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M8.2 5.3c0-.9.98-1.45 1.74-.97l10.3 6.7a1.15 1.15 0 0 1 0 1.94l-10.3 6.7c-.76.49-1.74-.06-1.74-.97V5.3z"/>
    </svg>`,
  pause: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M7 5.5h3.2v13H7v-13zm6.8 0H17v13h-3.2v-13z"/>
    </svg>`,
  next: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M6.03 4.28A2 2 0 0 0 3 6v12a2 2 0 0 0 3.03 1.72l9.99-6a2 2 0 0 0 0-3.44l-9.99-6z"/>
      <path fill="currentColor" d="M17.8 5H20v14h-2.2z"/>
    </svg>`,
  volume: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M11 5 6 9H2v6h4l5 4V5z"/>
      <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M15.5 8.5a5 5 0 0 1 0 7M18 6a9 9 0 0 1 0 12"/>
    </svg>`,
  muted: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M11 5 6 9H2v6h4l5 4V5z"/>
      <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M23 9l-6 6M17 9l6 6"/>
    </svg>`,
  captions: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/>
      <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M7 12h3M14 12h3M7 15h10"/>
    </svg>`,
  settings: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/>
      <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
        d="M12 2.5l1.2 2.2 2.5-.3 1 2.3 2.3 1-.3 2.5 2.2 1.2-2.2 1.2.3 2.5-2.3 1-1 2.3-2.5-.3-1.2 2.2-1.2-2.2-2.5.3-1-2.3-2.3-1 .3-2.5-2.2-1.2 2.2-1.2-.3-2.5 2.3-1 1-2.3 2.5.3z"/>
    </svg>`,
  miniplayer: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/>
      <rect x="14" y="13" width="5" height="4" rx="0.5" fill="currentColor"/>
    </svg>`,
  theater: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="3" y="6" width="18" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
      <rect x="6" y="9" width="4" height="6" fill="currentColor"/>
      <rect x="14" y="9" width="4" height="6" fill="currentColor"/>
    </svg>`,
  fullscreen: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M5 5h5.2v2H7v3.2H5V5zm9 0H19v5.2h-2V7h-3V5zM5 13.8h2V17h3.2v2H5v-5.2zM13.8 17H17v-3.2h2V17h-5.2v2z"/>
    </svg>`,
  exitFullscreen: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M9.2 5v2.2H7.4l3.2 3.2-1.55 1.55-3.2-3.2v1.85H5V5h4.2zm5.6 14v-2.2h1.8l-3.2-3.2 1.55-1.55 3.2 3.2v-1.85H19V19h-4.2z"/>
    </svg>`,
  thumbUp: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"
        d="M7 10v10H4V10h3zm0 0l4-7a2 2 0 0 1 2 2v3h5.2a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17 20H7"/>
    </svg>`,
  share: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"
        d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/>
    </svg>`,
};

function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const s = Math.floor(sec % 60);
  const m = Math.floor((sec / 60) % 60);
  const h = Math.floor(sec / 3600);
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

export function mountYouTubePlayer(root, video, options = {}) {
  if (!root || !video) throw new Error("mountYouTubePlayer: root/video required");

  const playBtn = root.querySelector("[data-yt-play]");
  const centerBtn = root.querySelector("[data-yt-center]");
  const hit = root.querySelector("[data-yt-hit]");
  const nextBtn = root.querySelector("[data-yt-next]");
  const muteBtn = root.querySelector("[data-yt-mute]");
  const volumeInput = root.querySelector("[data-yt-volume]");
  const progress = root.querySelector("[data-yt-progress]");
  const fill = root.querySelector("[data-yt-progress-fill]");
  const bufferEl = root.querySelector("[data-yt-progress-buffer]");
  const thumb = root.querySelector("[data-yt-progress-thumb]");
  const currentEl = root.querySelector("[data-yt-current]");
  const durationEl = root.querySelector("[data-yt-duration]");
  const captionsBtn = root.querySelector("[data-yt-captions]");
  const settingsBtn = root.querySelector("[data-yt-settings]");
  const miniBtn = root.querySelector("[data-yt-miniplayer]");
  const theaterBtn = root.querySelector("[data-yt-theater]");
  const fsBtn = root.querySelector("[data-yt-fullscreen]");
  const likeBtn = root.querySelector("[data-yt-like]");
  const shareBtn = root.querySelector("[data-yt-share]");
  const subBtn = root.querySelector("[data-yt-subscribe]");

  const emit = (type, detail) => options.onEvent?.(type, detail);
  let seeking = false;

  const setIcon = (el, name) => {
    if (el) el.innerHTML = ICONS[name] || "";
  };

  const syncPlayUI = () => {
    const playing = !video.paused && !video.ended;
    setIcon(playBtn, playing ? "pause" : "play");
    setIcon(centerBtn, playing ? "pause" : "play");
    const label = playing ? "暂停" : "播放";
    playBtn?.setAttribute("aria-label", label);
    centerBtn?.setAttribute("aria-label", label);
    root.classList.toggle("is-playing", playing);
    root.classList.toggle("is-paused", !playing);
  };

  const syncMuteUI = () => {
    const muted = video.muted || video.volume === 0;
    setIcon(muteBtn, muted ? "muted" : "volume");
    muteBtn?.setAttribute("aria-label", muted ? "取消静音" : "静音");
    if (volumeInput && document.activeElement !== volumeInput) {
      volumeInput.value = String(muted ? 0 : Math.round(video.volume * 100));
    }
  };

  const syncProgress = () => {
    const dur = Number.isFinite(video.duration) ? video.duration : 0;
    const cur = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    const pct = dur > 0 ? clamp((cur / dur) * 100, 0, 100) : 0;
    if (fill) fill.style.width = `${pct}%`;
    if (thumb) thumb.style.left = `${pct}%`;
    if (bufferEl && video.buffered?.length && dur > 0) {
      const end = video.buffered.end(video.buffered.length - 1);
      bufferEl.style.width = `${clamp((end / dur) * 100, 0, 100)}%`;
    }
    if (currentEl) currentEl.textContent = formatTime(cur);
    if (durationEl) durationEl.textContent = formatTime(dur);
    if (progress) {
      progress.setAttribute("aria-valuenow", String(Math.round(pct)));
      progress.setAttribute("aria-valuetext", `${formatTime(cur)} / ${formatTime(dur)}`);
    }
  };

  const syncFullscreenUI = () => {
    const fs = Boolean(document.fullscreenElement);
    root.classList.toggle("is-fullscreen", fs);
    setIcon(fsBtn, fs ? "exitFullscreen" : "fullscreen");
    fsBtn?.setAttribute("aria-label", fs ? "退出全屏" : "全屏");
    fsBtn?.setAttribute("aria-pressed", fs ? "true" : "false");
  };

  const togglePlay = () => {
    if (video.paused || video.ended) video.play().catch(() => {});
    else video.pause();
  };

  const seekFromEvent = (e) => {
    if (!progress) return;
    const rect = progress.getBoundingClientRect();
    const ratio = rect.width > 0 ? clamp((e.clientX - rect.left) / rect.width, 0, 1) : 0;
    const dur = Number.isFinite(video.duration) ? video.duration : 0;
    if (dur > 0) {
      video.currentTime = ratio * dur;
      syncProgress();
    }
  };

  playBtn?.addEventListener("click", () => {
    togglePlay();
    emit("toggle", { playing: !video.paused });
  });
  centerBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePlay();
    emit("toggle", { playing: !video.paused });
  });
  hit?.addEventListener("click", () => {
    togglePlay();
    emit("toggle", { playing: !video.paused });
  });
  nextBtn?.addEventListener("click", () => emit("next", {}));
  muteBtn?.addEventListener("click", () => {
    if (video.muted || video.volume === 0) {
      video.muted = false;
      if (video.volume === 0) video.volume = 0.8;
    } else video.muted = true;
    emit("volume", { volume: video.volume, muted: video.muted });
  });
  volumeInput?.addEventListener("input", () => {
    const v = clamp(Number(volumeInput.value) / 100, 0, 1);
    video.volume = v;
    video.muted = v === 0;
    emit("volume", { volume: v, muted: v === 0 });
  });

  captionsBtn?.addEventListener("click", () => {
    const on = captionsBtn.getAttribute("aria-pressed") !== "true";
    captionsBtn.setAttribute("aria-pressed", on ? "true" : "false");
    captionsBtn.classList.toggle("is-on", on);
    emit("captions", { enabled: on });
  });
  settingsBtn?.addEventListener("click", () => emit("settings", {}));
  miniBtn?.addEventListener("click", () => emit("miniplayer", {}));
  theaterBtn?.addEventListener("click", () => {
    const on = root.classList.toggle("is-theater");
    theaterBtn.classList.toggle("is-on", on);
    theaterBtn.setAttribute("aria-pressed", on ? "true" : "false");
    emit("theater", { enabled: on });
  });
  fsBtn?.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await root.requestFullscreen?.();
    } catch {
      /* ignore */
    }
  });

  likeBtn?.addEventListener("click", () => {
    const on = likeBtn.getAttribute("aria-pressed") !== "true";
    likeBtn.setAttribute("aria-pressed", on ? "true" : "false");
    likeBtn.setAttribute("aria-label", on ? "取消赞" : "赞");
    likeBtn.classList.toggle("is-on", on);
    emit("like", { liked: on });
  });
  shareBtn?.addEventListener("click", () => emit("share", {}));
  subBtn?.addEventListener("click", () => {
    const on = !subBtn.classList.contains("is-subscribed");
    subBtn.classList.toggle("is-subscribed", on);
    subBtn.textContent = on ? "已订阅" : "订阅";
    emit("subscribe", { subscribed: on });
  });

  if (progress) {
    progress.addEventListener("pointerdown", (e) => {
      seeking = true;
      root.classList.add("is-seeking");
      progress.classList.add("is-dragging");
      progress.setPointerCapture?.(e.pointerId);
      seekFromEvent(e);
      e.preventDefault();
    });
    progress.addEventListener("pointermove", (e) => {
      if (seeking) seekFromEvent(e);
    });
    const end = (e) => {
      if (!seeking) return;
      seeking = false;
      root.classList.remove("is-seeking");
      progress.classList.remove("is-dragging");
      progress.releasePointerCapture?.(e.pointerId);
      emit("seek", { currentTime: video.currentTime });
    };
    progress.addEventListener("pointerup", end);
    progress.addEventListener("pointercancel", end);
  }

  video.addEventListener("play", () => {
    syncPlayUI();
    emit("play", {});
  });
  video.addEventListener("pause", () => {
    syncPlayUI();
    emit("pause", {});
  });
  video.addEventListener("ended", () => {
    syncPlayUI();
    emit("ended", {});
  });
  video.addEventListener("timeupdate", () => {
    if (!seeking) syncProgress();
  });
  video.addEventListener("progress", syncProgress);
  video.addEventListener("loadedmetadata", syncProgress);
  video.addEventListener("volumechange", syncMuteUI);
  document.addEventListener("fullscreenchange", syncFullscreenUI);

  setIcon(captionsBtn, "captions");
  setIcon(settingsBtn, "settings");
  setIcon(miniBtn, "miniplayer");
  setIcon(theaterBtn, "theater");
  setIcon(nextBtn, "next");
  setIcon(likeBtn, "thumbUp");
  setIcon(shareBtn, "share");
  syncPlayUI();
  syncMuteUI();
  syncProgress();
  syncFullscreenUI();

  return { destroy() {} };
}

export { ICONS, formatTime };
