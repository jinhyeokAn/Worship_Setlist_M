"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAdminAuth, type AdminAuth } from "@/lib/adminAuth";
import { deleteSetlist } from "@/app/admin/actions";

export default function AdminSetlistControls({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const router = useRouter();
  const [auth, setAuth] = useState<AdminAuth | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, a client-only external system
    setAuth(getAdminAuth());
  }, []);

  if (!auth) return null;

  async function handleDelete() {
    if (!auth) return;
    if (!window.confirm(`"${title}"을(를) 삭제할까요? 되돌릴 수 없습니다.`)) return;
    setDeleting(true);
    setError(null);
    const result = await deleteSetlist({ adminId: auth.id, adminPassword: auth.password, id });
    if (result.ok) {
      router.push("/");
    } else {
      setError(result.error);
      setDeleting(false);
    }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
      <Link
        href={`/admin?edit=${id}`}
        className="rounded-full border border-[var(--accent)]/40 px-2 py-1 text-[var(--accent)] transition hover:bg-[var(--accent)]/10"
      >
        관리자: 수정
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="rounded-full border border-white/15 px-2 py-1 text-zinc-500 transition hover:text-[var(--accent)] disabled:opacity-50"
      >
        {deleting ? "삭제 중..." : "관리자: 삭제"}
      </button>
      {error && <span className="text-[var(--accent)]">{error}</span>}
    </div>
  );
}
