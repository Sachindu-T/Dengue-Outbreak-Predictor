import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { MONTHS } from "../../utils/districts";

export const DistrictRankingChart = ({
  year,
  monthIndex = null,
  limit = 12,
  rankingsData = [],
}) => {
  const isMonthly = monthIndex !== null && monthIndex !== undefined;
  const monthLabel = isMonthly ? MONTHS[monthIndex] : "Annual";

  const data = rankingsData.slice(0, limit);

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 15, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.3} />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`)}
          />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#cbd5e1", fontSize: 11, fontWeight: 500 }}
            width={85}
          />
          <Tooltip
            cursor={{ fill: "rgba(100, 116, 139, 0.1)" }}
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
              isMonthly ? `${monthLabel} ${year}` : `Annual ${year}`,
            ]}
          />
          <Bar dataKey="cases" radius={[0, 6, 6, 0]} barSize={18}>
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index === 0 ? "#e11d48" : index < 3 ? "#f97316" : index < 6 ? "#0d9488" : "#0d5c4a"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
