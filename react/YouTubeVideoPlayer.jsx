import { useCallback, useEffect, useRef, useState } from "react";
import "./YouTubeVideoPlayer.css";

/**
 * YouTube 长视频播放器（样式 + 内联 SVG 图标）。
 *
 * 对外 props / 事件接口：
 *   src, poster, autoPlay, muted, loop, className, title, channel, subscribers
 *   onPlay, onPause, onTimeUpdate, onEnded, onVolumeChange, onSeeked
 *   onNext, onLike, onShare, onSubscribe, onCaptions, onSettings, onTheater
 *
 * 播放逻辑绑定在原生 <video>；图标 viewBox="0 0 24 24"，颜色 currentColor。
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

const IconNext = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M6.03 4.28A2 2 0 0 0 3 6v12a2 2 0 0 0 3.03 1.72l9.99-6a2 2 0 0 0 0-3.44l-9.99-6z"
    />
    <path fill="currentColor" d="M17.8 5H20v14h-2.2z" />
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

const IconCaptions = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth={1.8} />
    <path fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" d="M7 12h3M14 12h3M7 15h10" />
  </svg>
);

const IconSettings = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth={1.8} />
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      d="M12 2.5l1.2 2.2 2.5-.3 1 2.3 2.3 1-.3 2.5 2.2 1.2-2.2 1.2.3 2.5-2.3 1-1 2.3-2.5-.3-1.2 2.2-1.2-2.2-2.5.3-1-2.3-2.3-1 .3-2.5-2.2-1.2 2.2-1.2-.3-2.5 2.3-1 1-2.3 2.5.3z"
    />
  </svg>
);

const IconMiniplayer = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth={1.8} />
    <rect x="14" y="13" width="5" height="4" rx="0.5" fill="currentColor" />
  </svg>
);

const IconTheater = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect x="3" y="6" width="18" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth={1.8} />
    <rect x="6" y="9" width="4" height="6" fill="currentColor" />
    <rect x="14" y="9" width="4" height="6" fill="currentColor" />
  </svg>
);

const IconFullscreen = ({ exit }) =>
  exit ? (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M9.2 5v2.2H7.4l3.2 3.2-1.55 1.55-3.2-3.2v1.85H5V5h4.2zm5.6 14v-2.2h1.8l-3.2-3.2 1.55-1.55 3.2 3.2v-1.85H19V19h-4.2z"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M5 5h5.2v2H7v3.2H5V5zm9 0H19v5.2h-2V7h-3V5zM5 13.8h2V17h3.2v2H5v-5.2zM13.8 17H17v-3.2h2V17h-5.2v2z"
      />
    </svg>
  );

const IconThumbUp = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinejoin="round"
      d="M7 10v10H4V10h3zm0 0l4-7a2 2 0 0 1 2 2v3h5.2a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17 20H7"
    />
  </svg>
);

const IconShare = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinejoin="round"
      strokeLinecap="round"
      d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"
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

export default function YouTubeVideoPlayer({
  src,
  poster,
  autoPlay = false,
  muted: mutedProp = false,
  loop = false,
  className = "",
  title = "",
  channel = "",
  subscribers = "",
  onPlay,
  onPause,
  onTimeUpdate,
  onEnded,
  onVolumeChange,
  onSeeked,
  onNext,
  onLike,
  onShare,
  onSubscribe,
  onCaptions,
  onSettings,
  onTheater,
}) {
  const rootRef = useRef(null);
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const seekingRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(!!mutedProp);
  const [volume, setVolume] = useState(0.8);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [theater, setTheater] = useState(false);
  const [captions, setCaptions] = useState(false);
  const [liked, setLiked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [seeking, setSeeking] = useState(false);

  useEffect(() => setMuted(!!mutedProp), [mutedProp]);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused || v.ended) v.play().catch(() => {});
    else v.pause();
  }, []);

  const seekFromClientX = useCallback((clientX) => {
    const progress = progressRef.current;
    const v = videoRef.current;
    if (!progress || !v) return;
    const rect = progress.getBoundingClientRect();
    const ratio = rect.width > 0 ? clamp((clientX - rect.left) / rect.width, 0, 1) : 0;
    const dur = Number.isFinite(v.duration) ? v.duration : 0;
    if (dur > 0) {
      v.currentTime = ratio * dur;
      setCurrent(v.currentTime);
    }
  }, []);

  const pct = duration > 0 ? clamp((current / duration) * 100, 0, 100) : 0;
  const bufPct = duration > 0 ? clamp((buffered / duration) * 100, 0, 100) : 0;
  const showControls = !playing || hovering || seeking;

  return (
    <div
      ref={rootRef}
      className={[
        "yt-vp",
        playing ? "is-playing" : "is-paused",
        fullscreen ? "is-fullscreen" : "",
        theater ? "is-theater" : "",
        showControls ? "is-controls-visible" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="yt-vp-stage">
        <video
          ref={videoRef}
          className="yt-vp-video"
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
            onTimeUpdate?.({ currentTime: v.currentTime, duration: v.duration });
          }}
          onProgress={(e) => {
            const v = e.currentTarget;
            if (v.buffered?.length) setBuffered(v.buffered.end(v.buffered.length - 1));
          }}
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            setDuration(Number.isFinite(v.duration) ? v.duration : 0);
          }}
          onSeeked={(e) => onSeeked?.({ currentTime: e.currentTarget.currentTime })}
          onVolumeChange={(e) => {
            setVolume(e.currentTarget.volume);
            setMuted(e.currentTarget.muted);
            onVolumeChange?.({ volume: e.currentTarget.volume, muted: e.currentTarget.muted });
          }}
        />

        <button type="button" className="yt-vp-hit" aria-label={playing ? "暂停" : "播放"} onClick={togglePlay} />

        <button
          type="button"
          className="yt-vp-center"
          aria-label={playing ? "暂停" : "播放"}
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
        >
          {playing ? <IconPause /> : <IconPlay />}
        </button>

        <div className="yt-vp-controls">
          <div
            ref={progressRef}
            className={`yt-vp-progress${seeking ? " is-dragging" : ""}`}
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
              if (seekingRef.current) seekFromClientX(e.clientX);
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
            <div className="yt-vp-progress-track">
              <div className="yt-vp-progress-buffer" style={{ width: `${bufPct}%` }} />
              <div className="yt-vp-progress-fill" style={{ width: `${pct}%` }} />
              <div className="yt-vp-progress-thumb" style={{ left: `${pct}%` }} />
            </div>
          </div>

          <div className="yt-vp-bar">
            <div className="yt-vp-bar-left">
              <button type="button" className="yt-vp-btn" aria-label={playing ? "暂停" : "播放"} onClick={togglePlay}>
                {playing ? <IconPause /> : <IconPlay />}
              </button>
              <button type="button" className="yt-vp-btn" aria-label="下一个视频" onClick={() => onNext?.()}>
                <IconNext />
              </button>
              <div className="yt-vp-volume-wrap">
                <button
                  type="button"
                  className="yt-vp-btn"
                  aria-label={muted ? "取消静音" : "静音"}
                  onClick={() => {
                    const v = videoRef.current;
                    if (!v) return;
                    if (v.muted || v.volume === 0) {
                      v.muted = false;
                      if (v.volume === 0) {
                        v.volume = 0.8;
                        setVolume(0.8);
                      }
                      setMuted(false);
                    } else {
                      v.muted = true;
                      setMuted(true);
                    }
                  }}
                >
                  <IconVolume muted={muted} />
                </button>
                <div className="yt-vp-volume-slider">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round((muted ? 0 : volume) * 100)}
                    aria-label="音量"
                    onChange={(e) => {
                      const val = clamp(Number(e.target.value) / 100, 0, 1);
                      const v = videoRef.current;
                      if (!v) return;
                      v.volume = val;
                      v.muted = val === 0;
                      setVolume(val);
                      setMuted(val === 0);
                      onVolumeChange?.({ volume: val, muted: val === 0 });
                    }}
                  />
                </div>
              </div>
              <div className="yt-vp-time">
                <span>{formatTime(current)}</span>
                <span className="sep">/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="yt-vp-bar-right">
              <button
                type="button"
                className={`yt-vp-btn${captions ? " is-on" : ""}`}
                aria-label="字幕"
                aria-pressed={captions}
                onClick={() => {
                  const next = !captions;
                  setCaptions(next);
                  onCaptions?.({ enabled: next });
                }}
              >
                <IconCaptions />
              </button>
              <button type="button" className="yt-vp-btn" aria-label="设置" onClick={() => onSettings?.()}>
                <IconSettings />
              </button>
              <button type="button" className="yt-vp-btn" aria-label="画中画" onClick={() => onNext?.()}>
                <IconMiniplayer />
              </button>
              <button
                type="button"
                className={`yt-vp-btn${theater ? " is-on" : ""}`}
                aria-label="剧场模式"
                aria-pressed={theater}
                onClick={() => {
                  const next = !theater;
                  setTheater(next);
                  onTheater?.({ enabled: next });
                }}
              >
                <IconTheater />
              </button>
              <button
                type="button"
                className="yt-vp-btn"
                aria-label={fullscreen ? "退出全屏" : "全屏"}
                aria-pressed={fullscreen}
                onClick={() => {
                  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
                  else rootRef.current?.requestFullscreen?.().catch(() => {});
                }}
              >
                <IconFullscreen exit={fullscreen} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {(title || channel) && (
        <div className="yt-vp-meta">
          {title ? <h2 className="yt-vp-title">{title}</h2> : null}
          <div className="yt-vp-channel-row">
            {channel ? (
              <div className="yt-vp-channel">
                <div className="yt-vp-avatar" aria-hidden="true" />
                <div>
                  <div className="yt-vp-channel-name">{channel}</div>
                  {subscribers ? <div className="yt-vp-channel-subs">{subscribers}</div> : null}
                </div>
              </div>
            ) : null}
            <button
              type="button"
              className={`yt-vp-subscribe${subscribed ? " is-subscribed" : ""}`}
              onClick={() => {
                const next = !subscribed;
                setSubscribed(next);
                onSubscribe?.({ subscribed: next });
              }}
            >
              {subscribed ? "已订阅" : "订阅"}
            </button>
            <div className="yt-vp-actions">
              <button
                type="button"
                className={`yt-vp-chip${liked ? " is-on" : ""}`}
                aria-label={liked ? "取消赞" : "赞"}
                aria-pressed={liked}
                onClick={() => {
                  const next = !liked;
                  setLiked(next);
                  onLike?.({ liked: next });
                }}
              >
                <IconThumbUp />
                赞
              </button>
              <button type="button" className="yt-vp-chip" aria-label="分享" onClick={() => onShare?.()}>
                <IconShare />
                分享
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
