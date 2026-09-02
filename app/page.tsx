import Link from "next/link";
import { setlists } from "@/data/setlists";

export default function Home() {
  const sorted = [...setlists].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">🎵 콘티 모음</h1>
        <p className="mt-1 text-sm text-zinc-500">
          찬양 콘티별 유튜브 링크를 한 번에 모아봅니다.
        </p>
      </header>

      {sorted.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
          아직 등록된 콘티가 없습니다.
          <br />
          <code className="text-xs">data/setlists.ts</code>에 콘티를 추가해보세요.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map((s) => (
            <li key={s.id}>
              <Link
                href={`/setlist/${s.id}`}
                className="block rounded-lg border border-zinc-200 p-4 transition hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
              >
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-semibold">{s.title}</h2>
                  <span className="shrink-0 text-xs text-zinc-500">
                    {s.date}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-500">{s.songs.length}곡</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
