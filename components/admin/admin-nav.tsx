"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTIONS, hasPermission } from "@/lib/permissions";
import { useAdminUser } from "@/components/admin/admin-context";

export default function AdminNav() {
  const user = useAdminUser();
  const pathname = usePathname();

  const items = SECTIONS.filter((s) => hasPermission(user, s.key));

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {items.map((s) => {
        const href = `/admin/${s.key}`;
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={s.key}
            href={href}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active ? "bg-ink text-white" : "text-ink/60 hover:bg-black/5 hover:text-ink"
            }`}
          >
            <span>{s.emoji}</span>
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
