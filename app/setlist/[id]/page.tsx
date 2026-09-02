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

      <div className="mt-6">
        <SetlistPlayer setlist={setlist} />
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return setlists.map((s) => ({ id: s.id }));
}
