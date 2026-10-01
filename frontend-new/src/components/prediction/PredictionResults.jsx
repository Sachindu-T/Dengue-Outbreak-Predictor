import React from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  BedDouble,
  Sparkles,
  Thermometer,
  CloudRain,
  Activity,
} from "lucide-react";

const getRiskConfig = (risk) => {
  const r = (risk || "").toLowerCase();
  if (r.includes("crit") || r.includes("outbreak")) {
    return {
      bg: "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800",
      badge: "bg-rose-600 text-white",
      barColor: "bg-rose-600",
      icon: ShieldAlert,
      message:
        "Critical Surge Alert: Projected hospital admissions exceed dedicated dengue bed capacity. Immediate bed reallocation and emergency patient distribution recommended.",
    };
  }
  if (r.includes("high")) {
    return {
      bg: "bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800",
      badge: "bg-orange-600 text-white",
      barColor: "bg-orange-600",
      icon: AlertTriangle,
      message:
        "High Strain Alert: High ward utilization predicted. Pre-position dedicated fluids, medical personnel, and pediatric bed quotas.",
    };
  }
  if (r.includes("mod") || r.includes("warn")) {
    return {
      bg: "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800",
      badge: "bg-amber-600 text-white",
      barColor: "bg-amber-500",
      icon: Info,
      message:
        "Moderate Strain: Ward capacity is adequate but elevated. Maintain active clinical surveillance and monitoring of acute febrile illness.",
    };
  }
  return {
    bg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800",
    badge: "bg-emerald-600 text-white",
    barColor: "bg-emerald-600",
    icon: CheckCircle2,
    message:
      "Normal Baseline: Hospital bed capacity is within safe operating margins. Standard surveillance protocols active.",
  };
};

export const PredictionResults = ({ result, input }) => {
  if (!result) return null;

  const cfg = getRiskConfig(result.risk);
  const RiskIcon = cfg.icon;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Top Hero Card (All numbers directly from backend response) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-700/60 pb-5">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>{result.district?.name || "District"}</span>
              <span>•</span>
              <span>Year {input.year}, Epi Week {input.week}</span>
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
                {Number(result.predictedCases).toLocaleString()}
              </span>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                predicted weekly cases
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
              Confidence Interval: {Number(result.lowerBound).toLocaleString()} –{" "}
              {Number(result.upperBound).toLocaleString()} cases
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${cfg.badge}`}
            >
              <RiskIcon className="w-4 h-4" />
              {result.risk} Risk
            </span>
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Live Backend ML & ARIMA Data
            </span>
          </div>
        </div>

        {/* 4 Direct Backend KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-5">
          {/* Card 1: Forecasted Temp */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3.5 border border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Mean Temperature
              </span>
              <Thermometer className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
              {result.forecastedTemp}°C
            </div>
            <span className="text-[10px] text-slate-400">ARIMA Model</span>
          </div>

          {/* Card 2: Forecasted Rain */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3.5 border border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Weekly Rainfall
              </span>
              <CloudRain className="w-4 h-4 text-teal-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
              {result.forecastedRain} mm
            </div>
            <span className="text-[10px] text-slate-400">ARIMA Model</span>
          </div>

          {/* Card 3: Beds Needed */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3.5 border border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Beds Needed
              </span>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
              {Number(result.bedsNeeded).toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400">Based on Cases</span>
          </div>

          {/* Card 4: Dedicated Dengue Beds */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3.5 border border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Dengue Beds
              </span>
              <BedDouble className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
              {Number(result.dengueBeds).toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400">District Quota</span>
          </div>
        </div>
      </div>

      {/* Hospital Capacity Gauge & Risk Advisory */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
              <BedDouble className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Hospital Capacity Outlook
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {result.district?.name} Healthcare Bed Pressure
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
              {result.capacityUtilization}%
            </div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Bed Utilisation
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden my-3">
          <div
            className={`h-full rounded-full transition-all duration-500 ${cfg.barColor}`}
            style={{ width: `${Math.min(Number(result.capacityUtilization), 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-mono mb-4">
          <span>0%</span>
          <span>40% (Moderate)</span>
          <span>75% (High Strain)</span>
          <span>100%+ (Critical Outbreak)</span>
        </div>

        {/* Advisory Box */}
        <div className={`rounded-xl p-4 border ${cfg.bg}`}>
          <div className="flex items-start gap-2.5">
            <RiskIcon className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm leading-relaxed">{cfg.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
