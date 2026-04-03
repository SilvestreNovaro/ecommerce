"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type CategoryData = {
  name: string;
  revenue: number;
  units: number;
};

const COLORS = [
  "#8B5CF6",
  "#A78BFA",
  "#C4B5FD",
  "#7C3AED",
  "#6D28D9",
  "#DDD6FE",
  "#EDE9FE",
];

function formatCurrency(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: CategoryData; value: number }[];
}) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;

  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg text-sm">
      <p className="font-medium">{data.name}</p>
      <p className="text-gray-500">
        {formatCurrency(data.revenue)} — {data.units} uds
      </p>
    </div>
  );
}

export function CategoryChart({ data }: { data: CategoryData[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-500 mt-3">Sin datos.</p>;
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            dataKey="revenue"
            nameKey="name"
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value: string) => (
              <span className="text-xs text-gray-600">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
