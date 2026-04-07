"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type WeekdayData = {
  day: string;
  orders: number;
  revenue: number;
};

function formatCurrency(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string }[];
  label?: string;
}) {
  if (!active || !payload) return null;

  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="text-gray-500">
          {entry.dataKey === "revenue"
            ? `Ingresos: ${formatCurrency(entry.value)}`
            : `Órdenes: ${entry.value}`}
        </div>
      ))}
    </div>
  );
}

export function WeekdayChart({ data }: { data: WeekdayData[] }) {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            tickLine={false}
            axisLine={{ stroke: "#f0f0f0" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            tickLine={false}
            axisLine={false}
            width={35}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="orders"
            fill="#8B5CF6"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
