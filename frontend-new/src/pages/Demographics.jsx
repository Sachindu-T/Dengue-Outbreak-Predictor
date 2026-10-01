import React, { useState, useEffect } from "react";
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
import { PageLayout } from "../components/layout/PageLayout";
import { WeatherChart } from "../components/charts/WeatherChart";
import { YEARS } from "../utils/districts";
import { fetchDemographics } from "../api/client";
import { Calendar, Loader2 } from "lucide-react";

export const DemographicsPage = () => {
  const [selectedYear, setSelectedYear] = useState(2024);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    fetchDemographics(selectedYear)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [selectedYear]);

  // Population sorted
  const populationData = (data?.districts || [])
    .map((d) => ({
      name: d.name,
      population: d.population,
    }))
    .sort((a, b) => b.population - a.population);

  // Cases per 100k
  const incidenceData = (data?.districts || [])
    .map((d) => ({
      name: d.name,
      per100k: Math.round(d.incidenceRate),
    }))
    .sort((a, b) => b.per100k - a.per100k);

  const maxIncidence = incidenceData[0]?.per100k || 1;

  const monthlyWeather = data?.weatherMonthly || [];
  const yearlyWeather = data?.weatherYearly || [];

  return (
    <PageLayout
      eyebrow="Exposure & Environmental Context"
      title="Population & Meteorological Surveillance"
      description="Examine district demographic distribution, population-normalized dengue incidence rates, and recorded rainfall and temperature patterns directly from backend datasets."
      actions={
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-sm transition-colors">
          <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Year:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
          >
            {YEARS.map((y) => (
              <option key={y} value={y} className="dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                {y}
              </option>
            ))}
          </select>
        </div>
      }
    >
      {loading && !data && (
        <div className="flex items-center justify-center p-12 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
          <span className="text-sm">Fetching demographic & climate data from backend...</span>
        </div>
      )}

      {error && !data && (
        <div className="p-4 mb-6 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          Notice: {error}. Please ensure Django backend is running with the demographics endpoint.
        </div>
      )}

      {/* Grid 1: Demographics & Incidence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* District Population */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-200">
          <div className="border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              District Census Population
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Department of Census and Statistics
            </p>
          </div>

          <div className="w-full h-80 sm:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={populationData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 15, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.3} />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
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
                    `${Number(value).toLocaleString()} residents`,
                    "Population",
                  ]}
                />
                <Bar dataKey="population" fill="#0d5c4a" radius={[0, 6, 6, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incidence per 100k */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-200">
          <div className="border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Incidence Rate per 100,000 Residents ({selectedYear})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Normalized population risk profile derived from real backend cases
            </p>
          </div>

          <div className="w-full h-80 sm:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={incidenceData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 15, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.3} />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
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
                    `${Number(value).toLocaleString()} per 100k`,
                    "Incidence Rate",
                  ]}
                />
                <Bar dataKey="per100k" radius={[0, 6, 6, 0]} barSize={14}>
                  {incidenceData.map((entry, index) => {
                    const ratio = entry.per100k / maxIncidence;
                    const fill = ratio > 0.7 ? "#e11d48" : ratio > 0.4 ? "#f97316" : "#0d9488";
                    return <Cell key={`cell-${index}`} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid 2: Meteorological Surveillance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Monthly Weather */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-200">
          <div className="border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              National Climate Cycle: Rainfall vs Temperature ({selectedYear})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mean weekly precipitation (mm) and temperature (°C) by calendar month
            </p>
          </div>
          <WeatherChart data={monthlyWeather} xKey="month" />
        </div>

        {/* Multi-Year Weather */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-200">
          <div className="border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Multi-Year Meteorological Trends
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Long-term annual environmental trajectory across Sri Lanka
            </p>
          </div>
          <WeatherChart data={yearlyWeather} xKey="year" />
        </div>
      </div>
    </PageLayout>
  );
};
