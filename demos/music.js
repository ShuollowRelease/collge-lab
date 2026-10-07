/**
 * Apple Music 风格音乐播放器 · 交互层
 * 只管理 UI 状态；媒体仍走原生 <audio>/<video> 事件。
 * 图标内联 SVG（viewBox 0 0 24 24）。
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
  prev: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M17.97 4.28A2 2 0 0 1 21 6v12a2 2 0 0 1-3.03 1.72l-9.99-6a2 2 0 0 1 0-3.44l9.99-6z"/>
      <path fill="currentColor" d="M4 5h2.2v14H4z"/>
    </svg>`,
  next: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M6.03 4.28A2 2 0 0 0 3 6v12a2 2 0 0 0 3.03 1.72l9.99-6a2 2 0 0 0 0-3.44l-9.99-6z"/>
      <path fill="currentColor" d="M17.8 5H20v14h-2.2z"/>
    </svg>`,
  shuffle: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
        d="M18 14l4 4-4 4M18 2l4 4-4 4M2 18h1.97a4 4 0 0 0 3.3-1.7l5.45-8.6A4 4 0 0 1 16 6h6M2 6h1.97a4 4 0 0 1 3.6 2.2M22 18h-6.04a4 4 0 0 1-3.3-1.8"/>
    </svg>`,
  repeat: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
        d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"/>
    </svg>`,
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
  volume: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M11 5 6 9H2v6h4l5 4V5z"/>
      <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
        d="M15.5 8.5a5 5 0 0 1 0 7M18 6a9 9 0 0 1 0 12"/>
    </svg>`,
  muted: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M11 5 6 9H2v6h4l5 4V5z"/>
      <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
        d="M23 9l-6 6M17 9l6 6"/>
    </svg>`,
  lyrics: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
        d="M4 6h10M4 12h16M4 18h8"/>
    </svg>`,
  queue: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
        d="M4 6h12M4 12h12M4 18h12M18 9v8M18 9l3 2M18 9l-3 2"/>
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

/**
 * 挂载 Apple Music 风格播放器。
 * @param {HTMLElement} root
 * @param {HTMLMediaElement} media
 * @param {object} options { onEvent }
 */
