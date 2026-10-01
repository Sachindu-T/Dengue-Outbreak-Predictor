import React, { useState } from "react";
import { Sparkles, RotateCcw, CloudSun } from "lucide-react";
import { DISTRICTS } from "../../utils/districts";

export const PredictionForm = ({ onPredict, loading }) => {
  const [districtId, setDistrictId] = useState("colombo");
  const [year, setYear] = useState(2026);
  const [week, setWeek] = useState(35);

  const handleSubmit = (e) => {
    e.preventDefault();
    onPredict({
      districtId,
      year: Number(year),
      week: Number(week),
    });
  };

  const handleReset = () => {
    setDistrictId("colombo");
    setYear(2026);
    setWeek(35);
  };

  const getWeekContext = (w) => {
    if (w >= 20 && w <= 32) return "South-West Monsoon Peak (High Vector Risk)";
    if (w >= 44 || w <= 4) return "North-East Monsoon Peak (Secondary Spike)";
    return "Inter-Monsoonal Transition Period";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* District Select */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
          Surveillance District
        </label>
        <select
          value={districtId}
          onChange={(e) => setDistrictId(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-600 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none"
        >
          {DISTRICTS.map((d) => (
            <option key={d.id} value={d.id} className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">
              {d.name} ({d.province} Province)
            </option>
          ))}
        </select>
      </div>

      {/* Year & Week Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Forecast Year
          </label>
          <input
            type="number"
            min={2026}
            max={2030}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2 text-sm font-mono focus:ring-2 focus:ring-emerald-600 focus:bg-white dark:focus:bg-slate-900 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Epi Week ({year === 2026 ? "33–52" : "1–52"})
          </label>
          <input
            type="number"
            min={year === 2026 ? 33 : 1}
            max={52}
            value={week}
            onChange={(e) => setWeek(Number(e.target.value))}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2 text-sm font-mono focus:ring-2 focus:ring-emerald-600 focus:bg-white dark:focus:bg-slate-900 outline-none"
          />
        </div>
      </div>

      {/* Week Slider with monsoon context */}
      <div>
        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1">
          <span>Week Progress</span>
          <span className="font-semibold text-emerald-800 dark:text-emerald-400">Week {week} of 52</span>
        </div>
        <input
          type="range"
          min={1}
          max={52}
          value={week}
          onChange={(e) => setWeek(Number(e.target.value))}
          className="w-full accent-emerald-700 dark:accent-emerald-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
        />
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic">
          {getWeekContext(week)}
        </p>
      </div>

      {/* Automated Weather Notice (No inputs needed, handled by ARIMA backend) */}
      <div className="rounded-xl p-3 bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 text-xs flex items-start gap-2.5">
        <CloudSun className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold">Automated Climate Forecasting:</span> Temperature & weekly rainfall are automatically forecasted by district-specific ARIMA models in the backend.
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex items-center gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl px-4 py-2.5 text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>{loading ? "Forecasting..." : "Run Outbreak Prediction"}</span>
        </button>

        <button
          type="button"
          onClick={handleReset}
          title="Reset to defaults"
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};
