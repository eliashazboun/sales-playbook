"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TopNav() {
  const pathname = usePathname();

  function navClass(path: string) {
    const active = pathname === path;

    return [
      "rounded-full px-4 py-2 text-sm font-semibold transition",
      active
        ? "bg-slate-900 text-white"
        : "text-slate-700 hover:bg-slate-100",
    ].join(" ");
  }

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4">
        <Link href="/playbook" className={navClass("/playbook")}>
          Scripts
        </Link>

        <Link href="/insurance" className={navClass("/insurance")}>
          Insurance
        </Link>
        <Link href="/lien" className={navClass("/lien")}>
          Lien Holders
        </Link>
        <Link href="/listing" className={navClass("/listing")}>
          FB Listing Helper
        </Link>
        <Link href="/test" className={navClass("/test")}>
          Testing Grounds
        </Link>
        <Link href="#" className={navClass("#")}>
          TBD
        </Link>
      </div>
    </header>
  );
}