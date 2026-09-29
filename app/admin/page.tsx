"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  listSetlists,
  searchYoutube,
  submitSetlist,
  updateSetlist,
  verifyAdmin,
  type YoutubeSuggestion,
} from "./actions";
import type { Setlist } from "@/data/setlists";
import { getAdminAuth, setAdminAuth } from "@/lib/adminAuth";

type SongDraft = { title: string; url: string };

function emptySong(): SongDraft {
  return { title: "", url: "" };
}

/** 한 줄에 "제목,링크" (쉼표 또는 탭 구분) 형식의 여러 줄을 곡 목록으로 파싱합니다. */
function parseBulkSongs(text: string): SongDraft[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const sepIndex = line.search(/[,\t]/);
      if (sepIndex === -1) return null;
      const title = line.slice(0, sepIndex).trim();
      const url = line.slice(sepIndex + 1).trim();
      if (!title || !url) return null;
      return { title, url };
    })
    .filter((s): s is SongDraft => s !== null);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** 주어진 연/월(月은 1~12)에서 일요일에 해당하는 날짜만 반환합니다. */
function sundaysInMonth(year: number, month: number): number[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const result: number[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    if (new Date(year, month - 1, day).getDay() === 0) result.push(day);
  }
  return result;
}

/** 다가오는(오늘이 일요일이면 오늘) 예배 날짜를 연/월/일로 반환합니다. */
function defaultServiceDate(): { year: number; month: number; day: number } {
  const today = new Date();
  today.setDate(today.getDate() + ((7 - today.getDay()) % 7));
  return { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
}

/** "9월 13일 콘티" */
function titleFromParts(month: number, day: number): string {
  return `${month}월 ${day}일 콘티`;
}

function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split("-").map(Number);
  return { year, month, day };
}

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminPageInner />
    </Suspense>
  );
}

function AdminPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editParam = searchParams.get("edit");

  const [adminId, setAdminId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [checkingStoredAuth, setCheckingStoredAuth] = useState(true);
  const [loginStatus, setLoginStatus] = useState<
    { type: "idle" } | { type: "checking" } | { type: "error"; message: string }
  >({ type: "idle" });
  const [{ year, month, day }, setServiceDate] = useState(defaultServiceDate);
  const [verseReference, setVerseReference] = useState("");
  const [verseText, setVerseText] = useState("");
  const [verseLink, setVerseLink] = useState("");
  const [songs, setSongs] = useState<SongDraft[]>([emptySong()]);
  const [bulkText, setBulkText] = useState("");
  const [suggestions, setSuggestions] = useState<Record<number, YoutubeSuggestion[]>>({});
  const [suggestLoading, setSuggestLoading] = useState<number | null>(null);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [activeSuggestionRow, setActiveSuggestionRow] = useState<number | null>(null);
  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<
    | { type: "idle" }
    | { type: "submitting" }
    | { type: "error"; message: string }
    | { type: "success"; wasEditing: boolean }
  >({ type: "idle" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLoadError, setEditLoadError] = useState<string | null>(null);

  function startEdit(setlist: Setlist) {
    setEditingId(setlist.id);
    setServiceDate(parseDateParts(setlist.date));
    setVerseReference(setlist.verse?.reference ?? "");
    setVerseText(setlist.verse?.text ?? "");
    setVerseLink(setlist.verse?.link ?? "");
    setSongs(setlist.songs.map((s) => ({ title: s.title, url: s.url })));
    setStatus({ type: "idle" });
  }

  // 저장된 관리자 인증(=관리자 모드)이 있으면 자동으로 로그인 상태로 시작합니다.
  useEffect(() => {
    const stored = getAdminAuth();
    if (!stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, a client-only external system
      setCheckingStoredAuth(false);
      return;
    }
    setAdminId(stored.id);
    setAdminPassword(stored.password);
    verifyAdmin(stored.id, stored.password).then((result) => {
      if (result.ok) setIsAuthed(true);
      setCheckingStoredAuth(false);
    });
  }, []);

  // ?edit=<id>로 들어온 경우, 로그인 상태가 되면 해당 콘티를 불러와 폼에 채웁니다.
  useEffect(() => {
    if (!isAuthed || !editParam || !adminId || !adminPassword) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing stale error before a fresh fetch from GitHub
    setEditLoadError(null);
    listSetlists(adminId, adminPassword).then((result) => {
      if (!result.ok) {
        setEditLoadError(result.error);
        return;
      }
      const found = result.setlists.find((s) => s.id === editParam);
      if (found) {
        startEdit(found);
      } else {
        setEditLoadError("수정하려는 콘티를 찾을 수 없습니다.");
      }
    });
  }, [isAuthed, editParam, adminId, adminPassword]);

  const date = `${year}-${pad(month)}-${pad(day)}`;
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const dayOptions = sundaysInMonth(year, month);

  function changeYear(newYear: number) {
    const days = sundaysInMonth(newYear, month);
    setServiceDate({ year: newYear, month, day: days.includes(day) ? day : days[0] });
  }

  function changeMonth(newMonth: number) {
    const days = sundaysInMonth(year, newMonth);
    setServiceDate({ year, month: newMonth, day: days.includes(day) ? day : days[0] });
  }

  function changeDay(newDay: number) {
    setServiceDate({ year, month, day: newDay });
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginStatus({ type: "checking" });
    const result = await verifyAdmin(adminId, adminPassword);
    if (result.ok) {
      setAdminAuth({ id: adminId, password: adminPassword });
      setIsAuthed(true);
      setLoginStatus({ type: "idle" });
    } else {
      setLoginStatus({ type: "error", message: result.error });
    }
  }

  function cancelEdit() {
    router.push("/admin");
    resetForm();
  }

  function updateSong(i: number, patch: Partial<SongDraft>) {
    setSongs((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function addSong() {
    setSongs((prev) => [...prev, emptySong()]);
  }

  function removeSong(i: number) {
    setSongs((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  }

  function handleTitleChange(i: number, value: string) {
    updateSong(i, { title: value });
    setActiveSuggestionRow(i);
    setSuggestError(null);

    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    if (value.trim().length < 2) {
      setSuggestions((prev) => ({ ...prev, [i]: [] }));
      return;
    }
    suggestDebounceRef.current = setTimeout(async () => {
      setSuggestLoading(i);
      const result = await searchYoutube(adminId, adminPassword, value);
      setSuggestLoading((current) => (current === i ? null : current));
      if (result.ok) {
        setSuggestions((prev) => ({ ...prev, [i]: result.results }));
      } else {
        setSuggestError(result.error);
      }
    }, 400);
  }

  function selectSuggestion(i: number, suggestion: YoutubeSuggestion) {
    updateSong(i, { url: suggestion.url });
    setSuggestions((prev) => ({ ...prev, [i]: [] }));
    setActiveSuggestionRow(null);
  }

  function applyBulkSongs() {
    const parsed = parseBulkSongs(bulkText);
    if (parsed.length === 0) return;
    setSongs((prev) => {
      const meaningful = prev.filter((s) => s.title.trim() || s.url.trim());
      return [...meaningful, ...parsed];
    });
    setBulkText("");
  }

  function resetForm() {
    setEditingId(null);
    setServiceDate(defaultServiceDate());
    setVerseReference("");
    setVerseText("");
    setVerseLink("");
    setSongs([emptySong()]);
    setBulkText("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ type: "submitting" });

    const setlist: Setlist = {
      id: date,
      title: titleFromParts(month, day),
      date,
      songs: songs.map((s) => ({ title: s.title.trim(), url: s.url.trim() })),
      ...(verseReference.trim() || verseText.trim()
        ? {
            verse: {
              reference: verseReference.trim(),
              text: verseText.trim(),
              ...(verseLink.trim() ? { link: verseLink.trim() } : {}),
            },
          }
        : {}),
    };

    const wasEditing = editingId !== null;
    const result = editingId
      ? await updateSetlist({ adminId, adminPassword, originalId: editingId, setlist })
      : await submitSetlist({ adminId, adminPassword, setlist });

    if (result.ok) {
      setStatus({ type: "success", wasEditing });
      if (wasEditing) {
        router.push(`/setlist/${setlist.id}`);
      } else {
        resetForm();
      }
    } else {
      setStatus({ type: "error", message: result.error });
    }
  }

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-zinc-500 focus:border-[var(--accent)]";

  if (checkingStoredAuth) {
    return <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8" />;
  }

  if (!isAuthed) {
    return (
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-extrabold tracking-tight">관리자 로그인</h1>
        <p className="mt-1 text-sm text-zinc-400">
          콘티를 등록하려면 먼저 로그인하세요. 로그인하면 관리자 모드가 켜지고,
          이 브라우저에서 계속 유지됩니다 (끄려면 페이지 맨 아래 링크 사용).
        </p>

        <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4">
          <input
            className={inputClass}
            placeholder="아이디"
            value={adminId}
            onChange={(e) => setAdminId(e.target.value)}
            required
          />
          <input
            className={inputClass}
            placeholder="비밀번호"
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loginStatus.type === "checking"}
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50"
          >
            {loginStatus.type === "checking" ? "확인 중..." : "로그인"}
          </button>
          {loginStatus.type === "error" && (
            <p className="rounded-lg border border-dashed border-white/15 p-3 text-sm text-[var(--accent)]">
              {loginStatus.message}
            </p>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight">
        관리자 · 콘티 {editingId ? "수정" : "등록"}
      </h1>
      <p className="mt-1 text-sm text-zinc-400">
        등록/수정하면 GitHub에 바로 커밋되고, 잠시 후 사이트에 반영됩니다. 기존
        콘티 수정·삭제는 그 콘티 페이지에서 할 수 있습니다.
      </p>
      {editLoadError && (
        <p className="mt-3 rounded-lg border border-dashed border-white/15 p-3 text-sm text-[var(--accent)]">
          {editLoadError}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-zinc-400">
            콘티 정보
          </h2>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-zinc-400">예배 날짜</span>
            <div className="flex gap-2">
              <select
                className={inputClass}
                value={year}
                onChange={(e) => changeYear(Number(e.target.value))}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}년
                  </option>
                ))}
              </select>
              <select
                className={inputClass}
                value={month}
                onChange={(e) => changeMonth(Number(e.target.value))}
              >
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}월
                  </option>
                ))}
              </select>
              <select
                className={inputClass}
                value={day}
                onChange={(e) => changeDay(Number(e.target.value))}
              >
                {dayOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}일
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs text-zinc-500">
              일 선택지엔 그 달의 일요일만 나옵니다. 콘티 제목은 날짜에서
              자동으로 만들어집니다 (예: {titleFromParts(month, day)}).
            </span>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-zinc-400">
            말씀 (선택)
          </h2>
          <input
            className={inputClass}
            placeholder="본문 위치 (예: 요한복음 15:9)"
            value={verseReference}
            onChange={(e) => setVerseReference(e.target.value)}
          />
          <textarea
            className={`${inputClass} resize-none`}
            placeholder="본문 내용"
            rows={3}
            value={verseText}
            onChange={(e) => setVerseText(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="전체 본문 링크 (선택)"
            value={verseLink}
            onChange={(e) => setVerseLink(e.target.value)}
          />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-zinc-400">
            곡 목록
          </h2>

          <div className="rounded-lg border border-dashed border-white/15 p-3">
            <p className="text-xs text-zinc-400">
              여러 곡 한 번에 추가하기 — 한 줄에 한 곡씩, &quot;제목,링크&quot;
              형식으로 붙여넣으세요 (엑셀/스프레드시트에서 복사해도 됨).
            </p>
            <textarea
              className={`${inputClass} mt-2 resize-none font-mono text-xs`}
              rows={4}
              placeholder={"은혜,https://youtu.be/xxxxxxxxxxx\n주 은혜임을,https://www.youtube.com/watch?v=xxxxxxxxxxx"}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
            />
            <button
              type="button"
              onClick={applyBulkSongs}
              disabled={parseBulkSongs(bulkText).length === 0}
              className="mt-2 rounded-full border border-[var(--accent)]/40 px-3 py-1 text-xs text-[var(--accent)] transition hover:bg-[var(--accent)]/10 disabled:opacity-40"
            >
              {parseBulkSongs(bulkText).length > 0
                ? `${parseBulkSongs(bulkText).length}곡 목록에 추가`
                : "곡 목록에 추가"}
            </button>
          </div>

          {songs.map((song, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="relative flex-1">
                <input
                  className={inputClass}
                  placeholder={`${i + 1}번째 곡 제목 (입력하면 유튜브 검색)`}
                  value={song.title}
                  onChange={(e) => handleTitleChange(i, e.target.value)}
                  onFocus={() => setActiveSuggestionRow(i)}
                  onBlur={() => setActiveSuggestionRow(null)}
                  required
                />
                {activeSuggestionRow === i &&
                  (suggestLoading === i || (suggestions[i]?.length ?? 0) > 0 || suggestError) && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-72 overflow-y-auto rounded-lg border border-white/10 bg-zinc-900">
                      {suggestLoading === i ? (
                        <p className="p-2 text-xs text-zinc-500">검색 중...</p>
                      ) : suggestError ? (
                        <p className="p-2 text-xs text-[var(--accent)]">{suggestError}</p>
                      ) : (
                        suggestions[i]?.map((sug) => (
                          <button
                            key={sug.videoId}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectSuggestion(i, sug);
                            }}
                            className="flex w-full items-center gap-2 p-2 text-left transition hover:bg-white/5"
                          >
                            {sug.thumbnail && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={sug.thumbnail}
                                alt=""
                                className="h-8 w-12 shrink-0 rounded object-cover"
                              />
                            )}
                            <span className="truncate text-xs">{sug.title}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
              </div>
              <input
                className={`${inputClass} flex-1`}
                placeholder="유튜브 링크"
                value={song.url}
                onChange={(e) => updateSong(i, { url: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => removeSong(i)}
                aria-label="곡 삭제"
                className="shrink-0 px-2 text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSong}
            className="self-start rounded-full border border-[var(--accent)]/40 px-3 py-1 text-xs text-[var(--accent)] transition hover:bg-[var(--accent)]/10"
          >
            + 곡 추가
          </button>
        </section>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={status.type === "submitting"}
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50"
          >
            {status.type === "submitting"
              ? "저장 중..."
              : editingId
                ? "수정 저장"
                : "콘티 등록"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-400 transition hover:text-white"
            >
              취소
            </button>
          )}
        </div>

        {status.type === "error" && (
          <p className="rounded-lg border border-dashed border-white/15 p-3 text-sm text-[var(--accent)]">
            {status.message}
          </p>
        )}
        {status.type === "success" && (
          <p className="rounded-lg border border-dashed border-white/15 p-3 text-sm text-zinc-400">
            {status.wasEditing ? "수정" : "등록"}됐습니다. 배포가 끝나면 사이트에 반영됩니다.
          </p>
        )}
      </form>
    </div>
  );
}
