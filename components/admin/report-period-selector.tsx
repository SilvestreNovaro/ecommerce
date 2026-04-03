"use client";

import { useRouter } from "next/navigation";

const PERIODS = [
  { value: "1", label: "Hoy" },
  { value: "7", label: "7 días" },
  { value: "30", label: "30 días" },
  { value: "365", label: "12 meses" },
];

export function ReportPeriodSelector({ current }: { current: string }) {
  const router = useRouter();

  return (
    <div className="flex gap-2">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => router.push(`/admin/reportes?period=${p.value}`)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            current === p.value
              ? "bg-black text-white"
              : "border hover:bg-gray-50"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
