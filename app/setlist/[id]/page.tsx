import Link from "next/link";
import { notFound } from "next/navigation";
import { setlists } from "@/data/setlists";
import SetlistPlayer from "@/components/SetlistPlayer";
import AdminSetlistControls from "@/components/AdminSetlistControls";

export default async function SetlistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const setlist = setlists.find((s) => s.id === id);
  if (!setlist) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
        ← 전체 콘티
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
        {setlist.title}
      </h1>
      <p className="text-sm text-zinc-400">
        {setlist.date} · {setlist.songs.length}곡
      </p>
      <AdminSetlistControls id={setlist.id} title={setlist.title} />

      {setlist.verse && (
        <blockquote className="mt-4 rounded-lg border-l-4 border-[var(--accent)] bg-white/5 p-4">
          <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-200">
            {setlist.verse.text}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <cite className="text-xs not-italic text-zinc-500">
              {setlist.verse.reference}
            </cite>
            {setlist.verse.link && (
              <a
                href={setlist.verse.link}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-full border border-[var(--accent)]/40 px-3 py-1 text-xs text-[var(--accent)] transition hover:bg-[var(--accent)]/10"
              >
                전체 본문 보기 ↗
              </a>
            )}
          </div>
        </blockquote>
      )}

      <div className="mt-6">
        <SetlistPlayer setlist={setlist} />
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return setlists.map((s) => ({ id: s.id }));
}
