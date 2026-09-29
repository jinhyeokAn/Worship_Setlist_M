"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAdminAuth, getAdminAuth } from "@/lib/adminAuth";

const TAPS_REQUIRED = 3;
const TAP_WINDOW_MS = 3000;

export default function SiteFooter() {
  const router = useRouter();
  const tapCountRef = useRef(0);
  const lastTapRef = useRef(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, a client-only external system
    setIsAdmin(!!getAdminAuth());
  }, []);

  function handleTap() {
    const now = Date.now();
    if (now - lastTapRef.current > TAP_WINDOW_MS) {
      tapCountRef.current = 0;
    }
    lastTapRef.current = now;
    tapCountRef.current += 1;

    if (tapCountRef.current >= TAPS_REQUIRED) {
      tapCountRef.current = 0;
      router.push("/admin");
    }
  }

  function turnOffAdminMode() {
    clearAdminAuth();
    window.location.reload();
  }

  return (
    <footer className="mx-auto w-full max-w-2xl border-t border-white/10 px-4 pb-10 pt-6 text-right">
      <button
        type="button"
        onClick={handleTap}
        className="text-sm italic text-zinc-600 transition hover:text-zinc-400"
      >
        Soli Deo Gloria
      </button>
      {isAdmin && (
        <div className="mt-2">
          <button
            type="button"
            onClick={turnOffAdminMode}
            className="text-xs text-zinc-600 underline hover:text-zinc-300"
          >
            관리자 모드 끄기
          </button>
        </div>
      )}
    </footer>
  );
}
