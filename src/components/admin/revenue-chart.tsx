"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { toFa } from "@/lib/date";
import { toToman } from "@/lib/format";

interface DataPoint {
  label: string;
  revenue: number;
  count: number;
}

export function RevenueChart({ data }: { data: DataPoint[] }) {
  const formatted = data.map((d) => ({
    ...d,
    revenueLabel: d.revenue,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formatted} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={1} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.45} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={50}
            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : toFa(v))}
          />
          <Tooltip
            cursor={{ fill: "var(--accent)", opacity: 0.4 }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "0.5rem",
              fontSize: "12px",
              color: "var(--popover-foreground)",
            }}
            labelStyle={{ color: "var(--popover-foreground)", fontWeight: 600 }}
            formatter={(value: any, name: any, props: any) => {
              if (name === "revenueLabel") {
                return [`${toToman(Number(value))} تومان`, "درآمد"];
              }
              return [toFa(Number(value)), "تعداد"];
            }}
          />
          <Bar
            dataKey="revenueLabel"
            fill="url(#barGradient)"
            radius={[6, 6, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
