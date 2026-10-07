import { useCallback, useEffect, useRef, useState } from "react";
import "./MusicPlayer.css";

/**
 * Apple Music 风格音乐播放器（样式 + 内联 SVG 图标）。
 *
 * 对外 props / 事件接口：
 *   src, artwork, track, artist, autoPlay
 *   liked, shuffle, loop
 *   onPlay, onPause, onTimeUpdate, onEnded, onPrev, onNext
 *   onLike, onShuffle, onRepeat, onVolumeChange, onSeeked
 *   onLyrics, onQueue
 *
 * 媒体事件仍绑在原生 <audio> 上，不改播放管线。
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

const IconPrev = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M17.97 4.28A2 2 0 0 1 21 6v12a2 2 0 0 1-3.03 1.72l-9.99-6a2 2 0 0 1 0-3.44l9.99-6z"
    />
    <path fill="currentColor" d="M4 5h2.2v14H4z" />
  </svg>
);

const IconNext = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M6.03 4.28A2 2 0 0 0 3 6v12a2 2 0 0 0 3.03 1.72l9.99-6a2 2 0 0 0 0-3.44l-9.99-6z"
    />
    <path fill="currentColor" d="M17.8 5H20v14h-2.2z" />
  </svg>
);

const IconShuffle = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M18 14l4 4-4 4M18 2l4 4-4 4M2 18h1.97a4 4 0 0 0 3.3-1.7l5.45-8.6A4 4 0 0 1 16 6h6M2 6h1.97a4 4 0 0 1 3.6 2.2M22 18h-6.04a4 4 0 0 1-3.3-1.8"
    />
  </svg>
);

const IconRepeat = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"
    />
  </svg>
);

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

const IconVolume = ({ muted }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M11 5 6 9H2v6h4l5 4V5z" />
    {muted ? (
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        d="M23 9l-6 6M17 9l6 6"
      />
    ) : (
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        d="M15.5 8.5a5 5 0 0 1 0 7M18 6a9 9 0 0 1 0 12"
      />
    )}
  </svg>
);

const IconLyrics = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      d="M4 6h10M4 12h16M4 18h8"
    />
  </svg>
);

const IconQueue = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      d="M4 6h12M4 12h12M4 18h12M18 9v8M18 9l3 2M18 9l-3 2"
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

export default function MusicPlayer({
  src,
  artwork,
  track = "Now Playing",
  artist = "",
  autoPlay = false,
  liked: likedProp = false,
  shuffle: shuffleProp = false,
  loop: loopProp = false,
  className = "",
  onPlay,
  onPause,
  onTimeUpdate,
  onEnded,
  onPrev,
  onNext,
  onLike,
  onShuffle,
  onRepeat,
  onVolumeChange,
  onSeeked,
  onLyrics,
  onQueue,
}) {
  const rootRef = useRef(null);
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const seekingRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [liked, setLiked] = useState(!!likedProp);
  const [shuffle, setShuffle] = useState(!!shuffleProp);
  const [repeat, setRepeat] = useState(!!loopProp);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => setLiked(!!likedProp), [likedProp]);
  useEffect(() => setShuffle(!!shuffleProp), [shuffleProp]);
  useEffect(() => setRepeat(!!loopProp), [loopProp]);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused || a.ended) a.play().catch(() => {});
    else a.pause();
  }, []);

  const seekFromClientX = useCallback((clientX) => {
    const progress = progressRef.current;
    const a = audioRef.current;
    if (!progress || !a) return;
    const rect = progress.getBoundingClientRect();
    const ratio = rect.width > 0 ? clamp((clientX - rect.left) / rect.width, 0, 1) : 0;
    const dur = Number.isFinite(a.duration) ? a.duration : 0;
    if (dur > 0) {
      a.currentTime = ratio * dur;
      setCurrent(a.currentTime);
    }
  }, []);

  const pct = duration > 0 ? clamp((current / duration) * 100, 0, 100) : 0;

  return (
    <section
      ref={rootRef}
      className={`am-player-ui ${playing ? "is-playing" : ""} ${className}`.trim()}
      role="region"
      aria-label="音乐播放器"
    >
      <div className="am-ui-art">
        {artwork ? (
          <img src={artwork} alt="" />
        ) : (
          <div className="am-ui-art-empty">专辑封面</div>
        )}
      </div>

      <div className="am-ui-meta">
        <h2 className="am-ui-track">{track}</h2>
        {artist ? <p className="am-ui-artist">{artist}</p> : null}
      </div>

      <div
        ref={progressRef}
        className={`am-ui-progress${seekingRef.current ? " is-dragging" : ""}`}
        role="slider"
        tabIndex={0}
        aria-label="播放进度"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-valuetext={`${formatTime(current)} / ${formatTime(duration)}`}
        onPointerDown={(e) => {
          seekingRef.current = true;
          e.currentTarget.classList.add("is-dragging");
          e.currentTarget.setPointerCapture?.(e.pointerId);
          seekFromClientX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (seekingRef.current) seekFromClientX(e.clientX);
        }}
        onPointerUp={(e) => {
          if (!seekingRef.current) return;
          seekingRef.current = false;
          e.currentTarget.classList.remove("is-dragging");
          e.currentTarget.releasePointerCapture?.(e.pointerId);
          onSeeked?.({ currentTime: audioRef.current?.currentTime });
        }}
        onPointerCancel={(e) => {
          seekingRef.current = false;
          e.currentTarget.classList.remove("is-dragging");
        }}
      >
        <div className="am-ui-progress-track">
          <div className="am-ui-progress-fill" style={{ width: `${pct}%` }} />
          <div className="am-ui-progress-thumb" style={{ left: `${pct}%` }} />
        </div>
      </div>

      <div className="am-ui-times">
        <span>{formatTime(current)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      <div className="am-ui-transport">
        <button
          type="button"
          className="am-ui-btn"
          aria-label="上一首"
          onClick={() => {
            const a = audioRef.current;
            if (a && a.currentTime > 3) a.currentTime = 0;
            else onPrev?.();
          }}
        >
          <IconPrev />
        </button>
        <button
          type="button"
          className="am-ui-btn am-ui-btn-play"
          aria-label={playing ? "暂停" : "播放"}
          onClick={togglePlay}
        >
          {playing ? <IconPause /> : <IconPlay />}
        </button>
        <button type="button" className="am-ui-btn" aria-label="下一首" onClick={() => onNext?.()}>
          <IconNext />
        </button>
      </div>

      <div className="am-ui-footer">
        <div className="am-ui-side">
          <button
            type="button"
            className={`am-ui-btn${shuffle ? " is-on" : ""}`}
            aria-label="随机播放"
            aria-pressed={shuffle}
            onClick={() => {
              const next = !shuffle;
              setShuffle(next);
              onShuffle?.({ enabled: next });
            }}
          >
            <IconShuffle />
          </button>
          <button
            type="button"
            className={`am-ui-btn${repeat ? " is-on" : ""}`}
            aria-label="循环播放"
            aria-pressed={repeat}
            onClick={() => {
              const next = !repeat;
              setRepeat(next);
              if (audioRef.current) audioRef.current.loop = next;
              onRepeat?.({ enabled: next });
            }}
          >
            <IconRepeat />
          </button>
          <button
            type="button"
            className={`am-ui-btn${liked ? " is-on" : ""}`}
            aria-label={liked ? "取消喜欢" : "喜欢"}
            aria-pressed={liked}
            onClick={() => {
              const next = !liked;
              setLiked(next);
              onLike?.({ liked: next });
            }}
          >
            <IconHeart filled={liked} />
          </button>
        </div>

        <div className="am-ui-volume-wrap">
          <button
            type="button"
            className="am-ui-btn"
            aria-label={muted ? "取消静音" : "静音"}
            aria-pressed={muted}
            onClick={() => {
              const a = audioRef.current;
              if (!a) return;
              if (a.muted || a.volume === 0) {
                a.muted = false;
                if (a.volume === 0) {
                  a.volume = 0.75;
                  setVolume(0.75);
                }
                setMuted(false);
              } else {
                a.muted = true;
                setMuted(true);
              }
              onVolumeChange?.({ volume: a.volume, muted: a.muted });
            }}
          >
            <IconVolume muted={muted} />
          </button>
          <div className="am-ui-volume-slider">
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round((muted ? 0 : volume) * 100)}
              aria-label="音量"
              onChange={(e) => {
                const v = clamp(Number(e.target.value) / 100, 0, 1);
                const a = audioRef.current;
                if (!a) return;
                a.volume = v;
                a.muted = v === 0;
                setVolume(v);
                setMuted(v === 0);
                onVolumeChange?.({ volume: v, muted: v === 0 });
              }}
            />
          </div>
        </div>

        <div className="am-ui-side">
          <button type="button" className="am-ui-btn" aria-label="歌词" onClick={() => onLyrics?.()}>
            <IconLyrics />
          </button>
          <button type="button" className="am-ui-btn" aria-label="播放列表" onClick={() => onQueue?.()}>
            <IconQueue />
          </button>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={src}
        autoPlay={autoPlay}
        preload="metadata"
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
          const a = e.currentTarget;
          if (!seekingRef.current) setCurrent(a.currentTime || 0);
          onTimeUpdate?.({ currentTime: a.currentTime, duration: a.duration });
        }}
        onLoadedMetadata={(e) => {
          const a = e.currentTarget;
          setDuration(Number.isFinite(a.duration) ? a.duration : 0);
        }}
        onVolumeChange={(e) => {
          const a = e.currentTarget;
          setVolume(a.volume);
          setMuted(a.muted);
        }}
      />
    </section>
  );
}
