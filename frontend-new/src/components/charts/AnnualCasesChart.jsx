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

export const AnnualCasesChart = ({ selectedYear = 2024, data = [] }) => {
  return (
    <div className="w-full h-72 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
          <XAxis
            dataKey="year"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
          />
          <Tooltip
            cursor={{ fill: "rgba(100, 116, 139, 0.1)" }}
            contentStyle={{
              backgroundColor: "rgba(150, 0,0, 0.75)",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
              border: "1px solid rgba(51, 65, 85, 0.6)",
              color: "#f8fafc",
              fontSize: "12px",
            }}
            formatter={(value) => [
              `${Number(value).toLocaleString()} cases`,
              "Reported Dengue Cases",
            ]}
          />
          <Bar dataKey="cases" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.year === selectedYear ? "#10b981" : "#0d5c4a"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
