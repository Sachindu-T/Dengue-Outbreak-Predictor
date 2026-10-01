import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const COLORS = ["#0d5c4a", "#0d9488", "#ea580c", "#d97706", "#2563eb"];

export const TopDistrictsChart = ({
  trendData = [],
  topDistricts = [],
}) => {
  const displayedDistricts = topDistricts.length > 0 ? topDistricts : [
    { name: "Colombo" },
    { name: "Gampaha" },
    { name: "Kandy" },
    { name: "Jaffna" },
    { name: "Ratnapura" }
  ];

  return (
    <div className="w-full h-72 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trendData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
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
              name,
            ]}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ paddingTop: "10px", fontSize: "12px", color: "#94a3b8" }}
          />
          {displayedDistricts.map((d, index) => (
            <Line
              key={d.name}
              type="monotone"
              dataKey={d.name}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2.5}
              dot={{ r: 3, strokeWidth: 1 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
