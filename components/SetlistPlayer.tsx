"use client";

import { useEffect, useRef, useState } from "react";
import type { Setlist } from "@/data/setlists";
import { getYoutubeThumbnail, getYoutubeVideoId } from "@/lib/youtube";

declare global {
  interface Window {
    YT: {
      Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer;
      PlayerState: { ENDED: number; PLAYING: number; PAUSED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YTPlayer = {
  loadVideoById: (videoId: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (v: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
};

type RepeatMode = "off" | "all" | "one";

function shuffledExcept<T>(items: T[], keepFirst: T): T[] {
  const rest = items.filter((x) => x !== keepFirst);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [keepFirst, ...rest];
}

export default function SetlistPlayer({ setlist }: { setlist: Setlist }) {
  const songs = setlist.songs;
  const [current, setCurrent] = useState(0);
  const [order, setOrder] = useState<number[]>(() => songs.map((_, i) => i));
  const [shuffleOn, setShuffleOn] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [apiReady, setApiReady] = useState(
    () => typeof window !== "undefined" && !!window.YT?.Player,
  );
  const playerRef = useRef<YTPlayer | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const repeatModeRef = useRef(repeatMode);
  const orderRef = useRef(order);
  const isPlayingRef = useRef(isPlaying);
  const endHandledRef = useRef(false);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);
  useEffect(() => {
    orderRef.current = order;
  }, [order]);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const videoIds = songs.map((s) => getYoutubeVideoId(s.url));
  const currentId = videoIds[current];

  useEffect(() => {
    if (apiReady) return;
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    );
    if (!existing) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      setApiReady(true);
    };
  }, [apiReady]);

  function goRelative(step: 1 | -1) {
    const pos = orderRef.current.indexOf(current);
    const nextPos = pos + step;
    if (nextPos < 0) return;
    if (nextPos >= orderRef.current.length) {
      if (repeatModeRef.current === "all") {
        setCurrent(orderRef.current[0]);
      }
      return;
    }
    setCurrent(orderRef.current[nextPos]);
  }

  function handleEnded() {
    if (endHandledRef.current) return;
    endHandledRef.current = true;
    if (repeatModeRef.current === "one") {
      playerRef.current?.seekTo(0, true);
      playerRef.current?.playVideo();
      endHandledRef.current = false;
    } else {
      goRelative(1);
    }
  }

  useEffect(() => {
    if (!apiReady || !mountRef.current || !currentId) return;

    playerRef.current = new window.YT.Player(mountRef.current, {
      videoId: currentId,
      playerVars: { rel: 0 },
      events: {
        onReady: (e: { target: YTPlayer }) => {
          e.target.setVolume(volume);
        },
        onStateChange: (e: { data: number }) => {
          if (e.data === window.YT.PlayerState.ENDED) {
            handleEnded();
          } else if (e.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
          } else if (e.data === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false);
          }
        },
      },
    });

    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiReady]);

  // Fullscreen playback can swallow the YouTube IFrame API's onStateChange
  // (ENDED) message on some mobile browsers, so poll playback position as a
  // fallback to still auto-advance when that happens.
  useEffect(() => {
    const interval = setInterval(() => {
      const player = playerRef.current;
      if (!player || !isPlayingRef.current) return;
      const duration = player.getDuration();
      const time = player.getCurrentTime();
      if (duration > 0 && duration - time < 0.75) {
        handleEnded();
      }
    }, 500);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (playerRef.current && currentId) {
      endHandledRef.current = false;
      playerRef.current.loadVideoById(currentId);
    }
  }, [currentId]);

  function toggleShuffle() {
    setShuffleOn((on) => {
      const next = !on;
      setOrder(
        next
          ? shuffledExcept(
              songs.map((_, i) => i),
              current,
            )
          : songs.map((_, i) => i),
      );
      return next;
    });
  }

  function cycleRepeat() {
    setRepeatMode((m) => (m === "off" ? "all" : m === "all" ? "one" : "off"));
  }

  function togglePlay() {
    if (isPlaying) playerRef.current?.pauseVideo();
    else playerRef.current?.playVideo();
  }

  function handleVolume(v: number) {
    setVolume(v);
    playerRef.current?.setVolume(v);
  }

  if (songs.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-white/15 p-6 text-center text-sm text-zinc-400">
        이 콘티에는 아직 곡이 없습니다.
      </p>
    );
  }

  const pos = order.indexOf(current);
  const canPrev = pos > 0;
  const canNext = pos < order.length - 1 || repeatMode === "all";

  return (
    <div className="flex flex-col gap-4">
      <div className="aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
        {currentId ? (
          <div ref={mountRef} className="h-full w-full" />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-zinc-400">
            링크를 확인해주세요: {songs[current]?.url}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4">
        <IconButton label="셔플" active={shuffleOn} onClick={toggleShuffle}>
          <ShuffleIcon />
        </IconButton>
        <IconButton label="이전 곡" onClick={() => goRelative(-1)} disabled={!canPrev}>
          <PrevIcon />
        </IconButton>
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "일시정지" : "재생"}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-black transition hover:brightness-110"
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <IconButton label="다음 곡" onClick={() => goRelative(1)} disabled={!canNext}>
          <NextIcon />
        </IconButton>
        <IconButton
          label="반복"
          active={repeatMode !== "off"}
          onClick={cycleRepeat}
        >
          {repeatMode === "one" ? <RepeatOneIcon /> : <RepeatIcon />}
        </IconButton>
      </div>

      <div className="flex items-center gap-2 px-1">
        <VolumeIcon />
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => handleVolume(Number(e.target.value))}
          className="h-1 w-full accent-[var(--accent)]"
          aria-label="볼륨"
        />
      </div>

      <ol className="flex flex-col gap-1.5">
        {songs.map((song, i) => {
          const id = videoIds[i];
          const isCurrent = i === current;
          return (
            <li key={`${song.title}-${i}`}>
              <button
                type="button"
                onClick={() => setCurrent(i)}
                className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition ${
                  isCurrent
                    ? "bg-white/10"
                    : "hover:bg-white/5"
                }`}
              >
                <span
                  className={`w-5 shrink-0 text-center text-xs font-bold ${
                    isCurrent ? "text-[var(--accent)]" : "text-zinc-500"
                  }`}
                >
                  {isCurrent && isPlaying ? <EqualizerIcon /> : i + 1}
                </span>
                {id ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getYoutubeThumbnail(id)}
                    alt=""
                    className="h-10 w-16 shrink-0 rounded object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-16 shrink-0 items-center justify-center rounded bg-white/10 text-[10px] text-zinc-400">
                    링크 오류
                  </span>
                )}
                <span
                  className={`truncate text-sm font-medium ${
                    isCurrent ? "text-[var(--accent)]" : ""
                  }`}
                >
                  {song.title}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  active,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      className={`flex h-9 w-9 items-center justify-center rounded-full transition disabled:opacity-30 ${
        active ? "text-[var(--accent)]" : "text-zinc-300 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function ShuffleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h3.5l9 12H21M3 18h3.5l2.5-3.3M14.5 6H21M18 3l3 3-3 3M18 15l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PrevIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 5h2v14H6zM20 5v14L9 12z" />
    </svg>
  );
}
function NextIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 5h2v14h-2zM4 5v14l11-7z" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4l14 8-14 8z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
    </svg>
  );
}
function RepeatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 2l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function RepeatOneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 2l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" strokeLinecap="round" strokeLinejoin="round" />
      <text x="10.5" y="15" fontSize="8" fill="currentColor" stroke="none">1</text>
    </svg>
  );
}
function VolumeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-zinc-400">
      <path d="M4 9v6h4l5 5V4L8 9H4zM16.5 12a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z" />
    </svg>
  );
}
function EqualizerIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" className="mx-auto">
      <rect x="0" y="4" width="2" height="8" fill="currentColor">
        <animate attributeName="height" values="8;2;8" dur="0.8s" repeatCount="indefinite" />
        <animate attributeName="y" values="4;10;4" dur="0.8s" repeatCount="indefinite" />
      </rect>
      <rect x="5" y="0" width="2" height="12" fill="currentColor">
        <animate attributeName="height" values="12;4;12" dur="0.9s" repeatCount="indefinite" />
        <animate attributeName="y" values="0;8;0" dur="0.9s" repeatCount="indefinite" />
      </rect>
      <rect x="10" y="3" width="2" height="9" fill="currentColor">
        <animate attributeName="height" values="9;3;9" dur="0.7s" repeatCount="indefinite" />
        <animate attributeName="y" values="3;9;3" dur="0.7s" repeatCount="indefinite" />
      </rect>
    </svg>
  );
}
