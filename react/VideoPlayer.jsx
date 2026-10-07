import { useCallback, useEffect, useRef, useState } from "react";
import "./VideoPlayer.css";

/**
 * Twitter / X 风格视频播放器（样式 + 内联 SVG 图标）。
 *
 * 对外 props / 事件接口（与常见播放器封装一致，便于替换内部实现）：
 *   src, poster, autoPlay, muted, loop, className
 *   onPlay, onPause, onTimeUpdate, onEnded, onVolumeChange, onSeeked, onLoadedMetadata
 *
 * 播放逻辑仍绑定在原生 <video> 上；本组件只管理 UI 状态与控件，不改媒体管线。
 * 图标一律内联 SVG（viewBox 0 0 24 24），颜色走 CSS 变量。
 */

const IconPlay = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M8.2 5.3c0-.9.98-1.45 1.74-.97l10.3 6.7a1.15 1.15 0 0 1 0 1.94l-10.3 6.7c-.76.49-1.74-.06-1.74-.97V5.3z"
    />
  </svg>
);

const IconPause = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M7 5.5h3.2v13H7v-13zm6.8 0H17v13h-3.2v-13z" />
  </svg>
);

const IconVolume = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M4 9.5h3.2L12 5.4v13.2L7.2 14.5H4v-5z" />
    <path
      fill="currentColor"
      d="M14.8 8.2a4.8 4.8 0 0 1 0 7.6l-1.1-1.3a3.2 3.2 0 0 0 0-5l1.1-1.3z"
    />
    <path
      fill="currentColor"
      d="M17.4 5.6a8.2 8.2 0 0 1 0 12.8l-1.1-1.3a6.6 6.6 0 0 0 0-10.2l1.1-1.3z"
    />
  </svg>
);

const IconMuted = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M4 9.5h3.2L12 5.4v13.2L7.2 14.5H4v-5z" />
    <path
      fill="currentColor"
      d="M15.2 9.05 13.05 11.2 15.2 13.35l1.05-1.05L15.2 11.2l1.05-1.1-1.05-1.05zm3.5 0-1.05 1.05 1.05 1.1-1.05 1.05 1.05 1.05 2.15-2.15-2.15-2.15z"
    />
  </svg>
);

const IconFullscreen = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M5 5h5.2v2H7v3.2H5V5zm9 0H19v5.2h-2V7h-3V5zM5 13.8h2V17h3.2v2H5v-5.2zM13.8 17H17v-3.2h2V17h-5.2v2z"
    />
  </svg>
);

const IconExitFullscreen = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M9.2 5v2.2H7.4l3.2 3.2-1.55 1.55-3.2-3.2v1.85H5V5h4.2zm5.6 14v-2.2h1.8l-3.2-3.2 1.55-1.55 3.2 3.2v-1.85H19V19h-4.2z"
    />
  </svg>
);

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

