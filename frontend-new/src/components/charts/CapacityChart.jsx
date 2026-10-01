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

export const CapacityChart = ({ rows = [] }) => {
  const data = [...rows].sort((a, b) => b.totalBeds - a.totalBeds).slice(0, 14);

  return (
    <div className="w-full h-80 sm:h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 45 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            angle={-35}
            textAnchor="end"
            interval={0}
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
              `${Number(value).toLocaleString()} beds`,
              name === "totalBeds" ? "Total Hospital Beds" : "Dedicated Dengue Beds",
            ]}
          />
          <Legend
            iconType="circle"
            verticalAlign="top"
            wrapperStyle={{ paddingBottom: "12px", fontSize: "12px", color: "#94a3b8" }}
            formatter={(value) => (value === "totalBeds" ? "Total Hospital Beds" : "Dengue Beds (30%)")}
          />
          <Bar dataKey="totalBeds" fill="#0d5c4a" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="dengueBeds" fill="#0d9488" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
