"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyUsageDay } from "@/lib/types/quota";

export function UsageChart({ days }: { days: DailyUsageDay[] }) {
  const data = days.map((d) => ({
    ...d,
    label: d.date.slice(5),
  }));

  return (
    <div className="h-56 w-full rounded-xl border border-zinc-200 bg-white/80 p-3 dark:border-zinc-700 dark:bg-zinc-900/80">
      <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
        Uso diario (últimos 7 días)
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            className="fill-zinc-500"
          />
          <YAxis tick={{ fontSize: 11 }} className="fill-zinc-500" />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid rgb(228 228 231)",
            }}
            formatter={(value) => {
              const n = typeof value === "number" ? value : Number(value);
              return [`${Number.isFinite(n) ? n : 0} tokens`, "Consumo"];
            }}
            labelFormatter={(_, payload) => {
              const p = payload?.[0]?.payload as { date?: string } | undefined;
              return p?.date ?? "";
            }}
          />
          <Bar
            dataKey="tokensUsed"
            fill="rgb(99 102 241)"
            radius={[4, 4, 0, 0]}
            name="tokens"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
