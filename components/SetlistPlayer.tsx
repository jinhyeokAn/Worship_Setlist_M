"use client";

import { useEffect, useRef, useState } from "react";
import type { Setlist } from "@/data/setlists";
import { getYoutubeThumbnail, getYoutubeVideoId } from "@/lib/youtube";

declare global {
  interface Window {
    YT: {
      Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer;
      PlayerState: { ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YTPlayer = {
  loadVideoById: (videoId: string) => void;
  destroy: () => void;
};

export default function SetlistPlayer({ setlist }: { setlist: Setlist }) {
  const [current, setCurrent] = useState(0);
  const [apiReady, setApiReady] = useState(
    () => typeof window !== "undefined" && !!window.YT?.Player,
  );
  const playerRef = useRef<YTPlayer | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);

  const videoIds = setlist.songs.map((s) => getYoutubeVideoId(s.url));
  const currentId = videoIds[current];

  // Load the YouTube IFrame API once.
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

  // Create the player once the API is ready.
  useEffect(() => {
    if (!apiReady || !mountRef.current || !currentId) return;

    playerRef.current = new window.YT.Player(mountRef.current, {
      videoId: currentId,
      playerVars: { rel: 0 },
      events: {
        onStateChange: (e: { data: number }) => {
          if (e.data === window.YT.PlayerState.ENDED) {
            setCurrent((i) => Math.min(i + 1, setlist.songs.length - 1));
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

  // Switch video when the selected song changes.
  useEffect(() => {
    if (playerRef.current && currentId) {
      playerRef.current.loadVideoById(currentId);
    }
  }, [currentId]);

  if (setlist.songs.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
        이 콘티에는 아직 곡이 없습니다.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
        {currentId ? (
          <div ref={mountRef} className="h-full w-full" />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-zinc-300">
            링크를 확인해주세요: {setlist.songs[current]?.url}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => setCurrent((i) => Math.max(i - 1, 0))}
          disabled={current === 0}
          className="rounded-full border border-zinc-300 px-4 py-1.5 font-medium disabled:opacity-30 dark:border-zinc-700"
        >
          ← 이전 곡
        </button>
        <span className="text-zinc-500">
          {current + 1} / {setlist.songs.length}
        </span>
        <button
          type="button"
          onClick={() =>
            setCurrent((i) => Math.min(i + 1, setlist.songs.length - 1))
          }
          disabled={current === setlist.songs.length - 1}
          className="rounded-full border border-zinc-300 px-4 py-1.5 font-medium disabled:opacity-30 dark:border-zinc-700"
        >
          다음 곡 →
        </button>
      </div>

      <ol className="flex flex-col gap-2">
        {setlist.songs.map((song, i) => {
          const id = videoIds[i];
          const isCurrent = i === current;
          return (
            <li key={`${song.title}-${i}`}>
              <button
                type="button"
                onClick={() => setCurrent(i)}
                className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left transition ${
                  isCurrent
                    ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-900"
                    : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                }`}
              >
                <span className="w-5 shrink-0 text-center text-xs text-zinc-500">
                  {i + 1}
                </span>
                {id ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getYoutubeThumbnail(id)}
                    alt=""
                    className="h-10 w-16 shrink-0 rounded object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-16 shrink-0 items-center justify-center rounded bg-zinc-200 text-[10px] text-zinc-500 dark:bg-zinc-800">
                    링크 오류
                  </span>
                )}
                <span className="truncate text-sm font-medium">
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
