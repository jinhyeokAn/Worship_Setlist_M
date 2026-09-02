import Link from "next/link";
import { notFound } from "next/navigation";
import { setlists } from "@/data/setlists";
import SetlistPlayer from "@/components/SetlistPlayer";

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

      {setlist.verse && (
        <blockquote className="mt-4 rounded-lg border-l-4 border-[var(--accent)] bg-white/5 p-4">
          <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-200">
            {setlist.verse.text}
          </p>
          <cite className="mt-2 block text-xs not-italic text-zinc-500">
            {setlist.verse.reference}
          </cite>
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
