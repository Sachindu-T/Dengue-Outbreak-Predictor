import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export const DistrictYearlyChart = ({ data = [] }) => {
  return (
    <div className="w-full h-72 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
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
            tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
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
            formatter={(value, name) => [
              `${Number(value).toLocaleString()} cases`,
              name === "total" ? "Annual Total" : "Peak-Week Cases",
            ]}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ paddingTop: "10px", fontSize: "12px", color: "#94a3b8" }}
            formatter={(value) => (value === "total" ? "Annual Total" : "Peak Week Record")}
          />
          <Bar dataKey="total" fill="#0d5c4a" radius={[5, 5, 0, 0]} maxBarSize={38} />
          <Bar dataKey="peakCases" fill="#ea580c" radius={[5, 5, 0, 0]} maxBarSize={38} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
