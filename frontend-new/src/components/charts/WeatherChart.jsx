import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export const WeatherChart = ({ data = [], xKey = "month" }) => {
  return (
    <div className="w-full h-72 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
          <XAxis
            dataKey={xKey}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
          />
          <YAxis
            yAxisId="rain"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#2dd4bf", fontSize: 11 }}
            tickFormatter={(val) => `${val} mm`}
          />
          <YAxis
            yAxisId="temp"
            orientation="right"
            domain={["dataMin - 1", "dataMax + 1"]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#fb923c", fontSize: 11 }}
            tickFormatter={(val) => `${val}°C`}
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
              name === "rainfall" ? `${value} mm` : `${value}°C`,
              name === "rainfall" ? "Precipitation" : "Mean Temperature",
            ]}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ paddingTop: "10px", fontSize: "12px", color: "#94a3b8" }}
            formatter={(val) => (val === "rainfall" ? "Weekly Rainfall (mm)" : "Temperature (°C)")}
          />
          <Bar yAxisId="rain" dataKey="rainfall" fill="#0d9488" radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="temperature"
            stroke="#ea580c"
            strokeWidth={2.5}
            dot={{ r: 3, strokeWidth: 1 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
