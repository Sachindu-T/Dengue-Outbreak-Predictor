import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { MONTHS } from "../../utils/districts";

export const MonthlySeasonalityChart = ({
  year,
  monthIndex = null,
  monthlyData = [],
  weeklyWaveData = [],
}) => {
  const isMonthly = monthIndex !== null && monthIndex !== undefined;

  const data = isMonthly
    ? weeklyWaveData.map((d) => ({ label: d.week, cases: d.cases }))
    : monthlyData.map((d) => ({ label: d.month, cases: d.cases }));

  const monthLabel = isMonthly ? MONTHS[monthIndex] : "Annual";

  return (
    <div className="w-full h-72 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="casesAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : `${val}`)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
              border: "1px solid rgba(51, 65, 85, 0.6)",
              color: "#f8fafc",
              fontSize: "12px",
            }}
            formatter={(value) => [
              `${Number(value).toLocaleString()} cases`,
              isMonthly ? `${monthLabel} ${year}` : `Reported in ${year}`,
            ]}
          />
          <Area
            type="monotone"
            dataKey="cases"
            stroke="#0d9488"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#casesAreaGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
