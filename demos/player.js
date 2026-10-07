/**
 * Twitter / X 风格视频播放器 · 交互层
 * 只负责 UI 状态与原生 <video> 控制，不改动对外事件名：
 *   play / pause / timeupdate / volumechange / seeked / fullscreenchange
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
  volume: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M4 9.5h3.2L12 5.4v13.2L7.2 14.5H4v-5z"/>
      <path fill="currentColor" d="M14.8 8.2a4.8 4.8 0 0 1 0 7.6l-1.1-1.3a3.2 3.2 0 0 0 0-5l1.1-1.3z"/>
      <path fill="currentColor" d="M17.4 5.6a8.2 8.2 0 0 1 0 12.8l-1.1-1.3a6.6 6.6 0 0 0 0-10.2l1.1-1.3z"/>
    </svg>`,
  muted: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M4 9.5h3.2L12 5.4v13.2L7.2 14.5H4v-5z"/>
      <path fill="currentColor" d="M15.2 9.05 13.05 11.2 15.2 13.35l1.05-1.05L15.2 11.2l1.05-1.1-1.05-1.05zm3.5 0-1.05 1.05 1.05 1.1-1.05 1.05 1.05 1.05 2.15-2.15-2.15-2.15z"/>
    </svg>`,
  fullscreen: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M5 5h5.2v2H7v3.2H5V5zm9 0H19v5.2h-2V7h-3V5zM5 13.8h2V17h3.2v2H5v-5.2zM13.8 17H17v-3.2h2V17h-5.2v2z"/>
    </svg>`,
  exitFullscreen: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M9.2 5v2.2H7.4l3.2 3.2-1.55 1.55-3.2-3.2v1.85H5V5h4.2zm5.6 14v-2.2h1.8l-3.2-3.2 1.55-1.55 3.2 3.2v-1.85H19V19h-4.2z"/>
    </svg>`,
};

/** 秒 → mm:ss（超过 1 小时则 h:mm:ss） */
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
 * 挂载播放器。保持简单 props 面：
 *   root: 容器
 *   video: HTMLVideoElement
 *   onEvent?: (type, detail) => void
 */
export function mountPlayer(root, video, options = {}) {
  if (!root || !video) throw new Error("mountPlayer: root/video required");

  const centerBtn = root.querySelector("[data-player-center]");
  const toggleBtn = root.querySelector("[data-player-toggle]");
  const muteBtn = root.querySelector("[data-player-mute]");
  const fsBtn = root.querySelector("[data-player-fullscreen]");
  const progress = root.querySelector("[data-player-progress]");
  const fill = root.querySelector("[data-player-progress-fill]");
  const thumb = root.querySelector("[data-player-progress-thumb]");
  const currentEl = root.querySelector("[data-player-current]");
  const durationEl = root.querySelector("[data-player-duration]");
  const volumeInput = root.querySelector("[data-player-volume]");
  const hit = root.querySelector("[data-player-hit]");

  const emit = (type, detail) => options.onEvent?.(type, detail);

  let seeking = false;

  const setIcon = (el, name) => {
    if (el) el.innerHTML = ICONS[name] || "";
  };

  const syncPlayUI = () => {
    const playing = !video.paused && !video.ended;
    root.classList.toggle("is-playing", playing);
    root.classList.toggle("is-paused", !playing);
    const label = playing ? "暂停" : "播放";
    setIcon(centerBtn, playing ? "pause" : "play");
    setIcon(toggleBtn, playing ? "pause" : "play");
    centerBtn?.setAttribute("aria-label", label);
    toggleBtn?.setAttribute("aria-label", label);
  };

  const syncMuteUI = () => {
    const muted = video.muted || video.volume === 0;
    setIcon(muteBtn, muted ? "muted" : "volume");
    muteBtn?.setAttribute("aria-label", muted ? "取消静音" : "静音");
    muteBtn?.setAttribute("aria-pressed", muted ? "true" : "false");
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
    if (progress) {
      progress.setAttribute("aria-valuenow", String(Math.round(pct)));
      progress.setAttribute("aria-valuetext", `${formatTime(cur)} / ${formatTime(dur)}`);
    }
    if (currentEl) currentEl.textContent = formatTime(cur);
    if (durationEl) durationEl.textContent = formatTime(dur);
  };

  const syncFullscreenUI = () => {
    const fs = Boolean(document.fullscreenElement);
    root.classList.toggle("is-fullscreen", fs);
    setIcon(fsBtn, fs ? "exitFullscreen" : "fullscreen");
    fsBtn?.setAttribute("aria-label", fs ? "退出全屏" : "全屏");
    fsBtn?.setAttribute("aria-pressed", fs ? "true" : "false");
  };

  const togglePlay = () => {
    if (video.paused || video.ended) {
      video.play().catch(() => {
        /* autoplay policy: ignore */
      });
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    if (video.muted || video.volume === 0) {
      video.muted = false;
      if (video.volume === 0) video.volume = 0.6;
    } else {
      video.muted = true;
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await root.requestFullscreen?.();
      }
    } catch {
      /* Fullscreen may be blocked */
    }
  };

  const seekFromEvent = (e) => {
    if (!progress) return;
    const rect = progress.getBoundingClientRect();
    const ratio = rect.width > 0 ? clamp((e.clientX - rect.left) / rect.width, 0, 1) : 0;
    const dur = Number.isFinite(video.duration) ? video.duration : 0;
    if (dur > 0) video.currentTime = ratio * dur;
    syncProgress();
  };

  // ── 事件绑定 ───────────────────────────────────────────
  centerBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePlay();
    emit("toggle", { playing: !video.paused });
  });

  toggleBtn?.addEventListener("click", () => {
    togglePlay();
    emit("toggle", { playing: !video.paused });
  });

  hit?.addEventListener("click", () => {
    togglePlay();
    emit("toggle", { playing: !video.paused });
  });

  muteBtn?.addEventListener("click", () => {
    toggleMute();
    emit("volume", { volume: video.volume, muted: video.muted });
  });

  fsBtn?.addEventListener("click", () => {
    toggleFullscreen();
  });

  volumeInput?.addEventListener("input", () => {
    const v = clamp(Number(volumeInput.value) / 100, 0, 1);
    video.volume = v;
    video.muted = v === 0;
    emit("volume", { volume: video.volume, muted: video.muted });
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
      if (!seeking) return;
      seekFromEvent(e);
    });
    const endSeek = (e) => {
      if (!seeking) return;
      seeking = false;
      root.classList.remove("is-seeking");
      progress.classList.remove("is-dragging");
      progress.releasePointerCapture?.(e.pointerId);
      emit("seek", { currentTime: video.currentTime });
    };
    progress.addEventListener("pointerup", endSeek);
    progress.addEventListener("pointercancel", endSeek);
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
    emit("timeupdate", { currentTime: video.currentTime, duration: video.duration });
  });
  video.addEventListener("loadedmetadata", () => {
    syncProgress();
    emit("loadedmetadata", { duration: video.duration });
  });
  video.addEventListener("volumechange", syncMuteUI);
  document.addEventListener("fullscreenchange", syncFullscreenUI);

  // 初始状态
  syncPlayUI();
  syncMuteUI();
  syncProgress();
  syncFullscreenUI();

  return {
    destroy() {
      document.removeEventListener("fullscreenchange", syncFullscreenUI);
    },
  };
}

export { ICONS, formatTime };