export default function VideoPlayer({
  src,
  poster,
  autoPlay = false,
  muted: mutedProp = false,
  loop = false,
  className = "",
  onPlay,
  onPause,
  onTimeUpdate,
  onEnded,
  onVolumeChange,
  onSeeked,
  onLoadedMetadata,
}) {
  const rootRef = useRef(null);
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const seekingRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(!!mutedProp);
  const [volume, setVolume] = useState(mutedProp ? 0 : 0.8);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [seeking, setSeeking] = useState(false);

  useEffect(() => {
    setMuted(!!mutedProp);
  }, [mutedProp]);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.muted || video.volume === 0) {
      video.muted = false;
      if (video.volume === 0) {
        video.volume = 0.6;
        setVolume(0.6);
      }
      setMuted(false);
    } else {
      video.muted = true;
      setMuted(true);
    }
    onVolumeChange?.({ volume: video.volume, muted: video.muted });
  }, [onVolumeChange]);

  const toggleFullscreen = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    } else {
      root.requestFullscreen?.().catch(() => {});
    }
  }, []);

  const seekFromClientX = useCallback((clientX) => {
    const progress = progressRef.current;
    const video = videoRef.current;
    if (!progress || !video) return;
    const rect = progress.getBoundingClientRect();
    const ratio = rect.width > 0 ? clamp((clientX - rect.left) / rect.width, 0, 1) : 0;
    const dur = Number.isFinite(video.duration) ? video.duration : 0;
    if (dur > 0) {
      video.currentTime = ratio * dur;
      setCurrent(video.currentTime);
    }
  }, []);

  const pct = duration > 0 ? clamp((current / duration) * 100, 0, 100) : 0;
  const showControls = !playing || hovering || seeking;
  const isMuted = muted || volume === 0;

  return (
    <div
      ref={rootRef}
      className={[
        "x-player",
        playing ? "is-playing" : "is-paused",
        fullscreen ? "is-fullscreen" : "",
        showControls ? "is-controls-visible" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onMouseMove={() => setHovering(true)}
    >
      <div className="x-player-stage">
        <video
          ref={videoRef}
          className="x-player-video"
          src={src}
          poster={poster}
          playsInline
          autoPlay={autoPlay}
          muted={mutedProp}
          loop={loop}
          onPlay={(e) => {
            setPlaying(true);
            onPlay?.(e);
          }}
          onPause={(e) => {
            setPlaying(false);
            onPause?.(e);
          }}
          onEnded={(e) => {
            setPlaying(false);
            onEnded?.(e);
          }}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (!seekingRef.current) setCurrent(v.currentTime || 0);
            onTimeUpdate?.({
              currentTime: v.currentTime,
              duration: v.duration,
              target: v,
            });
          }}
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            setDuration(Number.isFinite(v.duration) ? v.duration : 0);
            onLoadedMetadata?.({ duration: v.duration, target: v });
          }}
          onSeeked={(e) => {
            onSeeked?.({ currentTime: e.currentTarget.currentTime });
          }}
          onVolumeChange={(e) => {
            const v = e.currentTarget;
            setVolume(v.volume);
            setMuted(v.muted);
            onVolumeChange?.({ volume: v.volume, muted: v.muted });
          }}
        />

        <button
          type="button"
          className="x-player-hit"
          aria-label={playing ? "暂停" : "播放"}
          onClick={togglePlay}
        />

        <button
          type="button"
          className="x-player-center"
          aria-label={playing ? "暂停" : "播放"}
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
        >
          {playing ? <IconPause /> : <IconPlay />}
        </button>

        <div className="x-player-controls">
          <div
            ref={progressRef}
            className={`x-player-progress${seeking ? " is-dragging" : ""}`}
            role="slider"
            tabIndex={0}
            aria-label="播放进度"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
            aria-valuetext={`${formatTime(current)} / ${formatTime(duration)}`}
            onPointerDown={(e) => {
              seekingRef.current = true;
              setSeeking(true);
              e.currentTarget.setPointerCapture?.(e.pointerId);
              seekFromClientX(e.clientX);
            }}
            onPointerMove={(e) => {
              if (!seekingRef.current) return;
              seekFromClientX(e.clientX);
            }}
            onPointerUp={(e) => {
              if (!seekingRef.current) return;
              seekingRef.current = false;
              setSeeking(false);
              e.currentTarget.releasePointerCapture?.(e.pointerId);
              onSeeked?.({ currentTime: videoRef.current?.currentTime });
            }}
            onPointerCancel={() => {
              seekingRef.current = false;
              setSeeking(false);
            }}
          >
            <div className="x-player-progress-track">
              <div className="x-player-progress-fill" style={{ width: `${pct}%` }} />
              <div className="x-player-progress-thumb" style={{ left: `${pct}%` }} />
            </div>
          </div>

          <div className="x-player-bar">
            <div className="x-player-bar-left">
              <button
                type="button"
                className="x-player-btn"
                aria-label={playing ? "暂停" : "播放"}
                onClick={togglePlay}
              >
                {playing ? <IconPause /> : <IconPlay />}
              </button>

              <div className="x-player-volume-wrap">
                <button
                  type="button"
                  className="x-player-btn"
                  aria-label={isMuted ? "取消静音" : "静音"}
                  aria-pressed={isMuted}
                  onClick={toggleMute}
                >
                  {isMuted ? <IconMuted /> : <IconVolume />}
                </button>
                <div className="x-player-volume-slider">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round((isMuted ? 0 : volume) * 100)}
                    aria-label="音量"
                    onChange={(e) => {
                      const v = clamp(Number(e.target.value) / 100, 0, 1);
                      const video = videoRef.current;
                      if (!video) return;
                      video.volume = v;
                      video.muted = v === 0;
                      setVolume(v);
                      setMuted(v === 0);
                      onVolumeChange?.({ volume: v, muted: v === 0 });
                    }}
                  />
                </div>
              </div>

              <div className="x-player-time">
                <span>{formatTime(current)}</span>
                <span className="sep">/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="x-player-bar-right">
              <button
                type="button"
                className="x-player-btn"
                aria-label={fullscreen ? "退出全屏" : "全屏"}
                aria-pressed={fullscreen}
                onClick={toggleFullscreen}
              >
                {fullscreen ? <IconExitFullscreen /> : <IconFullscreen />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
