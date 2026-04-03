"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type DataPoint = {
  date: string;
  label: string;
  revenue: number;
  orders: number;
  prevRevenue?: number;
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
  payload?: { value: number; dataKey: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload) return null;

  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg text-sm">
      <p className="font-medium text-gray-900 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-500">
            {entry.dataKey === "prevRevenue" ? "Período anterior" : "Ingresos"}:
          </span>
          <span className="font-medium">{formatCurrency(entry.value)}</span>
        </div>
      ))}
      {payload[0] && (
        <div className="flex items-center gap-2 mt-0.5">
          <div className="h-2 w-2" />
          <span className="text-gray-500">Órdenes:</span>
          <span className="font-medium">
            {(payload[0] as unknown as { payload: DataPoint }).payload.orders}
          </span>
        </div>
      )}
    </div>
  );
}

export function SalesChart({
  data,
  showComparison,
}: {
  data: DataPoint[];
  showComparison: boolean;
}) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            tickLine={false}
            axisLine={{ stroke: "#f0f0f0" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCurrency}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          {showComparison && (
            <Area
              type="monotone"
              dataKey="prevRevenue"
              stroke="#D1D5DB"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="url(#colorPrev)"
              dot={false}
            />
          )}
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#8B5CF6"
            strokeWidth={2}
            fill="url(#colorRevenue)"
            dot={false}
            activeDot={{ r: 4, fill: "#8B5CF6", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