export function mountMusicPlayer(root, media, options = {}) {
  if (!root || !media) throw new Error("mountMusicPlayer: root/media required");

  const playBtn = root.querySelector("[data-am-play]");
  const prevBtn = root.querySelector("[data-am-prev]");
  const nextBtn = root.querySelector("[data-am-next]");
  const shuffleBtn = root.querySelector("[data-am-shuffle]");
  const repeatBtn = root.querySelector("[data-am-repeat]");
  const heartBtn = root.querySelector("[data-am-heart]");
  const muteBtn = root.querySelector("[data-am-mute]");
  const progress = root.querySelector("[data-am-progress]");
  const fill = root.querySelector("[data-am-progress-fill]");
  const thumb = root.querySelector("[data-am-progress-thumb]");
  const currentEl = root.querySelector("[data-am-current]");
  const durationEl = root.querySelector("[data-am-duration]");
  const volumeInput = root.querySelector("[data-am-volume]");
  const lyricsBtn = root.querySelector("[data-am-lyrics]");
  const queueBtn = root.querySelector("[data-am-queue]");

  const emit = (type, detail) => options.onEvent?.(type, detail);
  let seeking = false;

  const setIcon = (el, name) => {
    if (el) el.innerHTML = ICONS[name] || "";
  };

  const syncPlayUI = () => {
    const playing = !media.paused && !media.ended;
    setIcon(playBtn, playing ? "pause" : "play");
    playBtn?.setAttribute("aria-label", playing ? "暂停" : "播放");
    root.classList.toggle("is-playing", playing);
  };

  const syncMuteUI = () => {
    const muted = media.muted || media.volume === 0;
    setIcon(muteBtn, muted ? "muted" : "volume");
    muteBtn?.setAttribute("aria-label", muted ? "取消静音" : "静音");
    muteBtn?.setAttribute("aria-pressed", muted ? "true" : "false");
    if (volumeInput && document.activeElement !== volumeInput) {
      volumeInput.value = String(muted ? 0 : Math.round(media.volume * 100));
    }
  };

  const syncProgress = () => {
    const dur = Number.isFinite(media.duration) ? media.duration : 0;
    const cur = Number.isFinite(media.currentTime) ? media.currentTime : 0;
    const pct = dur > 0 ? clamp((cur / dur) * 100, 0, 100) : 0;
    if (fill) fill.style.width = `${pct}%`;
    if (thumb) thumb.style.left = `${pct}%`;
    if (currentEl) currentEl.textContent = formatTime(cur);
    if (durationEl) durationEl.textContent = formatTime(dur);
  };

  const togglePlay = () => {
    if (media.paused || media.ended) media.play().catch(() => {});
    else media.pause();
  };

  const seekFromEvent = (e) => {
    if (!progress) return;
    const rect = progress.getBoundingClientRect();
    const ratio = rect.width > 0 ? clamp((e.clientX - rect.left) / rect.width, 0, 1) : 0;
    const dur = Number.isFinite(media.duration) ? media.duration : 0;
    if (dur > 0) {
      media.currentTime = ratio * dur;
      syncProgress();
    }
  };

  playBtn?.addEventListener("click", () => {
    togglePlay();
    emit("toggle", { playing: !media.paused });
  });

  prevBtn?.addEventListener("click", () => {
    if (media.currentTime > 3) media.currentTime = 0;
    else emit("prev", {});
  });

  nextBtn?.addEventListener("click", () => emit("next", {}));

  shuffleBtn?.addEventListener("click", () => {
    const on = shuffleBtn.getAttribute("aria-pressed") !== "true";
    shuffleBtn.setAttribute("aria-pressed", on ? "true" : "false");
    shuffleBtn.classList.toggle("is-on", on);
    emit("shuffle", { enabled: on });
  });

  repeatBtn?.addEventListener("click", () => {
    const on = repeatBtn.getAttribute("aria-pressed") !== "true";
    repeatBtn.setAttribute("aria-pressed", on ? "true" : "false");
    repeatBtn.classList.toggle("is-on", on);
    media.loop = on;
    emit("repeat", { enabled: on });
  });

  heartBtn?.addEventListener("click", () => {
    const on = heartBtn.getAttribute("aria-pressed") !== "true";
    heartBtn.setAttribute("aria-pressed", on ? "true" : "false");
    heartBtn.setAttribute("aria-label", on ? "取消喜欢" : "喜欢");
    heartBtn.classList.toggle("is-on", on);
    setIcon(heartBtn, on ? "heartFill" : "heart");
    emit("like", { liked: on });
  });

  muteBtn?.addEventListener("click", () => {
    if (media.muted || media.volume === 0) {
      media.muted = false;
      if (media.volume === 0) media.volume = 0.75;
    } else {
      media.muted = true;
    }
  });

  volumeInput?.addEventListener("input", () => {
    const v = clamp(Number(volumeInput.value) / 100, 0, 1);
    media.volume = v;
    media.muted = v === 0;
    emit("volume", { volume: v, muted: v === 0 });
  });

  lyricsBtn?.addEventListener("click", () => emit("lyrics", {}));
  queueBtn?.addEventListener("click", () => emit("queue", {}));

  if (progress) {
    progress.addEventListener("pointerdown", (e) => {
      seeking = true;
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
      progress.classList.remove("is-dragging");
      progress.releasePointerCapture?.(e.pointerId);
      emit("seek", { currentTime: media.currentTime });
    };
    progress.addEventListener("pointerup", end);
    progress.addEventListener("pointercancel", end);
  }

  media.addEventListener("play", () => {
    syncPlayUI();
    emit("play", {});
  });
  media.addEventListener("pause", () => {
    syncPlayUI();
    emit("pause", {});
  });
  media.addEventListener("ended", () => {
    syncPlayUI();
    emit("ended", {});
  });
  media.addEventListener("timeupdate", () => {
    if (!seeking) syncProgress();
    emit("timeupdate", { currentTime: media.currentTime, duration: media.duration });
  });
  media.addEventListener("loadedmetadata", () => {
    syncProgress();
    emit("loadedmetadata", { duration: media.duration });
  });
  media.addEventListener("volumechange", syncMuteUI);

  setIcon(heartBtn, "heart");
  syncPlayUI();
  syncMuteUI();
  syncProgress();

  return { destroy() {} };
}

export { ICONS, formatTime };
