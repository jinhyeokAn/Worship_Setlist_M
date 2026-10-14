"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { setlists } from "@/data/setlists";
import { getYoutubeThumbnail, getYoutubeVideoId } from "@/lib/youtube";

const ALL_MONTHS = "all";

function coverFor(songs: { url: string }[]): string | null {
  for (const song of songs) {
    const id = getYoutubeVideoId(song.url);
    if (id) return getYoutubeThumbnail(id);
  }
  return null;
}

export default function Home() {
  const [query, setQuery] = useState("");

  const sorted = useMemo(
    () => [...setlists].sort((a, b) => b.date.localeCompare(a.date)),
    [],
  );
  const recent = sorted.slice(0, 3);

  // 날짜 내림차순으로 이미 정렬돼 있으므로, 등장 순서 그대로 중복만 제거하면 최신순이 됨.
  const yearOptions = useMemo(() => {
    const seen = new Set<string>();
    const years: string[] = [];
    for (const s of sorted) {
      const y = s.date.slice(0, 4);
      if (!seen.has(y)) {
        seen.add(y);
        years.push(y);
      }
    }
    return years;
  }, [sorted]);

  function monthsInYear(year: string): string[] {
    const seen = new Set<string>();
    const months: string[] = [];
    for (const s of sorted) {
      if (s.date.slice(0, 4) !== year) continue;
      const m = s.date.slice(5, 7);
      if (!seen.has(m)) {
        seen.add(m);
        months.push(m);
      }
    }
    return months;
  }

  const [selectedYear, setSelectedYear] = useState(() => yearOptions[0] ?? "");
  const [selectedMonth, setSelectedMonth] = useState(
    () => monthsInYear(yearOptions[0] ?? "")[0] ?? ALL_MONTHS,
  );
  const currentYearMonths = monthsInYear(selectedYear);

  function changeYear(year: string) {
    setSelectedYear(year);
    setSelectedMonth(monthsInYear(year)[0] ?? ALL_MONTHS);
  }

  const q = query.trim().toLowerCase();
  const filtered = sorted.filter(
    (s) =>
      !q ||
      s.title.toLowerCase().includes(q) ||
      s.songs.some((song) => song.title.toLowerCase().includes(q)),
  );
  // 검색 중일 땐 년/월 상관없이 전체에서 찾고, 검색이 없을 땐 고른 년/월만 보여줌.
  const displayed = q
    ? filtered
    : filtered.filter((s) => {
        if (s.date.slice(0, 4) !== selectedYear) return false;
        return selectedMonth === ALL_MONTHS || s.date.slice(5, 7) === selectedMonth;
      });

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight">
          찬양 콘티 라이브러리
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          이번 주 예배를 위해 준비된 곡들을 확인하세요.
        </p>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="콘티 검색"
          className="mt-4 w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm outline-none placeholder:text-zinc-500 focus:border-[var(--accent)]"
        />
      </header>

      {sorted.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/15 p-8 text-center text-sm text-zinc-400">
          아직 등록된 콘티가 없습니다.
          <br />
          <code className="text-xs">data/setlists.ts</code>에 콘티를 추가해보세요.
        </p>
      ) : (
        <>
          {!query && recent.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-[var(--accent)]">
                ✨ 최근 콘티
              </h2>
              <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
                {recent.map((s, i) => {
                  const cover = coverFor(s.songs);
                  return (
                    <Link
                      key={s.id}
                      href={`/setlist/${s.id}`}
                      className="group relative aspect-square w-40 shrink-0 overflow-hidden rounded-xl bg-zinc-900"
                    >
                      {cover && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cover}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover opacity-60 transition group-hover:opacity-40"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                      <span
                        className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          i === 0
                            ? "bg-[var(--accent)] text-black"
                            : "bg-white/15 text-white"
                        }`}
                      >
                        {i === 0 ? "NEW RELEASE" : "PAST SERVICE"}
                      </span>
                      <div className="absolute inset-x-0 bottom-0 p-2.5">
                        <p className="truncate text-sm font-bold">{s.title}</p>
                        <p className="text-[11px] text-zinc-300">
                          {s.songs.length}곡
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-zinc-300">
                전체 콘티 리스트
              </h2>
              {!q && (
                <div className="flex gap-1.5">
                  <select
                    value={selectedYear}
                    onChange={(e) => changeYear(e.target.value)}
                    className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300 outline-none focus:border-[var(--accent)]"
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}년
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300 outline-none focus:border-[var(--accent)]"
                  >
                    {currentYearMonths.map((m) => (
                      <option key={m} value={m}>
                        {Number(m)}월
                      </option>
                    ))}
                    <option value={ALL_MONTHS}>전체</option>
                  </select>
                </div>
              )}
            </div>
            {displayed.length === 0 ? (
              <p className="rounded-lg border border-dashed border-white/15 p-6 text-center text-sm text-zinc-400">
                {q ? "검색 결과가 없습니다." : "이 달엔 등록된 콘티가 없습니다."}
              </p>
            ) : (
              <ol className="flex flex-col gap-1">
                {displayed.map((s, i) => {
                  const cover = coverFor(s.songs);
                  const matchedSong = q
                    ? s.songs.find((song) => song.title.toLowerCase().includes(q))
                    : undefined;
                  const subtitleSong = matchedSong ?? s.songs[0];
                  return (
                    <li key={s.id}>
                      <Link
                        href={`/setlist/${s.id}`}
                        className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-white/5"
                      >
                        <span className="w-7 shrink-0 text-center text-lg font-bold text-zinc-600">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cover}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <span className="h-10 w-10 shrink-0 rounded bg-white/10" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">
                            {s.title}
                          </span>
                          <span className="block truncate text-xs text-zinc-500">
                            {matchedSong && "🎵 "}
                            {subtitleSong?.title}
                            {s.songs.length > 1 &&
                              ` 외 ${s.songs.length - 1}곡`}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs text-zinc-500">
                          {s.date}
                        </span>
                        <span className="shrink-0 rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-zinc-400">
                          {s.songs.length} Songs
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </>
      )}
    </div>
  );
}
