import Image from "next/image";
import Link from "next/link";
import logo from "@/public/logo.png";

export default function SiteHeader() {
  return (
    <header className="border-b border-white/10 px-4 py-4">
      <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={logo}
            alt="요셉피아 중등부 로고"
            className="h-9 w-9 shrink-0 rounded-full object-cover"
            priority
          />
          <span className="flex items-baseline gap-2">
            <span className="text-base font-extrabold tracking-tight">
              JOSEPHIA
            </span>
            <span className="text-xs text-zinc-400">중등부</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
