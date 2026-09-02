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
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← 전체 콘티
      </Link>
      <h1 className="mt-2 text-2xl font-bold">{setlist.title}</h1>
      <p className="text-sm text-zinc-500">
        {setlist.date} · {setlist.songs.length}곡
      </p>

      {setlist.verse && (
        <blockquote className="mt-4 rounded-lg border-l-4 border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <p className="whitespace-pre-line text-sm leading-relaxed">
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
